import type { ApiResponse } from '../../types/api'
import { http } from '../http'
import type { AdminPage } from './users'

export type AdminAlbum = {
  id: string
  coupleId: string
  name: string
  coverImageUrl?: string | null
  createdAt?: string | null
}

export type AdminPhoto = {
  id: string
  albumId: string
  uploaderId: string
  imageUrl?: string | null
  description?: string | null
  createdAt?: string | null
}

export async function fetchAdminAlbums(params: {
  coupleId?: string
  page?: number
  pageSize?: number
}) {
  const { data } = await http.get<ApiResponse<AdminPage<AdminAlbum>>>('/api/v1/admin/albums', {
    params,
  })
  return data
}

export async function deleteAdminAlbum(id: string) {
  const { data } = await http.delete<ApiResponse<null>>(`/api/v1/admin/albums/${id}`)
  return data
}

export async function fetchAdminPhotos(params: {
  albumId?: string
  page?: number
  pageSize?: number
}) {
  const { data } = await http.get<ApiResponse<AdminPage<AdminPhoto>>>(
    '/api/v1/admin/albums/photos',
    { params },
  )
  return data
}

export async function deleteAdminPhoto(id: string) {
  const { data } = await http.delete<ApiResponse<null>>(`/api/v1/admin/albums/photos/${id}`)
  return data
}
