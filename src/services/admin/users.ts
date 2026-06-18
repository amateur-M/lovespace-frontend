import type { User } from '../auth'
import type { ApiResponse } from '../../types/api'
import { http } from '../http'

export type AdminPage<T> = {
  records: T[]
  total: number
  size: number
  current: number
  pages?: number
}

export type AdminUserUpdatePayload = {
  status?: number
  role?: number
}

export async function fetchAdminUsers(params: {
  keyword?: string
  page?: number
  pageSize?: number
}) {
  const { data } = await http.get<ApiResponse<AdminPage<User>>>('/api/v1/admin/users', { params })
  return data
}

export async function updateAdminUser(id: string, payload: AdminUserUpdatePayload) {
  const { data } = await http.put<ApiResponse<User>>(`/api/v1/admin/users/${id}`, payload)
  return data
}

export async function deleteAdminUser(id: string) {
  const { data } = await http.delete<ApiResponse<null>>(`/api/v1/admin/users/${id}`)
  return data
}
