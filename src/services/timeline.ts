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
  /** 点赞数 */
  likeCount?: number
  /** 评论数 */
  commentCount?: number
  /** 当前用户是否已点赞 */
  likedByMe?: boolean
}

export type LoveRecordComment = {
  id: number
  recordId: string
  userId: string
  authorUsername: string
  content: string
  createdAt: string
}

export type LoveRecordCommentPage = {
  total: number
  page: number
  pageSize: number
  comments: LoveRecordComment[]
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

export type LikeState = { likeCount: number; likedByMe: boolean }

export async function toggleTimelineLike(recordId: string) {
  const { data } = await http.post<ApiResponse<LikeState>>(`/api/v1/timeline/records/${recordId}/like`)
  return data
}

export async function listTimelineComments(recordId: string, page = 1, pageSize = 20) {
  const { data } = await http.get<ApiResponse<LoveRecordCommentPage>>(
    `/api/v1/timeline/records/${recordId}/comments`,
    { params: { page, pageSize } },
  )
  return data
}

export async function postTimelineComment(recordId: string, content: string) {
  const { data } = await http.post<ApiResponse<LoveRecordComment>>(`/api/v1/timeline/records/${recordId}/comments`, {
    content,
  })
  return data
}

export async function deleteTimelineComment(recordId: string, commentId: number) {
  const { data } = await http.delete<ApiResponse<null>>(
    `/api/v1/timeline/records/${recordId}/comments/${commentId}`,
  )
  return data
}

/** 上传时间轴图片或视频（整文件 multipart），返回可写入 {@code imagesJson} 的 URL */
export async function uploadTimelineMedia(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await http.post<ApiResponse<string>>('/api/v1/timeline/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
