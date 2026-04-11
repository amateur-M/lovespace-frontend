import type { User } from './auth'
import { http } from './http'

/** 后端 GET /api/v1/couple/info 成功时的 data */
export type CoupleInfo = {
  bindingId: string
  startDate: string | null
  relationshipDays: number
  status: number
  partner: User
}

export type CoupleInviteResponse = {
  bindingId: string
}

/** 待处理情侣邀请（被邀请方） */
export type CouplePendingInvite = {
  bindingId: string
  inviter: User
  invitedAt: string
}

type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

/** 未绑定或已解除时业务码 */
export const COUPLE_NOT_BOUND_CODE = 40442

/**
 * 查询当前情侣信息（交往中 / 冻结）。
 * @returns 未绑定时 `code === COUPLE_NOT_BOUND_CODE`，`data` 可能为 null
 */
export async function getCoupleInfo() {
  const { data } = await http.get<ApiResponse<CoupleInfo | null>>('/api/v1/couple/info')
  return data
}

export async function inviteCouple(inviteeUserId: string) {
  const { data } = await http.post<ApiResponse<CoupleInviteResponse>>('/api/v1/couple/invite', {
    inviteeUserId,
  })
  return data
}

export async function acceptCouple(bindingId: string, startDate?: string | null) {
  const { data } = await http.post<ApiResponse<CoupleInfo>>('/api/v1/couple/accept', {
    bindingId,
    startDate: startDate ?? null,
  })
  return data
}

export async function updateCoupleStartDate(startDate: string) {
  const { data } = await http.put<ApiResponse<null>>('/api/v1/couple/start-date', { startDate })
  return data
}

export async function separateCouple() {
  const { data } = await http.post<ApiResponse<null>>('/api/v1/couple/separate')
  return data
}

/** 待处理邀请列表 */
export async function listPendingInvites() {
  const { data } = await http.get<ApiResponse<CouplePendingInvite[]>>('/api/v1/couple/pending-invites')
  return data
}

/** 待处理邀请条数（消息角标） */
export async function getPendingInviteCount() {
  const { data } = await http.get<ApiResponse<number>>('/api/v1/couple/pending-invites/count')
  return data
}
