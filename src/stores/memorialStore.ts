import { create } from 'zustand'
import {
  getNextMemorial,
  listMemorialDays,
  listUpcomingMemorials,
  type MemorialDay,
  type MemorialNextPayload,
  type MemorialUpcomingItem,
} from '../services/memorial'

type CountdownAnchor = {
  /** 拉取接口时的本地时间戳 */
  fetchedAt: number
  /** 当时的剩余毫秒（服务端） */
  millisecondsUntilNext: number
}

type MemorialState = {
  items: MemorialDay[]
  upcoming: MemorialUpcomingItem[]
  nextPayload: MemorialNextPayload | null
  /** 用于本地每秒刷新倒计时，与轮询结果对齐 */
  countdownAnchor: CountdownAnchor | null
  loadingList: boolean
  loadingNext: boolean
  error: string | null

  fetchList: (coupleId: string) => Promise<void>
  /** 拉取最近纪念日 + 可选 upcoming（与日历标记一致） */
  fetchNext: (coupleId: string) => Promise<void>
  fetchUpcoming: (coupleId: string) => Promise<void>
  /** 增删改后调用 */
  invalidate: (coupleId: string) => Promise<void>
  clear: () => void
}

export const useMemorialStore = create<MemorialState>((set, get) => ({
  items: [],
  upcoming: [],
  nextPayload: null,
  countdownAnchor: null,
  loadingList: false,
  loadingNext: false,
  error: null,

  fetchList: async (coupleId) => {
    set({ loadingList: true, error: null })
    try {
      const resp = await listMemorialDays(coupleId)
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '加载纪念日失败')
      }
      set({ items: resp.data, loadingList: false })
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载纪念日失败'
      set({ error: msg, loadingList: false })
      throw e
    }
  },

  fetchNext: async (coupleId) => {
    set({ loadingNext: true, error: null })
    try {
      const resp = await getNextMemorial(coupleId, true)
      if (resp.code !== 0 || resp.data === undefined) {
        throw new Error(resp.message || '加载倒计时失败')
      }
      const payload = resp.data
      const now = Date.now()
      set({
        nextPayload: payload,
        countdownAnchor:
          payload.memorial != null
            ? { fetchedAt: now, millisecondsUntilNext: payload.millisecondsUntilNext }
            : null,
        loadingNext: false,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载倒计时失败'
      set({ error: msg, loadingNext: false, countdownAnchor: null })
      throw e
    }
  },

  fetchUpcoming: async (coupleId) => {
    try {
      const resp = await listUpcomingMemorials(coupleId, true)
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '加载近期纪念日失败')
      }
      set({ upcoming: resp.data })
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载近期纪念日失败'
      set({ error: msg })
      throw e
    }
  },

  invalidate: async (coupleId) => {
    await Promise.allSettled([
      get().fetchList(coupleId),
      get().fetchNext(coupleId),
      get().fetchUpcoming(coupleId),
    ])
  },

  clear: () =>
    set({
      items: [],
      upcoming: [],
      nextPayload: null,
      countdownAnchor: null,
      error: null,
    }),
}))

/** 由锚点计算当前剩余毫秒（本地每秒递减，轮询时重置锚点） */
export function remainingMsFromAnchor(anchor: CountdownAnchor | null): number | null {
  if (!anchor) return null
  return Math.max(0, anchor.millisecondsUntilNext - (Date.now() - anchor.fetchedAt))
}

export function formatCountdown(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return { days, hours, minutes, seconds }
}
