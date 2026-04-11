import { create } from 'zustand'
import { getPendingInviteCount } from '../services/couple'

type InboxState = {
  pendingCount: number
  refreshPendingCount: () => Promise<void>
}

/**
 * 站内「消息」：当前主要为待处理情侣邀请条数（顶栏角标）。
 */
export const useInboxStore = create<InboxState>((set) => ({
  pendingCount: 0,
  refreshPendingCount: async () => {
    try {
      const resp = await getPendingInviteCount()
      if (resp.code === 0 && resp.data != null) {
        set({ pendingCount: Number(resp.data) })
      }
    } catch {
      /* 未登录或网络错误时不打断导航 */
    }
  },
}))
