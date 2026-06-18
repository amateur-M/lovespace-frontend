import type { ApiResponse } from '../../types/api'
import { http } from '../http'

export type AdminDashboardStats = {
  userCount: number
  coupleCount: number
  timelineRecordCount: number
  albumCount: number
  photoCount: number
  messageCount: number
  planCount: number
  memorialDayCount: number
  loveQaDocumentCount: number
  loveQaConversationCount: number
}

export async function fetchDashboardStats() {
  const { data } = await http.get<ApiResponse<AdminDashboardStats>>('/api/v1/admin/dashboard/stats')
  return data
}
