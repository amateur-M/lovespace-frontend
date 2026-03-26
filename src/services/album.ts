import { http } from './http'
import type { ApiResponse } from '../types/api'

export type Album = {
  id: string
  coupleId: string
  name: string
  coverImageUrl?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type AlbumPhoto = {
  id: string
  albumId: string
  uploaderId: string
  imageUrl: string
  thumbnailUrl?: string | null
  description?: string | null
  locationJson?: string | null
  takenDate?: string | null
  tagsJson?: string | null
  isFavorite?: number | null
  createdAt?: string | null
}

export type CreateAlbumBody = {
  coupleId: string
  name: string
  coverImageUrl?: string | null
}

export type UploadPhotoExtra = {
  thumbnailUrl?: string | null
  description?: string | null
  locationJson?: string | null
  takenDate?: string | null
  tagsJson?: string | null
}

export async function listAlbums(coupleId: string) {
  const { data } = await http.get<ApiResponse<Album[]>>('/api/v1/albums', { params: { coupleId } })
  return data
}

export async function createAlbum(body: CreateAlbumBody) {
  const { data } = await http.post<ApiResponse<Album>>('/api/v1/albums', body)
  return data
}

export async function deleteAlbum(albumId: string) {
  const { data } = await http.delete<ApiResponse<unknown>>(`/api/v1/albums/${albumId}`)
  return data
}

export type AlbumPhotoPage = {
  total: number
  page: number
  pageSize: number
  photos: AlbumPhoto[]
}

/** 分页列出相册照片，默认每页 10 条，按创建时间倒序。 */
export async function listAlbumPhotos(albumId: string, page = 1, pageSize = 10) {
  const { data } = await http.get<ApiResponse<AlbumPhotoPage>>(`/api/v1/albums/${albumId}/photos`, {
    params: { page, pageSize },
  })
  return data
}

export async function uploadAlbumPhoto(albumId: string, file: File, extra?: UploadPhotoExtra) {
  const formData = new FormData()
  formData.append('file', file)
  if (extra?.thumbnailUrl) formData.append('thumbnailUrl', extra.thumbnailUrl)
  if (extra?.description) formData.append('description', extra.description)
  if (extra?.locationJson) formData.append('locationJson', extra.locationJson)
  if (extra?.takenDate) formData.append('takenDate', extra.takenDate)
  if (extra?.tagsJson) formData.append('tagsJson', extra.tagsJson)
  const { data } = await http.post<ApiResponse<AlbumPhoto>>(`/api/v1/albums/${albumId}/photos`, formData)
  return data
}

export async function deleteAlbumPhoto(albumId: string, photoId: string) {
  const { data } = await http.delete<ApiResponse<unknown>>(`/api/v1/albums/${albumId}/photos/${photoId}`)
  return data
}

export async function setAlbumPhotoFavorite(albumId: string, photoId: string, isFavorite: boolean) {
  const { data } = await http.put<ApiResponse<unknown>>(
    `/api/v1/albums/${albumId}/photos/${photoId}/favorite`,
    { isFavorite },
  )
  return data
}
