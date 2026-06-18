import type { ApiResponse } from '../../types/api'
import { http } from '../http'
import type { AdminPage } from './users'

export type AdminMessage = {
  id: string
  coupleId: string
  senderId: string
  receiverId: string
  content?: string | null
  messageType?: string | null
  isRead?: number | null
  isRetracted?: number | null
  createdAt?: string | null
}

export async function fetchAdminMessages(params: {
  coupleId?: string
  senderId?: string
  page?: number
  pageSize?: number
}) {
  const { data } = await http.get<ApiResponse<AdminPage<AdminMessage>>>(
    '/api/v1/admin/messages',
    { params },
  )
  return data
}

export async function deleteAdminMessage(id: string) {
  const { data } = await http.delete<ApiResponse<null>>(`/api/v1/admin/messages/${id}`)
  return data
}
