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
  sourceUrl?: string
  category?: string
  coupleId?: string
  metadata?: Record<string, unknown>
}

export type LoveQaIngestResponseData = {
  documentId: string
  status: string
  chunkCount: number
}

export type LoveQaDocumentSummary = {
  documentId: string
  coupleId: string | null
  title: string | null
  sourceUrl: string | null
  category: string | null
  scope: string
  status: string
  chunkCount: number
  createdAt: string
  updatedAt: string
}

export type LoveQaDocumentPageResponse = {
  total: number
  page: number
  pageSize: number
  items: LoveQaDocumentSummary[]
}

/** 文件上传入库（Multipart） */
export async function postLoveQaIngestFile(formData: FormData) {
  const { data } = await http.post<ApiResponse<LoveQaIngestResponseData>>(
    '/api/v1/ai/love-qa/ingest/file',
    formData,
    {
      timeout: 120_000,
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )
  return data
}

/** URL 抓取入库 */
export async function postLoveQaIngestUrl(body: {
  sourceUrl: string
  title?: string
  category?: string
  coupleId?: string
}) {
  const { data } = await http.post<ApiResponse<LoveQaIngestResponseData>>(
    '/api/v1/ai/love-qa/ingest/url',
    body,
    {
      timeout: 60_000,
    },
  )
  return data
}

export type RetrievedChunk = {
  id: string
  textPreview: string
  score?: number
  source?: string
  metadata?: Record<string, unknown>
}

/** 单轮 / 多轮恋爱问答（非流式；RAG + Redis 记忆；服务端再落 MySQL） */
export async function postLoveQaChat(body: LoveQaChatBody) {
  const { data } = await http.post<ApiResponse<LoveQaChatResponseData>>(
    '/api/v1/ai/love-qa/chat',
    body,
    {
      timeout: CHAT_TIMEOUT_MS,
    },
  )
  return data
}

export type LoveQaChatStreamHandlers = {
  onMeta: (conversationId: string) => void
  onRetrieved?: (chunks: RetrievedChunk[]) => void
  onDelta: (chunk: string) => void
  onDone: (payload: { reply: string; conversationId: string }) => void
  onError: (code: number, message: string) => void
}

function splitSseBlocks(buffer: string): { blocks: string[]; rest: string } {
  const blocks: string[] = []
  let rest = buffer
  for (;;) {
    let sepIdx = rest.indexOf('\r\n\r\n')
    let sepLen = 4
    if (sepIdx < 0) {
      sepIdx = rest.indexOf('\n\n')
      sepLen = 2
    }
    if (sepIdx < 0) break
    blocks.push(rest.slice(0, sepIdx))
    rest = rest.slice(sepIdx + sepLen)
  }
  return { blocks, rest }
}

function parseSseBlock(block: string): { event: string; data: string } | null {
  let event = 'message'
  const dataLines: string[] = []
  for (const rawLine of block.split(/\r?\n/)) {
    if (rawLine === '') continue
    if (rawLine.startsWith('event:')) {
      event = rawLine.slice(6).trim()
    } else if (rawLine.startsWith('data:')) {
      dataLines.push(rawLine.slice(5).replace(/^\s/, ''))
    }
  }
  if (dataLines.length === 0) return null
  return { event, data: dataLines.join('\n') }
}

/**
 * 流式恋爱问答（SSE）：事件名 meta / delta / done / error，data 为 JSON 字符串。
 * 与 {@link postLoveQaChat} 语义一致，由前端实时拼接展示。
 */
export async function postLoveQaChatStream(
  body: LoveQaChatBody,
  handlers: LoveQaChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  const sessionDistributed = import.meta.env.VITE_SESSION_DISTRIBUTED === 'true'
  const token = localStorage.getItem('lovespace_token')
  const res = await fetch(`${base}/api/v1/ai/love-qa/chat/stream`, {
    method: 'POST',
    credentials: sessionDistributed ? 'include' : 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) {
    let msg = `请求失败 (${res.status})`
    try {
      const j = (await res.json()) as { message?: string }
      if (j?.message) msg = j.message
    } catch {
      /* ignore */
    }
    handlers.onError(res.status, msg)
    return
  }
  if (!res.body) {
    handlers.onError(0, '响应体为空')
    return
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let carry = ''
  let doneEvent = false
  let streamFailed = false
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    carry += decoder.decode(value, { stream: true })
    const { blocks, rest } = splitSseBlocks(carry)
    carry = rest
    for (const block of blocks) {
      const ev = parseSseBlock(block)
      if (!ev) continue
      try {
        if (ev.event === 'meta') {
          const o = JSON.parse(ev.data) as { conversationId?: string }
          if (o.conversationId) handlers.onMeta(o.conversationId)
        } else if (ev.event === 'retrieved') {
          const o = JSON.parse(ev.data) as { chunks?: RetrievedChunk[] }
          if (o.chunks && handlers.onRetrieved) {
            handlers.onRetrieved(o.chunks)
          }
        } else if (ev.event === 'delta') {
          const o = JSON.parse(ev.data) as { t?: string }
          if (o.t) handlers.onDelta(o.t)
        } else if (ev.event === 'done') {
          const o = JSON.parse(ev.data) as { reply?: string; conversationId?: string }
          doneEvent = true
          handlers.onDone({
            reply: o.reply ?? '',
            conversationId: o.conversationId ?? '',
          })
        } else if (ev.event === 'error') {
          streamFailed = true
          const o = JSON.parse(ev.data) as { code?: number; message?: string }
          const msg = o.message ?? '未知错误'
          handlers.onError(o.code ?? 500, msg)
          throw new Error(msg)
        }
      } catch (e) {
        if (streamFailed) throw e
        streamFailed = true
        handlers.onError(500, '解析流数据失败')
        throw new Error('解析流数据失败')
      }
    }
  }
  if (!doneEvent && !streamFailed) {
    handlers.onError(500, '流意外结束')
    throw new Error('流意外结束')
  }
}

/** 上传文本到知识库（MySQL 台账 + Milvus 分片入库） */
export async function postLoveQaIngest(body: LoveQaIngestBody) {
  const { data } = await http.post<ApiResponse<LoveQaIngestResponseData>>(
    '/api/v1/ai/love-qa/ingest',
    body,
    {
      timeout: 120_000,
    },
  )
  return data
}

/** 知识库文档分页列表 */
export async function getLoveQaDocuments(coupleId?: string, page = 1, pageSize = 10) {
  const { data } = await http.get<ApiResponse<LoveQaDocumentPageResponse>>(
    '/api/v1/ai/love-qa/documents',
    {
      params: { coupleId, page, pageSize },
    },
  )
  return data
}

export type LoveQaDocumentDetail = LoveQaDocumentSummary & {
  ownerUserId: string
  errorMessage: string | null
}

/** 知识库文档详情（轮询入库状态） */
export async function getLoveQaDocument(documentId: string) {
  const { data } = await http.get<ApiResponse<LoveQaDocumentDetail>>(
    `/api/v1/ai/love-qa/documents/${encodeURIComponent(documentId)}`,
  )
  return data
}

/** 删除知识库文档（Milvus 向量 + 台账） */
export async function deleteLoveQaDocument(documentId: string) {
  const { data } = await http.delete<ApiResponse<null>>(
    `/api/v1/ai/love-qa/documents/${encodeURIComponent(documentId)}`,
  )
  return data
}

/** 强制重入库 */
export async function postLoveQaReingest(documentId: string) {
  const { data } = await http.post<ApiResponse<LoveQaIngestResponseData>>(
    `/api/v1/ai/love-qa/documents/${encodeURIComponent(documentId)}/reingest`,
    null,
    { timeout: 30_000 },
  )
  return data
}

export async function getLoveQaConversations(page = 1, pageSize = 20) {
  const { data } = await http.get<ApiResponse<LoveQaConversationPageResponse>>(
    '/api/v1/ai/love-qa/conversations',
    {
      params: { page, pageSize },
    },
  )
  return data
}

export async function getLoveQaMessages(conversationId: string) {
  const { data } = await http.get<ApiResponse<LoveQaMessagesResponse>>(
    `/api/v1/ai/love-qa/conversations/${encodeURIComponent(conversationId)}/messages`,
  )
  return data
}
