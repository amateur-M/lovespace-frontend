import type { ApiResponse } from '../../types/api'
import { http } from '../http'
import type { AdminPage } from './users'

export type AdminMemorialDay = {
  id: string
  coupleId: string
  name: string
  memorialDate?: string | null
  description?: string | null
  createdAt?: string | null
}

export async function fetchAdminMemorialDays(params: {
  coupleId?: string
  page?: number
  pageSize?: number
}) {
  const { data } = await http.get<ApiResponse<AdminPage<AdminMemorialDay>>>(
    '/api/v1/admin/memorial-days',
    { params },
  )
  return data
}

export async function deleteAdminMemorialDay(id: string) {
  const { data } = await http.delete<ApiResponse<null>>(`/api/v1/admin/memorial-days/${id}`)
  return data
}
