import { create } from 'zustand'
import * as coupleApi from '../services/couple'
import type { CoupleInfo } from '../services/couple'
import { COUPLE_NOT_BOUND_CODE } from '../services/couple'

type CoupleState = {
  info: CoupleInfo | null
  loading: boolean
  error: string | null
  /** 拉取情侣信息；未绑定时 `info` 置为 null */
  fetchCoupleInfo: () => Promise<void>
  /** 发送邀请（对方需在另一端接受）；按对方手机号查找用户 */
  invite: (inviteePhone: string) => Promise<string>
  /** 接受邀请后刷新状态 */
  accept: (bindingId: string, startDate?: string | null) => Promise<void>
  /** 更新恋爱开始日并刷新 */
  updateStartDate: (startDate: string) => Promise<void>
  /** 解除关系并刷新 */
  separate: () => Promise<void>
  clearError: () => void
}

export const useCoupleStore = create<CoupleState>((set, get) => ({
  info: null,
  loading: false,
  error: null,

  fetchCoupleInfo: async () => {
    set({ loading: true, error: null })
    try {
      const resp = await coupleApi.getCoupleInfo()
      if (resp.code === 0 && resp.data) {
        set({ info: resp.data, loading: false })
        return
      }
      if (resp.code === COUPLE_NOT_BOUND_CODE) {
        set({ info: null, loading: false })
        return
      }
      throw new Error(resp.message || '获取情侣信息失败')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '获取情侣信息失败'
      set({ error: msg, loading: false })
      throw e
    }
  },

  invite: async (inviteePhone) => {
    set({ error: null })
    const resp = await coupleApi.inviteCouple(inviteePhone)
    if (resp.code !== 0 || !resp.data?.bindingId) {
      throw new Error(resp.message || '发送邀请失败')
    }
    return resp.data.bindingId
  },

  accept: async (bindingId, startDate) => {
    set({ error: null })
    const resp = await coupleApi.acceptCouple(bindingId, startDate)
    if (resp.code !== 0 || !resp.data) {
      throw new Error(resp.message || '接受邀请失败')
    }
    set({ info: resp.data })
  },

  updateStartDate: async (startDate) => {
    set({ error: null })
    const resp = await coupleApi.updateCoupleStartDate(startDate)
    if (resp.code !== 0) {
      throw new Error(resp.message || '更新开始日失败')
    }
    await get().fetchCoupleInfo()
  },

  separate: async () => {
    set({ error: null })
    const resp = await coupleApi.separateCouple()
    if (resp.code !== 0) {
      throw new Error(resp.message || '解除关系失败')
    }
    set({ info: null })
    await get().fetchCoupleInfo()
  },

  clearError: () => set({ error: null }),
}))
