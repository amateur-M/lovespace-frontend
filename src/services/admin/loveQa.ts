import type { ApiResponse } from '../../types/api'
import { http } from '../http'
import type { AdminPage } from './users'

export type AdminLoveQaDocument = {
  documentId: string
  coupleId?: string | null
  ownerUserId?: string | null
  title?: string | null
  scope?: string | null
  status?: string | null
  chunkCount?: number | null
  createdAt?: string | null
}

export type AdminLoveQaConversation = {
  conversationId: string
  userId: string
  coupleId?: string | null
  title?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export async function fetchAdminLoveQaDocuments(params: {
  scope?: string
  coupleId?: string
  page?: number
  pageSize?: number
}) {
  const { data } = await http.get<ApiResponse<AdminPage<AdminLoveQaDocument>>>(
    '/api/v1/admin/love-qa/documents',
    { params },
  )
  return data
}

export async function deleteAdminLoveQaDocument(id: string) {
  const { data } = await http.delete<ApiResponse<null>>(`/api/v1/admin/love-qa/documents/${id}`)
  return data
}

export async function fetchAdminLoveQaConversations(params: { page?: number; pageSize?: number }) {
  const { data } = await http.get<ApiResponse<AdminPage<AdminLoveQaConversation>>>(
    '/api/v1/admin/love-qa/conversations',
    { params },
  )
  return data
}
