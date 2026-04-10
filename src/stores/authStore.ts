import { create } from 'zustand'
import type { User } from '../services/auth'
import * as authApi from '../services/auth'

const TOKEN_KEY = 'lovespace_token'

type AuthState = {
  token: string | null
  user: User | null
  isAuthed: boolean
  /** 是否已从 localStorage / Session 完成恢复；未完成前勿根据 isAuthed 跳转登录页 */
  authHydrated: boolean
  hydrate: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (payload: Pick<User, 'avatarUrl' | 'gender' | 'birthday'>) => Promise<void>
  uploadAvatar: (file: File) => Promise<string>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthed: false,
  authHydrated: false,
  hydrate: async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) {
        set({ token, isAuthed: true, authHydrated: true })
        return
      }
      if (import.meta.env.VITE_SESSION_DISTRIBUTED === 'true') {
        try {
          const resp = await authApi.getProfile()
          if (resp.code === 0 && resp.data) {
            set({ token: null, user: resp.data, isAuthed: true, authHydrated: true })
          } else {
            set({ authHydrated: true })
          }
        } catch {
          set({ token: null, user: null, isAuthed: false, authHydrated: true })
        }
      } else {
        set({ authHydrated: true })
      }
    } catch {
      set({ authHydrated: true })
    }
  },
  login: async (email, password) => {
    const resp = await authApi.login({ email, password })
    if (resp.code !== 0) {
      throw new Error(resp.message || '登录失败')
    }
    localStorage.setItem(TOKEN_KEY, resp.data.token)
    set({ token: resp.data.token, user: resp.data.user, isAuthed: true, authHydrated: true })
  },
  register: async (username, email, password) => {
    const resp = await authApi.register({ username, email, password })
    if (resp.code !== 0) {
      throw new Error(resp.message || '注册失败')
    }
  },
  fetchProfile: async () => {
    const resp = await authApi.getProfile()
    if (resp.code !== 0) {
      throw new Error(resp.message || '获取用户信息失败')
    }
    set({ user: resp.data })
  },
  updateProfile: async (payload) => {
    const resp = await authApi.updateProfile(payload)
    if (resp.code !== 0) {
      throw new Error(resp.message || '更新资料失败')
    }
    set({ user: resp.data })
  },
  uploadAvatar: async (file) => {
    const resp = await authApi.uploadAvatar(file)
    if (resp.code !== 0 || !resp.data) {
      throw new Error(resp.message || '头像上传失败')
    }
    set((state) => ({
      user: state.user ? { ...state.user, avatarUrl: resp.data } : state.user,
    }))
    return resp.data
  },
  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem(TOKEN_KEY)
    set({ token: null, user: null, isAuthed: false, authHydrated: true })
  },
}))
