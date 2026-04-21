import {
  CommentOutlined,
  HeartOutlined,
  MenuOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { Button, Form, Input, Modal, Spin, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  getLoveQaConversations,
  getLoveQaMessages,
  postLoveQaChatStream,
  postLoveQaIngest,
  type LoveQaConversationSummary,
  type LoveQaMessageLine,
} from '../services/loveQa'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'

const { Text, Title } = Typography

type UiMessage = {
  key: string
  role: 'user' | 'assistant'
  content: string
}

function newKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function AILoveQAPage() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const fetchCoupleInfo = useCoupleStore((s) => s.fetchCoupleInfo)
  const coupleLoading = useCoupleStore((s) => s.loading)
  const coupleInfo = useCoupleStore((s) => s.info)
  const coupleId = coupleInfo?.bindingId ?? undefined

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [conversations, setConversations] = useState<LoveQaConversationSummary[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [ingestOpen, setIngestOpen] = useState(false)
  const [ingestSubmitting, setIngestSubmitting] = useState(false)
  const [form] = Form.useForm<{ title?: string; text: string }>()
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const prevConversationIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isAuthed) return
    fetchCoupleInfo().catch(() => undefined)
  }, [isAuthed, fetchCoupleInfo])

  const loadConversations = useCallback(async () => {
    setListLoading(true)
    try {
      const resp = await getLoveQaConversations(1, 40)
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '加载会话列表失败')
      }
      setConversations(resp.data.items)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载会话列表失败')
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthed) return
    void loadConversations()
  }, [isAuthed, loadConversations])

  /** 仅在消息列表容器内滚动；切换会话瞬间滚到底，同会话内新消息平滑滚到底 */
  useLayoutEffect(() => {
    const el = messagesScrollRef.current
    if (!el || messages.length === 0) {
      prevConversationIdRef.current = conversationId
      return
    }
    const switchedConv = prevConversationIdRef.current !== conversationId
    prevConversationIdRef.current = conversationId
    if (switchedConv) {
      el.scrollTop = el.scrollHeight
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, conversationId])

  const startNewChat = useCallback(() => {
    setConversationId(null)
    setMessages([])
    setInput('')
    setHistoryOpen(false)
    window.setTimeout(() => composerRef.current?.focus(), 0)
    message.success('已开始新对话')
  }, [])

  const applyServerMessages = useCallback((lines: LoveQaMessageLine[]) => {
    const ui: UiMessage[] = lines.map((m) => ({
      key: `db-${m.id}`,
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }))
    setMessages(ui)
  }, [])

  const openConversation = useCallback(
    async (c: LoveQaConversationSummary) => {
      setSending(true)
      try {
        const resp = await getLoveQaMessages(c.conversationId)
        if (resp.code !== 0 || !resp.data) {
          throw new Error(resp.message || '加载消息失败')
        }
        setConversationId(c.conversationId)
        applyServerMessages(resp.data.messages)
        setHistoryOpen(false)
        message.success('已切换会话')
        window.setTimeout(() => composerRef.current?.focus(), 0)
      } catch (e) {
        message.error(e instanceof Error ? e.message : '加载消息失败')
      } finally {
        setSending(false)
      }
    },
    [applyServerMessages],
  )

  const onSend = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    const userKey = newKey()
    const assistantKey = newKey()
    setMessages((prev) => [
      ...prev,
      { key: userKey, role: 'user', content: text },
      { key: assistantKey, role: 'assistant', content: '' },
    ])
    setInput('')
    const ac = new AbortController()
    const timeoutId = window.setTimeout(() => ac.abort(), 120_000)
    try {
      await postLoveQaChatStream(
        {
          message: text,
          conversationId: conversationId ?? undefined,
          coupleId,
        },
        {
          onMeta: (cid) => setConversationId(cid),
          onDelta: (chunk) => {
            setMessages((prev) =>
              prev.map((m) => (m.key === assistantKey ? { ...m, content: m.content + chunk } : m)),
            )
          },
          onDone: ({ reply, conversationId: cid }) => {
            setConversationId(cid)
            setMessages((prev) =>
              prev.map((m) => (m.key === assistantKey ? { ...m, content: reply } : m)),
            )
            void loadConversations()
          },
          onError: () => undefined,
        },
        ac.signal,
      )
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.key !== userKey && m.key !== assistantKey))
      const errMsg =
        e instanceof Error && e.name === 'AbortError' ? '请求超时，请稍后再试' : e instanceof Error ? e.message : '发送失败'
      message.error(errMsg)
    } finally {
      window.clearTimeout(timeoutId)
      setSending(false)
    }
  }, [input, sending, conversationId, coupleId, loadConversations])

  const onIngest = useCallback(
    async (values: { title?: string; text: string }) => {
      const text = values.text?.trim()
      if (!text) {
        message.warning('请填写要入库的正文')
        return
      }
      setIngestSubmitting(true)
      try {
        const resp = await postLoveQaIngest({
          text,
          title: values.title?.trim() || undefined,
        })
        if (resp.code !== 0) {
          throw new Error(resp.message || '入库失败')
        }
        message.success('已提交知识库（分片入库可能需要数秒）')
        form.resetFields()
        setIngestOpen(false)
      } catch (e) {
        message.error(e instanceof Error ? e.message : '入库失败')
      } finally {
        setIngestSubmitting(false)
      }
    },
    [form],
  )

  const sidebarBody = useMemo(
    () => (
      <div className="flex min-h-0 flex-1 flex-col gap-1 px-2 pb-3 pt-2">
        <Button
          type="default"
          icon={<PlusOutlined aria-hidden />}
          onClick={startNewChat}
          className="!flex !h-11 !items-center !justify-center !gap-2 !rounded-xl !border-rose-200/90 !bg-white !font-medium !text-[#831843] !shadow-sm transition-colors duration-200 hover:!border-[#F472B6] hover:!bg-rose-50/90"
        >
          新建对话
        </Button>
        <div className="mt-3 px-1">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-[#831843]/45">最近对话</Text>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin]">
          {listLoading ? (
            <div className="flex justify-center py-6">
              <Spin />
            </div>
          ) : conversations.length === 0 ? (
            <Text className="block px-2 py-4 text-center text-xs text-[#831843]/50">暂无历史，在右侧开始提问吧</Text>
          ) : (
            <ul className="space-y-0.5" aria-label="会话列表">
              {conversations.map((item) => {
                const active = conversationId === item.conversationId
                return (
                  <li key={item.conversationId}>
                    <button
                      type="button"
                      onClick={() => void openConversation(item)}
                      className={[
                        'flex w-full cursor-pointer flex-col rounded-xl border px-2.5 py-2 text-left transition-colors duration-200',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DB2777]',
                        active
                          ? 'border-rose-300/90 bg-white shadow-sm ring-1 ring-rose-200/80'
                          : 'border-transparent bg-transparent hover:border-rose-200/70 hover:bg-white/80',
                      ].join(' ')}
                    >
                      <span className="line-clamp-2 text-[13px] font-medium leading-snug text-[#831843]">
                        {item.title?.trim() || '（无标题）'}
                      </span>
                      <span className="mt-0.5 text-[11px] text-[#831843]/45">
                        {item.updatedAt ? dayjs(item.updatedAt).format('MM-DD HH:mm') : ''}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <div className="mt-auto border-t border-rose-200/60 pt-2">
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined aria-hidden />}
            onClick={() => void loadConversations()}
            className="!w-full !justify-start !text-[#831843]/70 hover:!bg-rose-100/60 hover:!text-[#831843]"
          >
            刷新列表
          </Button>
        </div>
      </div>
    ),
    [conversationId, conversations, listLoading, loadConversations, openConversation, startNewChat],
  )

  const composer = (opts: { large?: boolean }) => (
    <div
      className={[
        'border border-rose-200/90 bg-white shadow-sm transition-shadow duration-200 focus-within:border-[#F472B6]/80 focus-within:shadow-md',
        opts.large ? 'rounded-[1.75rem] px-4 py-3 sm:px-5 sm:py-4' : 'rounded-2xl px-3 py-2.5',
      ].join(' ')}
    >
      <Input.TextArea
        ref={composerRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="向恋爱助手提问，例如：吵架后怎么和好比较快？"
        autoSize={opts.large ? { minRows: 2, maxRows: 5 } : { minRows: 1, maxRows: 6 }}
        maxLength={4000}
        disabled={sending}
        onPressEnter={(e) => {
          if (!e.shiftKey) {
            e.preventDefault()
            void onSend()
          }
        }}
        className="!resize-none !border-0 !bg-transparent !p-0 !shadow-none !text-[15px] !leading-relaxed !text-[#431407] placeholder:!text-[#831843]/40 focus:!shadow-none"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-rose-100/90 pt-2">
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="text"
            size="small"
            icon={<UploadOutlined className="text-rose-600" aria-hidden />}
            onClick={() => setIngestOpen(true)}
            className="!text-[#831843]/80 hover:!bg-rose-50"
          >
            补充知识库
          </Button>
          {coupleLoading ? <Spin size="small" className="ml-1" /> : null}
        </div>
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<SendOutlined aria-hidden />}
          loading={sending}
          onClick={() => void onSend()}
          disabled={!input.trim()}
          aria-label="发送"
          className="!flex !h-11 !w-11 !min-w-0 !items-center !justify-center !border-[#DB2777] !bg-[#DB2777] hover:!border-[#be185d] hover:!bg-[#be185d] disabled:!opacity-40"
        />
      </div>
    </div>
  )

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  const hasThread = messages.length > 0

  return (
    <div className="love-qa-page flex h-[calc(100dvh-11rem)] max-h-[calc(100dvh-11rem)] flex-col overflow-hidden rounded-2xl border border-rose-200/90 bg-white shadow-sm lg:flex-row">
      {/* 侧栏：千问式浅底 + 新建 / 最近对话（大屏） */}
      <aside
        className="hidden h-full min-h-0 w-[min(100%,280px)] shrink-0 flex-col overflow-hidden border-b border-rose-100/90 bg-gradient-to-b from-[#FDF2F8] via-[#FFF7FB] to-white lg:flex lg:border-b-0 lg:border-r"
        aria-label="恋爱问答侧栏"
      >
        <div className="flex items-center gap-2 border-b border-rose-100/80 px-4 py-4">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-300/40"
            aria-hidden
          >
            <HeartOutlined className="text-lg" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[#831843]">恋爱问答</div>
            <div className="truncate text-xs text-[#831843]/55">知识库 + 多轮记忆</div>
          </div>
        </div>
        {sidebarBody}
      </aside>

      {/* 主区 */}
      <section className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
        {/* 移动端顶栏 */}
        <header className="flex items-center justify-between gap-2 border-b border-rose-100/90 px-3 py-2.5 lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white">
              <CommentOutlined />
            </div>
            <span className="truncate text-sm font-semibold text-[#831843]">恋爱问答</span>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="text"
              icon={<PlusOutlined className="text-[#831843]" aria-hidden />}
              onClick={startNewChat}
              aria-label="新建对话"
            />
            <Button
              type="text"
              icon={<MenuOutlined className="text-lg text-[#831843]" aria-hidden />}
              onClick={() => setHistoryOpen(true)}
              aria-label="打开历史会话"
            />
          </div>
        </header>

        {!hasThread ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8 sm:px-8">
            <div className="mb-8 flex flex-col items-center text-center">
              <div
                className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-300/35"
                aria-hidden
              >
                <HeartOutlined className="text-3xl" />
              </div>
              <Title level={3} className="!mb-2 !text-xl !font-semibold !text-[#831843] sm:!text-2xl">
                你好，我是恋爱助手
              </Title>
              <Text className="max-w-md text-[15px] leading-relaxed text-[#831843]/75">
                结合你们的知识库与多轮对话，一起回答情感与相处问题。左侧可查看最近对话；也可随时补充专属片段入库。
              </Text>
            </div>
            <div className="w-full max-w-2xl">{composer({ large: true })}</div>
          </div>
        ) : (
          <>
            <div
              ref={messagesScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-4 sm:px-6 sm:py-5"
              role="log"
              aria-live="polite"
              aria-relevant="additions"
            >
              <div className="mx-auto max-w-3xl space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.key}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={[
                        'max-w-[min(100%,560px)] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed shadow-sm',
                        m.role === 'user'
                          ? 'bg-[#DB2777] text-white'
                          : 'border border-rose-200/80 bg-[#FFFBFC] text-[#431407]',
                      ].join(' ')}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="shrink-0 border-t border-rose-100/90 bg-gradient-to-t from-white via-white to-[#FFF7FB]/95 px-3 py-3 shadow-[0_-8px_24px_-12px_rgba(190,24,93,0.12)] sm:px-6 sm:py-4">
              <div className="mx-auto max-w-3xl">{composer({ large: false })}</div>
            </div>
          </>
        )}
      </section>

      {/* 移动端历史抽屉 */}
      <Modal
        title={<span className="text-[#831843]">历史会话</span>}
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={null}
        width={360}
        destroyOnClose
        classNames={{ body: '!pt-1' }}
      >
        <div className="max-h-[70vh] overflow-y-auto">{sidebarBody}</div>
      </Modal>

      <Modal
        title={<span className="text-[#831843]">补充知识库</span>}
        open={ingestOpen}
        onCancel={() => !ingestSubmitting && setIngestOpen(false)}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={onIngest} className="pt-1">
          <Form.Item label="标题（可选）" name="title">
            <Input placeholder="例如：我们吵架后的沟通约定" maxLength={120} />
          </Form.Item>
          <Form.Item label="正文" name="text" rules={[{ required: true, message: '请填写正文' }]}>
            <Input.TextArea
              rows={8}
              placeholder="粘贴文章片段、笔记或约定事项，将分片写入向量库供问答引用。"
              maxLength={50_000}
              showCount
            />
          </Form.Item>
          <Form.Item className="!mb-0 flex justify-end gap-2">
            <Button onClick={() => setIngestOpen(false)} disabled={ingestSubmitting}>
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={ingestSubmitting}
              icon={<UploadOutlined aria-hidden />}
              className="!border-[#DB2777] !bg-[#DB2777] hover:!border-[#be185d] hover:!bg-[#be185d]"
            >
              提交入库
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
