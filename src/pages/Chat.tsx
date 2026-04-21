import { Avatar, Badge, Button, Empty, List, Spin, Typography, message as antdMessage } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import MessageBubble, { type ChatMessage } from '../components/MessageBubble'
import MessageInput from '../components/MessageInput'
import { http } from '../services/http'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'

type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

type MessageListItem = ChatMessage

const DEFAULT_PAGE_SIZE = 50

export default function ChatPage() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const me = useAuthStore((s) => s.user)
  const fetchCoupleInfo = useCoupleStore((s) => s.fetchCoupleInfo)
  const coupleLoading = useCoupleStore((s) => s.loading)
  const coupleInfo = useCoupleStore((s) => s.info)

  const [messages, setMessages] = useState<MessageListItem[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sending, setSending] = useState(false)

  const coupleId = coupleInfo?.bindingId ?? ''
  const partner = coupleInfo?.partner ?? null
  const meId = me?.id ?? ''

  const wsRef = useRef<WebSocket | null>(null)
  const wsConnectedRef = useRef(false)
  const chatBodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isAuthed) return
    fetchCoupleInfo().catch(() => undefined)
  }, [fetchCoupleInfo, isAuthed])

  const upsertMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === msg.id)
      const next = idx >= 0 ? prev.map((m) => (m.id === msg.id ? msg : m)) : [...prev, msg]
      return next.sort((a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf())
    })
  }, [])

  const scrollToBottom = useCallback(() => {
    const el = chatBodyRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [])

  const formatSessionTime = useCallback((raw?: string | null) => {
    if (!raw) return ''
    const t = dayjs(raw)
    const now = dayjs()
    if (t.isSame(now, 'day')) return t.format('HH:mm')
    if (t.isSame(now.subtract(1, 'day'), 'day')) return '昨天'
    const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weeks[t.day()]
  }, [])

  const fetchMessagesByPage = useCallback(async (page: number) => {
    if (!coupleId) return
    if (page <= 1) setLoadingMessages(true)
    else setLoadingMore(true)
    try {
      const { data } = await http.get<ApiResponse<MessageListItem[]>>('/api/v1/messages', {
        params: { coupleId, page, pageSize: DEFAULT_PAGE_SIZE },
      })
      if (data.code !== 0 || !data.data) {
        throw new Error(data.message || '加载消息失败')
      }
      const ascending = [...data.data].sort((a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf())
      if (page === 1) {
        setMessages(ascending)
      } else {
        setMessages((prev) => {
          const map = new Map<string, MessageListItem>()
          for (const m of [...ascending, ...prev]) map.set(m.id, m)
          return [...map.values()].sort((a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf())
        })
      }
      setCurrentPage(page)
      setHasMore(data.data.length >= DEFAULT_PAGE_SIZE)
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : '加载消息失败')
    } finally {
      setLoadingMessages(false)
      setLoadingMore(false)
    }
  }, [coupleId])

  useEffect(() => {
    if (!coupleId) return
    fetchMessagesByPage(1).then(() => {
      setTimeout(scrollToBottom, 0)
    })
    // 暂时按需求关闭轮询，仅保留 WebSocket 实时增量。
    // const timer = window.setInterval(() => {
    //   fetchMessagesByPage(1).catch(() => undefined)
    // }, 10000)
    // return () => window.clearInterval(timer)
  }, [coupleId, fetchMessagesByPage, scrollToBottom])

  const unreadCount = useMemo(
    () => messages.filter((m) => m.receiverId === meId && m.isRead === 0 && m.isRetracted === 0).length,
    [meId, messages],
  )
  const latestMessage = useMemo(() => (messages.length > 0 ? messages[messages.length - 1] : null), [messages])

  const latestPreview = useMemo(() => {
    if (!latestMessage) return '你们的私密会话'
    if (latestMessage.isRetracted === 1) return '一条消息已撤回'
    const prefix = latestMessage.senderId === meId ? '你：' : ''
    return `${prefix}${latestMessage.content}`
  }, [latestMessage, meId])

  const markVisibleMessagesRead = useCallback(async () => {
    if (!meId) return
    const unread = messages.filter((m) => m.receiverId === meId && m.isRead === 0 && m.isRetracted === 0)
    if (unread.length === 0) return
    await Promise.all(
      unread.map(async (m) => {
        const { data } = await http.put<ApiResponse<null>>(`/api/v1/messages/${m.id}/read`)
        if (data.code !== 0) {
          throw new Error(data.message || '标记已读失败')
        }
      }),
    )
    setMessages((prev) =>
      prev.map((m) =>
        m.receiverId === meId && m.isRead === 0 && m.isRetracted === 0
          ? { ...m, isRead: 1, readTime: dayjs().format('YYYY-MM-DD HH:mm:ss') }
          : m,
      ),
    )
  }, [meId, messages])

  useEffect(() => {
    if (!messages.length) return
    markVisibleMessagesRead().catch(() => undefined)
  }, [markVisibleMessagesRead, messages.length])

  const onSend = useCallback(
    async ({ content, scheduledTime }: { content: string; scheduledTime: Dayjs | null }) => {
      if (!coupleId || !partner?.id) return
      setSending(true)
      try {
        const ws = wsRef.current
        const wsReady = ws && wsConnectedRef.current && ws.readyState === WebSocket.OPEN

        if (wsReady) {
          ws.send(
            JSON.stringify(
              scheduledTime
                ? {
                    type: 'scheduled',
                    coupleId,
                    receiverId: partner.id,
                    content,
                    messageType: 'text',
                    scheduledTime: scheduledTime.format('YYYY-MM-DDTHH:mm:ss'),
                  }
                : {
                    type: 'send',
                    coupleId,
                    receiverId: partner.id,
                    content,
                    messageType: 'text',
                  },
            ),
          )
          antdMessage.success(scheduledTime ? '定时消息已创建' : '发送成功')
          return
        }

        // WebSocket 未就绪时走 HTTP（与后端 MessageController 一致），避免开发环境代理/网络导致无法发送
        if (scheduledTime) {
          const { data } = await http.post<ApiResponse<ChatMessage>>('/api/v1/messages/scheduled', {
            scheduledTime: scheduledTime.format('YYYY-MM-DDTHH:mm:ss'),
            coupleId,
            receiverId: partner.id,
            content,
            messageType: 'text',
          })
          if (data.code !== 0 || !data.data) {
            throw new Error(data.message || '创建定时消息失败')
          }
          upsertMessage(data.data)
          antdMessage.success('定时消息已创建')
        } else {
          const { data } = await http.post<ApiResponse<ChatMessage>>('/api/v1/messages/send', {
            coupleId,
            receiverId: partner.id,
            content,
            messageType: 'text',
          })
          if (data.code !== 0 || !data.data) {
            throw new Error(data.message || '发送失败')
          }
          upsertMessage(data.data)
          setTimeout(scrollToBottom, 0)
          antdMessage.success('发送成功')
        }
      } catch (e) {
        antdMessage.error(e instanceof Error ? e.message : '发送失败')
      } finally {
        setSending(false)
      }
    },
    [coupleId, partner?.id, scrollToBottom, upsertMessage],
  )

  const onRetract = useCallback(async (messageId: string) => {
    try {
      const { data } = await http.post<ApiResponse<null>>(`/api/v1/messages/${messageId}/retract`)
      if (data.code !== 0) {
        throw new Error(data.message || '撤回失败')
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isRetracted: 1, content: '此消息已撤回' } : m)),
      )
      antdMessage.success('消息已撤回')
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : '撤回失败（仅允许发送后 2 分钟内）')
    }
  }, [])

  // WebSocket：实时增量推送（仍保留轮询 loadMessages 作为兜底）
  useEffect(() => {
    if (!coupleId || !partner || !meId) return
    const token = localStorage.getItem('lovespace_token')
    if (!token) return

    const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined
    const wsBase = apiBase?.startsWith('http')
      ? apiBase.replace(/^http/, 'ws').replace(/\/$/, '')
      : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    const wsUrl = `${wsBase}/ws/chat?token=${encodeURIComponent(token)}`

    let alive = true
    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws
        wsConnectedRef.current = false

        ws.onopen = () => {
          if (!alive) return
          wsConnectedRef.current = true
          ws.send(JSON.stringify({ type: 'subscribe', coupleId }))
        }

        ws.onmessage = (evt) => {
          try {
            const payload = JSON.parse(evt.data)
            if (payload?.type === 'privateMessage' && payload?.data) {
              const el = chatBodyRef.current
              const nearBottom =
                !!el && el.scrollHeight - el.scrollTop - el.clientHeight < 120
              upsertMessage(payload.data as ChatMessage)
              if (nearBottom) {
                setTimeout(scrollToBottom, 0)
              }
              return
            }
            if (payload?.type === 'error') {
              antdMessage.error(payload.message || 'WebSocket error')
            }
          } catch {
            // ignore
          }
        }

        ws.onclose = () => {
          wsConnectedRef.current = false
          if (!alive) return
          window.setTimeout(connect, 3000)
        }

        ws.onerror = () => {
          wsConnectedRef.current = false
        }
      } catch {
        // ignore
      }
    }

    connect()
    return () => {
      alive = false
      try {
        wsRef.current?.close()
      } catch {
        // ignore
      }
    }
  }, [coupleId, meId, partner?.id, scrollToBottom, upsertMessage])

  const onMessageScroll = useCallback(async () => {
    const el = chatBodyRef.current
    if (!el || loadingMore || loadingMessages || !hasMore) return
    if (el.scrollTop > 40) return
    const prevHeight = el.scrollHeight
    await fetchMessagesByPage(currentPage + 1)
    setTimeout(() => {
      const nowEl = chatBodyRef.current
      if (!nowEl) return
      nowEl.scrollTop = nowEl.scrollHeight - prevHeight
    }, 0)
  }, [currentPage, fetchMessagesByPage, hasMore, loadingMessages, loadingMore])

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  if (coupleLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spin />
      </div>
    )
  }

  if (!coupleId || !partner) {
    return (
      <div className="ls-surface py-16">
        <Empty
          description={<span className="text-rose-800/70">请先完成情侣绑定后再使用私密消息</span>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Link to="/couple">
            <Button type="primary">去情侣首页</Button>
          </Link>
        </Empty>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="ls-surface p-3">
        <Typography.Title level={5} className="!mb-3 !text-rose-900">
          会话
        </Typography.Title>
        <List
          dataSource={[partner]}
          renderItem={(item) => (
            <List.Item className="!cursor-pointer !border-b !border-rose-200 !px-2 !py-3 last:!border-b-0 hover:!bg-rose-50/80">
              <List.Item.Meta
                avatar={<Avatar src={item.avatarUrl ?? undefined}>{item.username.slice(0, 1).toUpperCase()}</Avatar>}
                title={
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-rose-950">{item.username}</span>
                    <Badge count={unreadCount} size="small" />
                  </div>
                }
                description={
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="line-clamp-1 max-w-[150px]">{latestPreview}</span>
                    {latestMessage ? <span>{formatSessionTime(latestMessage.createdAt)}</span> : null}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </aside>

      <section className="ls-surface flex h-[calc(100vh-190px)] min-h-[540px] flex-col overflow-hidden">
        <div className="border-b border-rose-200/90 bg-rose-50/70 px-4 py-3">
          <Typography.Title level={5} className="!mb-0 !text-rose-950">
            与 {partner.username} 的聊天
          </Typography.Title>
        </div>

        <div
          ref={chatBodyRef}
          onScroll={onMessageScroll}
          className="flex-1 space-y-3 overflow-y-auto bg-rose-50/40 p-4"
        >
          {loadingMore ? (
            <div className="mb-2 text-center text-xs text-rose-700/70">正在加载更早消息...</div>
          ) : null}
          {loadingMessages ? (
            <div className="flex justify-center py-10">
              <Spin />
            </div>
          ) : messages.length === 0 ? (
            <Empty
              description={<span className="text-rose-800/70">还没有消息，开始你们的第一句吧</span>}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                isMine={m.senderId === meId}
                onRetract={onRetract}
              />
            ))
          )}
        </div>

        <div className="border-t border-rose-200/90 bg-white p-4">
          <MessageInput sending={sending} onSend={onSend} />
        </div>
      </section>
    </div>
  )
}
