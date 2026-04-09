import type { ApiResponse } from '../types/api'
import { http } from './http'

export type LoveLetterStyle = 'romantic' | 'humorous' | 'sincere'
export type LoveLetterLength = 'short' | 'medium' | 'long'

export type LoveLetterGenerateBody = {
  coupleId: string
  style: LoveLetterStyle
  length: LoveLetterLength
  /** 可选；不传则由后端从时间轴记录摘要 */
  memories?: string
}

export type LoveLetterResponseData = {
  content: string
}

export async function generateLoveLetter(body: LoveLetterGenerateBody) {
  const { data } = await http.post<ApiResponse<LoveLetterResponseData>>('/api/v1/ai/love-letter', body, {
    timeout: 120_000,
  })
  return data
}
