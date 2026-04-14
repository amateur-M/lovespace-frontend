import { http } from './http'

export type User = {
  id: string
  phone: string
  username: string
  email?: string | null
  avatarUrl?: string | null
  gender?: number | null
  birthday?: string | null
  status?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type LoginRequest = {
  phone: string
  password: string
}

export type RegisterRequest = {
  phone: string
  username: string
  password: string
}

export type LoginResponse = {
  token: string
  user: User
}

export type UpdateProfilePayload = {
  avatarUrl?: string | null
  gender?: number | null
  birthday?: string | null
  username?: string | null
  email?: string | null
}

type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

export async function login(req: LoginRequest) {
  const { data } = await http.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', req)
  return data
}

export async function register(req: RegisterRequest) {
  const { data } = await http.post<ApiResponse<User>>('/api/v1/auth/register', req)
  return data
}

export async function logout() {
  const { data } = await http.post<ApiResponse<null>>('/api/v1/auth/logout')
  return data
}

export async function getProfile() {
  const { data } = await http.get<ApiResponse<User>>('/api/v1/user/profile')
  return data
}

export async function updateProfile(req: UpdateProfilePayload) {
  const { data } = await http.put<ApiResponse<User>>('/api/v1/user/profile', req)
  return data
}

export async function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await http.post<ApiResponse<string>>('/api/v1/user/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
