import { http } from './http'
import type { ApiResponse } from '../types/api'

export type MemorialDay = {
  id: string
  coupleId: string
  userId: string
  name: string
  description?: string | null
  memorialDate: string
  createdAt?: string | null
  updatedAt?: string | null
}

export type MemorialNextPayload = {
  memorial: MemorialDay | null
  nextOccurrenceDate: string | null
  daysUntil: number
  millisecondsUntilNext: number
  today: boolean
}

export type MemorialUpcomingItem = {
  id: string
  name: string
  memorialDate: string
  nextOccurrenceDate: string
  daysUntil: number
  millisecondsUntilNext: number
  today: boolean
}

export type CreateMemorialBody = {
  coupleId: string
  name: string
  description?: string | null
  memorialDate: string
}

export type UpdateMemorialBody = {
  name: string
  description?: string | null
  memorialDate: string
}

export async function listMemorialDays(coupleId: string): Promise<ApiResponse<MemorialDay[]>> {
  const { data } = await http.get<ApiResponse<MemorialDay[]>>('/api/v1/memorial-days', {
    params: { coupleId },
  })
  return data
}

export async function getMemorialDay(id: string): Promise<ApiResponse<MemorialDay>> {
  const { data } = await http.get<ApiResponse<MemorialDay>>(`/api/v1/memorial-days/${id}`)
  return data
}

export async function createMemorial(body: CreateMemorialBody): Promise<ApiResponse<MemorialDay>> {
  const { data } = await http.post<ApiResponse<MemorialDay>>('/api/v1/memorial-days', body)
  return data
}

export async function updateMemorial(
  id: string,
  body: UpdateMemorialBody,
): Promise<ApiResponse<MemorialDay>> {
  const { data } = await http.put<ApiResponse<MemorialDay>>(`/api/v1/memorial-days/${id}`, body)
  return data
}

export async function deleteMemorial(id: string): Promise<ApiResponse<void>> {
  const { data } = await http.delete<ApiResponse<void>>(`/api/v1/memorial-days/${id}`)
  return data
}

/** 轮询倒计时：使用较短超时避免堆积 */
export async function getNextMemorial(
  coupleId: string,
  useCache = true,
): Promise<ApiResponse<MemorialNextPayload>> {
  const { data } = await http.get<ApiResponse<MemorialNextPayload>>('/api/v1/memorial-days/next', {
    params: { coupleId, useCache },
    timeout: 10_000,
  })
  return data
}

export async function listUpcomingMemorials(
  coupleId: string,
  useCache = true,
): Promise<ApiResponse<MemorialUpcomingItem[]>> {
  const { data } = await http.get<ApiResponse<MemorialUpcomingItem[]>>(
    '/api/v1/memorial-days/upcoming',
    { params: { coupleId, useCache }, timeout: 10_000 },
  )
  return data
}

/** 月日键，用于日历格子上标记（忽略年份） */
export function monthDayKey(isoDate: string): string {
  return isoDate.slice(5, 10)
}
