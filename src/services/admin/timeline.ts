import type { ApiResponse } from '../../types/api'
import { http } from '../http'
import type { AdminPage } from './users'

export type AdminTimelineRecord = {
  id: string
  coupleId: string
  authorId: string
  recordDate?: string | null
  content?: string | null
  mood?: string | null
  visibility?: number | null
  createdAt?: string | null
}

export async function fetchAdminTimelineRecords(params: {
  coupleId?: string
  userId?: string
  page?: number
  pageSize?: number
}) {
  const { data } = await http.get<ApiResponse<AdminPage<AdminTimelineRecord>>>(
    '/api/v1/admin/timeline/records',
    { params },
  )
  return data
}

export async function deleteAdminTimelineRecord(id: string) {
  const { data } = await http.delete<ApiResponse<null>>(`/api/v1/admin/timeline/records/${id}`)
  return data
}
