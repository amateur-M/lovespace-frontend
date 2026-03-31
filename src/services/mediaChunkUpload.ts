import { http } from './http'
import { uploadTimelineMedia } from './timeline'

type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

/** 与后端 {@link MediaChunkTarget} 一致 */
export type MediaChunkTarget = 'TIMELINE' | 'ALBUM'

const CHUNK_HTTP_TIMEOUT_MS = 180_000
const API_BASE = '/api/v1/media/uploads'

/** 超过此大小走分片（应小于服务端单片大小，默认 5MB） */
export const MEDIA_CHUNK_THRESHOLD_BYTES = 4 * 1024 * 1024

export type MediaChunkInitBody = {
  target: MediaChunkTarget
  albumId?: string
  fileName: string
  fileSize: number
  contentType?: string
}

export type MediaChunkInitData = {
  uploadId: string
  chunkSize: number
  totalChunks: number
}

export type MediaChunkStatusData = {
  uploadId: string
  chunkSize: number
  totalChunks: number
  totalSize: number
  uploadedIndices: number[]
  complete: boolean
}

function chunkStorageKey(target: MediaChunkTarget, albumId: string | undefined, file: File): string {
  const safe = file.name.replace(/[^\w.-]+/g, '_').slice(0, 120)
  const alb = albumId ?? '-'
  return `ls_media_chunk_${target}_${alb}_${safe}_${file.size}_${file.lastModified}`
}

export async function initMediaChunkUpload(body: MediaChunkInitBody) {
  const { data } = await http.post<ApiResponse<MediaChunkInitData>>(`${API_BASE}/init`, body)
  return data
}

export async function getMediaChunkStatus(uploadId: string) {
  const { data } = await http.get<ApiResponse<MediaChunkStatusData>>(`${API_BASE}/${uploadId}/status`)
  return data
}

export async function putMediaChunk(uploadId: string, chunkIndex: number, blob: Blob) {
  const { data } = await http.put<ApiResponse<null>>(`${API_BASE}/${uploadId}/chunks/${chunkIndex}`, blob, {
    headers: { 'Content-Type': 'application/octet-stream' },
    timeout: CHUNK_HTTP_TIMEOUT_MS,
  })
  return data
}

export async function completeMediaChunkUpload(uploadId: string) {
  const { data } = await http.post<ApiResponse<string>>(
    `${API_BASE}/${uploadId}/complete`,
    {},
    { timeout: CHUNK_HTTP_TIMEOUT_MS },
  )
  return data
}

/**
 * 分片 + 断点续传；完成后返回对象存储 URL（时间轴写入 imagesJson；相册需再调 register API）。
 */
export async function uploadMediaResumable(params: {
  target: MediaChunkTarget
  albumId?: string
  file: File
}): Promise<string> {
  const { target, albumId, file } = params
  if (target === 'ALBUM' && !albumId) {
    throw new Error('albumId required for ALBUM target')
  }

  const storageKey = chunkStorageKey(target, albumId, file)
  let uploadId: string | null = null
  let chunkSize = 0
  let totalChunks = 0
  let uploaded = new Set<number>()

  const saved = localStorage.getItem(storageKey)
  if (saved) {
    try {
      const o = JSON.parse(saved) as { uploadId?: string }
      if (o.uploadId) {
        const st = await getMediaChunkStatus(o.uploadId)
        if (st.code === 0 && st.data) {
          uploadId = o.uploadId
          chunkSize = st.data.chunkSize
          totalChunks = st.data.totalChunks
          uploaded = new Set(st.data.uploadedIndices)
        } else {
          localStorage.removeItem(storageKey)
        }
      }
    } catch {
      localStorage.removeItem(storageKey)
    }
  }

  if (!uploadId) {
    const init = await initMediaChunkUpload({
      target,
      albumId: target === 'ALBUM' ? albumId : undefined,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || undefined,
    })
    if (init.code !== 0 || !init.data) {
      throw new Error(init.message || '分片上传初始化失败')
    }
    uploadId = init.data.uploadId
    chunkSize = init.data.chunkSize
    totalChunks = init.data.totalChunks
    localStorage.setItem(storageKey, JSON.stringify({ uploadId }))
    uploaded = new Set()
  }

  if (!uploadId || chunkSize <= 0 || totalChunks <= 0) {
    throw new Error('分片会话无效，请重试')
  }

  for (let i = 0; i < totalChunks; i++) {
    if (uploaded.has(i)) continue
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const blob = file.slice(start, end)
    const put = await putMediaChunk(uploadId, i, blob)
    if (put.code !== 0) {
      throw new Error(put.message || `分片 ${i} 上传失败`)
    }
    uploaded.add(i)
  }

  const done = await completeMediaChunkUpload(uploadId)
  if (done.code !== 0 || !done.data) {
    throw new Error(done.message || '合并分片失败')
  }
  localStorage.removeItem(storageKey)
  return done.data
}

/** 时间轴：超过阈值分片，否则 multipart 直传。 */
export async function uploadTimelineMediaAuto(
  file: File,
  thresholdBytes: number = MEDIA_CHUNK_THRESHOLD_BYTES,
): Promise<string> {
  if (file.size > thresholdBytes) {
    return uploadMediaResumable({ target: 'TIMELINE', file })
  }
  const resp = await uploadTimelineMedia(file)
  if (resp.code !== 0 || !resp.data) {
    throw new Error(resp.message || '上传失败')
  }
  return resp.data
}
