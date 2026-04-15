import {
  BulbOutlined,
  CommentOutlined,
  HistoryOutlined,
  PlusOutlined,
  SendOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Collapse,
  Drawer,
  Empty,
  Form,
  Input,
  List,
  Spin,
  Typography,
  message,
} from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  getLoveQaConversations,
  getLoveQaMessages,
  postLoveQaChat,
  postLoveQaIngest,
  type LoveQaConversationSummary,
  type LoveQaMessageLine,
} from '../services/loveQa'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'

const { Title, Paragraph, Text } = Typography

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
  const [ingestSubmitting, setIngestSubmitting] = useState(false)
  const [form] = Form.useForm<{ title?: string; text: string }>()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthed) return
    fetchCoupleInfo().catch(() => undefined)
  }, [isAuthed, fetchCoupleInfo])

  const loadConversations = useCallback(async () => {
    setListLoading(true)
    try {
      const resp = await getLoveQaConversations(1, 30)
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

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const startNewChat = useCallback(() => {
    setConversationId(null)
    setMessages([])
    setInput('')
    message.info('已开始新对话')
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
    setMessages((prev) => [...prev, { key: userKey, role: 'user', content: text }])
    setInput('')
    try {
      const resp = await postLoveQaChat({
        message: text,
        conversationId: conversationId ?? undefined,
        coupleId,
      })
      if (resp.code !== 0 || resp.data == null) {
        throw new Error(resp.message || '发送失败')
      }
      setConversationId(resp.data.conversationId)
      setMessages((prev) => [
        ...prev,
        { key: newKey(), role: 'assistant', content: resp.data!.reply },
      ])
      void loadConversations()
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.key !== userKey))
      message.error(e instanceof Error ? e.message : '发送失败')
    } finally {
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
      } catch (e) {
        message.error(e instanceof Error ? e.message : '入库失败')
      } finally {
        setIngestSubmitting(false)
      }
    },
    [form],
  )

  const historyList = useMemo(
    () => (
      <List
        loading={listLoading}
        dataSource={conversations}
        locale={{ emptyText: '暂无历史会话' }}
        renderItem={(item) => (
          <List.Item className="!px-0 !py-1">
            <button
              type="button"
              onClick={() => void openConversation(item)}
              className="flex w-full cursor-pointer flex-col rounded-xl border border-rose-200/80 bg-white/95 px-3 py-2.5 text-left ring-1 ring-transparent transition-all duration-200 hover:border-[#F472B6]/60 hover:bg-rose-50/90 hover:ring-rose-200/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DB2777]"
            >
              <Text className="line-clamp-2 text-[13px] font-medium text-[#831843]">
                {item.title?.trim() || '（无标题）'}
              </Text>
              <Text className="text-xs text-[#831843]/55">
                {item.updatedAt ? dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm') : ''}
              </Text>
            </button>
          </List.Item>
        )}
      />
    ),
    [conversations, listLoading, openConversation],
  )

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="love-qa-page space-y-8 sm:space-y-10">
      <section
        className="relative overflow-hidden rounded-3xl border border-rose-200/90 bg-gradient-to-br from-[#FDF2F8] via-white to-rose-50/95 px-5 py-8 shadow-sm sm:px-8 sm:py-10"
        aria-labelledby="love-qa-hero-title"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#F472B6]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-[#DB2777]/15 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/90 bg-white/90 px-3 py-1 text-xs font-medium text-[#831843]/90 shadow-sm backdrop-blur-sm transition-colors duration-200">
              <BulbOutlined className="text-[#DB2777]" aria-hidden />
              AI 恋爱问答
            </div>
            <Title
              level={2}
              id="love-qa-hero-title"
              className="!mb-0 !font-['Ma_Shan_Zheng',serif] !text-3xl !font-normal !leading-snug !tracking-wide !text-[#831843] sm:!text-4xl"
            >
              有问有答，一起更懂爱
            </Title>
            <Paragraph className="!mb-0 max-w-prose !text-[15px] !leading-relaxed !text-[#831843]/85">
              结合知识库检索与多轮对话记忆，回答恋爱与情感问题。可随时补充你们专属的「知识片段」入库；历史会话保存在云端，换设备也能回顾。
            </Paragraph>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={startNewChat}
              className="!h-10 !min-w-[104px] !border-[#DB2777] !bg-[#DB2777] !px-5 transition-colors duration-200 hover:!border-[#be185d] hover:!bg-[#be185d]"
            >
              新对话
            </Button>
            <Button
              icon={<HistoryOutlined />}
              onClick={() => setHistoryOpen(true)}
              className="!h-10 border-amber-600/55 !bg-white/90 !text-amber-900 transition-colors duration-200 hover:border-amber-600 hover:!bg-amber-50 lg:hidden"
            >
              历史会话
            </Button>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
        <aside className="hidden w-full shrink-0 lg:block lg:w-72">
          <Card
            title={
              <span className="flex items-center gap-2 text-[#831843]">
                <HistoryOutlined className="text-[#DB2777]" aria-hidden />
                历史会话
              </span>
            }
            className="ls-surface !border-rose-200/90 transition-shadow duration-200 hover:shadow-md"
            styles={{ body: { paddingTop: 8 } }}
          >
            <div className="mb-2 flex justify-end">
              <Button type="link" size="small" onClick={() => void loadConversations()} className="!px-1">
                刷新
              </Button>
            </div>
            {historyList}
          </Card>
        </aside>

        <div className="min-w-0 flex-1 space-y-5">
          <Card className="ls-surface flex min-h-[420px] flex-col !border-rose-200/90 transition-shadow duration-200 hover:shadow-md sm:min-h-[480px]">
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-rose-200/80 pb-3">
              <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-[#831843]">
                <CommentOutlined className="text-[#DB2777]" aria-hidden />
                对话
                {conversationId ? (
                  <Text className="text-xs font-normal text-[#831843]/55">
                    会话 {conversationId.slice(0, 8)}…
                  </Text>
                ) : (
                  <Text className="text-xs font-normal text-[#831843]/55">
                    新会话
                  </Text>
                )}
              </span>
              {coupleLoading ? <Spin size="small" /> : null}
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col">
              <div
                className="mb-4 max-h-[min(52vh,520px)] flex-1 space-y-3 overflow-y-auto rounded-xl border border-rose-200/80 bg-gradient-to-b from-white to-[#FDF2F8]/55 px-3 py-4 shadow-inner ring-1 ring-rose-100/90 sm:px-4"
                role="log"
                aria-live="polite"
                aria-relevant="additions"
              >
                {messages.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span className="text-[#831843]/75">
                        输入你的问题开始对话；左侧可打开历史会话（移动端点「历史会话」）。
                      </span>
                    }
                  />
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.key}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={[
                          'max-w-[min(100%,520px)] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed shadow-sm transition-colors duration-200',
                          m.role === 'user'
                            ? 'bg-[#DB2777] text-white'
                            : 'border border-[#F472B6]/45 bg-white text-[#831843]',
                        ].join(' ')}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <Input.TextArea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="例如：吵架后怎么和好比较快？"
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  maxLength={4000}
                  showCount
                  disabled={sending}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault()
                      void onSend()
                    }
                  }}
                  className="!resize-none !border-rose-200/90 focus:!border-[#F472B6]"
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={sending}
                  onClick={() => void onSend()}
                  className="shrink-0 !h-10 !border-[#DB2777] !bg-[#DB2777] transition-colors duration-200 hover:!border-[#be185d] hover:!bg-[#be185d] sm:!h-[52px] sm:!px-6"
                >
                  发送
                </Button>
              </div>
            </div>
          </Card>

          <Collapse
            bordered={false}
            className="ls-surface overflow-hidden !border-rose-200/90 bg-white/95 transition-shadow duration-200 hover:shadow-md"
            items={[
              {
                key: 'ingest',
                label: (
                  <span className="flex items-center gap-2 font-medium text-[#831843]">
                    <UploadOutlined className="text-[#DB2777]" aria-hidden />
                    补充知识库（可选）
                  </span>
                ),
                children: (
                  <Form form={form} layout="vertical" onFinish={onIngest} className="max-w-3xl">
                    <Form.Item label="标题（可选）" name="title">
                      <Input placeholder="例如：我们吵架后的沟通约定" maxLength={120} />
                    </Form.Item>
                    <Form.Item
                      label="正文"
                      name="text"
                      rules={[{ required: true, message: '请填写正文' }]}
                    >
                      <Input.TextArea
                        rows={6}
                        placeholder="粘贴文章片段、笔记或你们约定的事项，将分片写入向量库供问答引用。"
                        maxLength={50_000}
                        showCount
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={ingestSubmitting}
                        icon={<UploadOutlined />}
                        className="!border-[#DB2777] !bg-[#DB2777] transition-colors duration-200 hover:!border-[#be185d] hover:!bg-[#be185d]"
                      >
                        提交入库
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />
        </div>
      </div>

      <Drawer
        title="历史会话"
        placement="left"
        width={320}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        className="[&_.ant-drawer-body]:!pt-2"
      >
        <div className="mb-2 flex justify-end">
          <Button type="link" size="small" onClick={() => void loadConversations()}>
            刷新
          </Button>
        </div>
        {historyList}
      </Drawer>
    </div>
  )
}
