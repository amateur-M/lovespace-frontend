import type { ApiResponse } from '../types/api'
import { http } from './http'

const CHAT_TIMEOUT_MS = 120_000

export type LoveQaChatBody = {
  message: string
  /** 多轮时由上轮响应带回 */
  conversationId?: string
  /** 与 couple/info 的 bindingId 一致，可选 */
  coupleId?: string
}

export type LoveQaChatResponseData = {
  reply: string
  conversationId: string
}

export type LoveQaConversationSummary = {
  conversationId: string
  title: string | null
  updatedAt: string
}

export type LoveQaConversationPageResponse = {
  total: number
  page: number
  pageSize: number
  items: LoveQaConversationSummary[]
}

export type LoveQaMessageLine = {
  id: number
  role: string
  content: string
  createdAt: string
}

export type LoveQaMessagesResponse = {
  conversationId: string
  messages: LoveQaMessageLine[]
}

export type LoveQaIngestBody = {
  text: string
  title?: string
  metadata?: Record<string, unknown>
}

/** 单轮 / 多轮恋爱问答（RAG + Redis 记忆；服务端再落 MySQL） */
export async function postLoveQaChat(body: LoveQaChatBody) {
  const { data } = await http.post<ApiResponse<LoveQaChatResponseData>>('/api/v1/ai/love-qa/chat', body, {
    timeout: CHAT_TIMEOUT_MS,
  })
  return data
}

/** 上传文本到知识库（分片入库 Milvus） */
export async function postLoveQaIngest(body: LoveQaIngestBody) {
  const { data } = await http.post<ApiResponse<null>>('/api/v1/ai/love-qa/ingest', body, {
    timeout: 60_000,
  })
  return data
}

export async function getLoveQaConversations(page = 1, pageSize = 20) {
  const { data } = await http.get<ApiResponse<LoveQaConversationPageResponse>>('/api/v1/ai/love-qa/conversations', {
    params: { page, pageSize },
  })
  return data
}

export async function getLoveQaMessages(conversationId: string) {
  const { data } = await http.get<ApiResponse<LoveQaMessagesResponse>>(
    `/api/v1/ai/love-qa/conversations/${encodeURIComponent(conversationId)}/messages`,
  )
  return data
}
