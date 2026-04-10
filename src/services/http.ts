import axios from 'axios'

/** 与后端分布式 Session 联调时置为 true，请求携带 Cookie（需后端 lovespace.session.distributed.enabled + spring.session.store-type=redis） */
const sessionDistributed = import.meta.env.VITE_SESSION_DISTRIBUTED === 'true'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 15_000,
  withCredentials: sessionDistributed,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('lovespace_token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
