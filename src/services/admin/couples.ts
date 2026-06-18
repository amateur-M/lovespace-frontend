import type { ApiResponse } from '../../types/api'
import { http } from '../http'
import type { AdminPage } from './users'

export type AdminCoupleItem = {
  id: string
  userId1: string
  userId2: string
  user1Phone?: string | null
  user2Phone?: string | null
  user1Name?: string | null
  user2Name?: string | null
  startDate?: string | null
  status: number
  createdAt?: string | null
  updatedAt?: string | null
}

export async function fetchAdminCouples(params: {
  status?: number
  keyword?: string
  page?: number
  pageSize?: number
}) {
  const { data } = await http.get<ApiResponse<AdminPage<AdminCoupleItem>>>(
    '/api/v1/admin/couples',
    { params },
  )
  return data
}

export async function forceSeparateCouple(id: string) {
  const { data } = await http.post<ApiResponse<null>>(`/api/v1/admin/couples/${id}/force-separate`)
  return data
}
