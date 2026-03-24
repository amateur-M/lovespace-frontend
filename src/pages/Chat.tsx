import { Avatar, Badge, Button, Empty, List, Spin, Typography, message as antdMessage } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
  const [sending, setSending] = useState(false)

  const coupleId = coupleInfo?.bindingId ?? ''
  const partner = coupleInfo?.partner ?? null
  const meId = me?.id ?? ''

  useEffect(() => {
    if (!isAuthed) return
    fetchCoupleInfo().catch(() => undefined)
  }, [fetchCoupleInfo, isAuthed])

  const loadMessages = useCallback(async () => {
    if (!coupleId) return
    setLoadingMessages(true)
    try {
      const { data } = await http.get<ApiResponse<MessageListItem[]>>('/api/v1/messages', {
        params: { coupleId, page: 1, pageSize: DEFAULT_PAGE_SIZE },
      })
      if (data.code !== 0 || !data.data) {
        throw new Error(data.message || '加载消息失败')
      }
      const sorted = [...data.data].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
      setMessages(sorted)
    } catch (e) {
      antdMessage.error(e instanceof Error ? e.message : '加载消息失败')
    } finally {
      setLoadingMessages(false)
    }
  }, [coupleId])

  useEffect(() => {
    if (!coupleId) return
    loadMessages()
    const timer = window.setInterval(() => {
      loadMessages().catch(() => undefined)
    }, 10000)
    return () => window.clearInterval(timer)
  }, [coupleId, loadMessages])

  const unreadCount = useMemo(
    () => messages.filter((m) => m.receiverId === meId && m.isRead === 0 && m.isRetracted === 0).length,
    [meId, messages],
  )
  const latestMessage = useMemo(() => (messages.length > 0 ? messages[0] : null), [messages])

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
        const endpoint = scheduledTime ? '/api/v1/messages/scheduled' : '/api/v1/messages/send'
        const payload = scheduledTime
          ? {
              coupleId,
              receiverId: partner.id,
              content,
              messageType: 'text',
              scheduledTime: scheduledTime.format('YYYY-MM-DDTHH:mm:ss'),
            }
          : {
              coupleId,
              receiverId: partner.id,
              content,
              messageType: 'text',
            }
        const { data } = await http.post<ApiResponse<MessageListItem>>(endpoint, payload)
        if (data.code !== 0 || !data.data) {
          throw new Error(data.message || '发送失败')
        }
        setMessages((prev) =>
          [data.data, ...prev].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()),
        )
        antdMessage.success(scheduledTime ? '定时消息已创建' : '发送成功')
      } catch (e) {
        antdMessage.error(e instanceof Error ? e.message : '发送失败')
      } finally {
        setSending(false)
      }
    },
    [coupleId, partner?.id],
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
          会话列表
        </Typography.Title>
        <List
          dataSource={[partner]}
          renderItem={(item) => (
            <List.Item className="!cursor-pointer !rounded-xl !border !border-rose-200 !px-3 !py-2 hover:!bg-rose-50/80">
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
                    {latestMessage ? <span>{dayjs(latestMessage.createdAt).format('MM-DD HH:mm')}</span> : null}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </aside>

      <section className="ls-surface flex min-h-[70vh] flex-col overflow-hidden">
        <div className="border-b border-rose-200/90 bg-rose-50/70 px-4 py-3">
          <Typography.Title level={5} className="!mb-0 !text-rose-950">
            与 {partner.username} 的聊天
          </Typography.Title>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-rose-50/40 p-4">
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
