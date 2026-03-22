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

export async function listTimelineRecords(coupleId: string, page: number, pageSize: number) {
  const { data } = await http.get<ApiResponse<LoveRecordPage>>('/api/v1/timeline/records', {
    params: { coupleId, page, pageSize },
  })
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

export async function createTimelineRecord(body: CreateLoveRecordBody) {
  const { data } = await http.post<ApiResponse<LoveRecord>>('/api/v1/timeline/records', body)
  return data
}

export async function uploadTimelineImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await http.post<ApiResponse<string>>('/api/v1/timeline/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
