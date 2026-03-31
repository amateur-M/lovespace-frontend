import { http } from './http'

export type LoveRecord = {
  id: string
  coupleId: string
  authorId: string
  recordDate: string
  content: string
  mood: string
  locationJson?: string | null
  visibility: number
  tagsJson?: string | null
  imagesJson?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type LoveRecordPage = {
  total: number
  page: number
  pageSize: number
  records: LoveRecord[]
}

type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

export type TimelineListRange = {
  /** YYYY-MM-DD，含当天 */
  startDate?: string
  endDate?: string
}

export async function listTimelineRecords(
  coupleId: string,
  page: number,
  pageSize: number,
  range?: TimelineListRange | null,
) {
  const params: Record<string, string | number> = { coupleId, page, pageSize }
  if (range?.startDate) params.startDate = range.startDate
  if (range?.endDate) params.endDate = range.endDate
  const { data } = await http.get<ApiResponse<LoveRecordPage>>('/api/v1/timeline/records', { params })
  return data
}

export type CreateLoveRecordBody = {
  coupleId: string
  recordDate: string
  content: string
  mood: string
  locationJson?: string | null
  visibility: number
  tagsJson?: string | null
  imagesJson?: string | null
}

/** 与后端 {@code love_records.visibility} 一致：1 仅自己，2 情侣双方 */
export const VISIBILITY_SELF = 1
export const VISIBILITY_COUPLE = 2

export async function createTimelineRecord(body: CreateLoveRecordBody) {
  const { data } = await http.post<ApiResponse<LoveRecord>>('/api/v1/timeline/records', body)
  return data
}

export type UpdateLoveRecordBody = {
  recordDate?: string
  content?: string
  mood?: string
  locationJson?: string | null
  visibility?: number
  tagsJson?: string | null
  imagesJson?: string | null
}

export async function updateTimelineRecord(id: string, body: UpdateLoveRecordBody) {
  const { data } = await http.put<ApiResponse<LoveRecord>>(`/api/v1/timeline/records/${id}`, body)
  return data
}

export async function deleteTimelineRecord(id: string) {
  const { data } = await http.delete<ApiResponse<null>>(`/api/v1/timeline/records/${id}`)
  return data
}

/** 上传时间轴图片或视频，返回可写入 {@code imagesJson} 的 URL */
export async function uploadTimelineMedia(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await http.post<ApiResponse<string>>('/api/v1/timeline/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

const CHUNK_HTTP_TIMEOUT_MS = 180_000

export type TimelineChunkInitBody = {
  fileName: string
  fileSize: number
  contentType?: string
}

export type TimelineChunkInitData = {
  uploadId: string
  chunkSize: number
  totalChunks: number
}

export type TimelineChunkStatusData = {
  uploadId: string
  chunkSize: number
  totalChunks: number
  totalSize: number
  uploadedIndices: number[]
  complete: boolean
}

function chunkStorageKey(file: File): string {
  const safe = file.name.replace(/[^\w.-]+/g, '_').slice(0, 120)
  return `ls_tl_chunk_${safe}_${file.size}_${file.lastModified}`
}

export async function initTimelineChunkUpload(body: TimelineChunkInitBody) {
  const { data } = await http.post<ApiResponse<TimelineChunkInitData>>('/api/v1/timeline/uploads/init', body)
  return data
}

export async function getTimelineChunkStatus(uploadId: string) {
  const { data } = await http.get<ApiResponse<TimelineChunkStatusData>>(
    `/api/v1/timeline/uploads/${uploadId}/status`,
  )
  return data
}

export async function putTimelineChunk(uploadId: string, chunkIndex: number, blob: Blob) {
  const { data } = await http.put<ApiResponse<null>>(
    `/api/v1/timeline/uploads/${uploadId}/chunks/${chunkIndex}`,
    blob,
    {
      headers: { 'Content-Type': 'application/octet-stream' },
      timeout: CHUNK_HTTP_TIMEOUT_MS,
    },
  )
  return data
}

export async function completeTimelineChunkUpload(uploadId: string) {
  const { data } = await http.post<ApiResponse<string>>(
    `/api/v1/timeline/uploads/${uploadId}/complete`,
    {},
    { timeout: CHUNK_HTTP_TIMEOUT_MS },
  )
  return data
}

/**
 * 分片 + 断点续传（localStorage 记住 uploadId；刷新后可继续传缺失分片）。
 * 完成后返回最终媒体 URL。
 */
export async function uploadTimelineMediaResumable(file: File): Promise<string> {
  const storageKey = chunkStorageKey(file)
  let uploadId: string | null = null
  let chunkSize = 0
  let totalChunks = 0
  let uploaded = new Set<number>()

  const saved = localStorage.getItem(storageKey)
  if (saved) {
    try {
      const o = JSON.parse(saved) as { uploadId?: string }
      if (o.uploadId) {
        const st = await getTimelineChunkStatus(o.uploadId)
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
    const init = await initTimelineChunkUpload({
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
    const put = await putTimelineChunk(uploadId, i, blob)
    if (put.code !== 0) {
      throw new Error(put.message || `分片 ${i} 上传失败`)
    }
    uploaded.add(i)
  }

  const done = await completeTimelineChunkUpload(uploadId)
  if (done.code !== 0 || !done.data) {
    throw new Error(done.message || '合并分片失败')
  }
  localStorage.removeItem(storageKey)
  return done.data
}

/** 超过阈值用大文件分片；否则整文件 multipart。 */
export async function uploadTimelineMediaAuto(file: File, thresholdBytes: number): Promise<string> {
  if (file.size > thresholdBytes) {
    return uploadTimelineMediaResumable(file)
  }
  const resp = await uploadTimelineMedia(file)
  if (resp.code !== 0 || !resp.data) {
    throw new Error(resp.message || '上传失败')
  }
  return resp.data
}
