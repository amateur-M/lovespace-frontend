import {
  BookOutlined,
  DeleteOutlined,
  FileOutlined,
  FileTextOutlined,
  LinkOutlined,
  MenuOutlined,
  MessageOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Dropdown,
  Form,
  Input,
  Modal,
  Pagination,
  Spin,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import dayjs from 'dayjs'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Navigate } from 'react-router-dom'
import {
  deleteLoveQaDocument,
  getLoveQaConversations,
  getLoveQaDocuments,
  getLoveQaMessages,
  postLoveQaChatStream,
  postLoveQaIngest,
  postLoveQaIngestFile,
  postLoveQaIngestUrl,
  postLoveQaReingest,
  type LoveQaConversationSummary,
  type LoveQaDocumentSummary,
  type LoveQaMessageLine,
  type RetrievedChunk,
} from '../services/loveQa'
import kejiIcon from '../assets/keji.svg'
import sendButtonIcon from '../assets/sendButton.svg'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'

const { Text, Title } = Typography

/** 恋爱小助手吉祥物，用于侧栏、顶栏与空状态等品牌位 */
function KejiMascot({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const boxClass =
    size === 'sm' ? 'size-9 rounded-lg' : size === 'lg' ? 'size-16 rounded-2xl' : 'size-10 rounded-xl'
  const imgClass = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-14' : 'size-9'
  const shadowClass =
    size === 'lg' ? 'shadow-lg shadow-rose-300/35' : 'shadow-md shadow-rose-300/40'

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-white ${boxClass} ${shadowClass}`}
      aria-hidden
    >
      <img src={kejiIcon} alt="" className={`${imgClass} object-contain`} />
    </div>
  )
}

type IngestMode = 'text' | 'file' | 'url'
type SidebarTab = 'chat' | 'knowledge'

const DOC_PAGE_SIZE = 10

const CATEGORY_PRESETS = ['沟通', '冲突', '浪漫', '纪念日', '相处'] as const

const INGEST_SUBMIT_LABEL: Record<IngestMode, string> = {
  text: '提交入库',
  file: '上传并入库',
  url: '抓取并入库',
}

/** 三种入库方式主内容区统一高度，避免切换 Tab 时弹窗跳动 */
const INGEST_MODE_BODY_CLASS = 'h-[16rem]'
const INGEST_MODE_FIELD_H =
  '!h-[12.5rem] !min-h-[12.5rem] [&_.ant-upload]:!h-full [&_.ant-upload-drag]:!flex [&_.ant-upload-drag]:!h-full [&_.ant-upload-drag]:!min-h-[12.5rem] [&_.ant-upload-drag]:!flex-col [&_.ant-upload-drag]:!items-center [&_.ant-upload-drag]:!justify-center'
const INGEST_MODE_TEXTAREA_H = '!h-[11rem] !min-h-[11rem] !resize-none !rounded-xl'

const SIDEBAR_ACTION_BTN_CLASS =
  '!flex !h-11 !w-full !items-center !justify-center !gap-2 !rounded-xl !border-rose-200/90 !bg-white !font-medium !text-[#831843] !shadow-sm transition-colors duration-200 hover:!cursor-pointer hover:!border-[#F472B6] hover:!bg-rose-50/90 disabled:!cursor-not-allowed disabled:!opacity-50'

/** 侧栏「对话 / 知识库」分段切换 */
function SidebarTabSwitch({
  activeKey,
  onChange,
  knowledgeCount = 0,
  processingDocs = false,
}: {
  activeKey: SidebarTab
  onChange: (key: SidebarTab) => void
  knowledgeCount?: number
  processingDocs?: boolean
}) {
  const tabs: {
    key: SidebarTab
    label: string
    icon: ReactNode
    badge?: number
    pulse?: boolean
  }[] = [
    { key: 'chat', label: '对话', icon: <MessageOutlined aria-hidden className="text-sm" /> },
    {
      key: 'knowledge',
      label: '知识库',
      icon: <BookOutlined aria-hidden className="text-sm" />,
      badge: knowledgeCount,
      pulse: processingDocs,
    },
  ]

  return (
    <div
      className="mx-3 mb-3 grid grid-cols-2 gap-1 rounded-xl bg-rose-100/70 p-1"
      role="tablist"
      aria-label="侧栏分类"
    >
      {tabs.map((tab) => {
        const active = activeKey === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={[
              'relative flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[13px] font-medium transition-colors duration-200',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DB2777]',
              active
                ? 'bg-white text-[#831843] shadow-sm'
                : 'text-[#831843]/55 hover:text-[#831843]/85',
            ].join(' ')}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.pulse ? (
              <span
                className="size-1.5 shrink-0 rounded-full bg-[#DB2777] motion-safe:animate-pulse"
                aria-label="有文档处理中"
              />
            ) : null}
            {!tab.pulse && tab.badge != null && tab.badge > 0 ? (
              <span className="rounded-full bg-rose-200/90 px-1.5 text-[10px] font-semibold leading-5 text-[#831843]/75">
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/** 补充知识库弹窗：入库方式分段切换 */
function IngestModeSwitch({
  activeKey,
  onChange,
  disabled = false,
}: {
  activeKey: IngestMode
  onChange: (key: IngestMode) => void
  disabled?: boolean
}) {
  const modes: { key: IngestMode; label: string; icon: ReactNode }[] = [
    { key: 'text', label: '粘贴文本', icon: <FileTextOutlined aria-hidden className="text-sm" /> },
    { key: 'file', label: '上传文件', icon: <FileOutlined aria-hidden className="text-sm" /> },
    { key: 'url', label: '网页链接', icon: <LinkOutlined aria-hidden className="text-sm" /> },
  ]

  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-xl bg-rose-100/70 p-1"
      role="tablist"
      aria-label="入库方式"
    >
      {modes.map((mode) => {
        const active = activeKey === mode.key
        return (
          <button
            key={mode.key}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(mode.key)}
            className={[
              'flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2.5 text-[12px] font-medium transition-colors duration-200 sm:flex-row sm:gap-1.5 sm:px-2 sm:text-[13px]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DB2777]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              active
                ? 'bg-white text-[#831843] shadow-sm'
                : 'text-[#831843]/55 hover:text-[#831843]/85',
            ].join(' ')}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function documentStatusTag(status: string) {
  switch (status) {
    case 'SUCCESS':
      return <Tag color="success">已入库</Tag>
    case 'PENDING':
    case 'PROCESSING':
      return (
        <Tag color="processing" icon={<Spin size="small" />}>
          处理中
        </Tag>
      )
    case 'FAILED':
      return <Tag color="error">失败</Tag>
    default:
      return <Tag>{status}</Tag>
  }
}

type HighlightedSource = {
  messageKey: string
  idx: number
}

type UiMessage = {
  key: string
  role: 'user' | 'assistant'
  content: string
  retrievedChunks?: RetrievedChunk[]
}

function newKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function resolveComposerTextArea(
  ref: RefObject<HTMLTextAreaElement | null>,
): HTMLTextAreaElement | null {
  const node = ref.current
  if (!node) return null
  const inner = node as HTMLTextAreaElement & {
    resizableTextArea?: { textArea: HTMLTextAreaElement }
  }
  return inner.resizableTextArea?.textArea ?? node
}

/**
 * 将 assistant 内容中的 【1】 【2】 等引用标记渲染为可点击的高亮链接。
 * 点击后滚动到来源卡片区域并短暂高亮。
 */
function renderMessageWithCitations(content: string, onHighlightSource?: (index: number) => void) {
  if (!content) return content

  // 匹配 【数字】 或 [数字]
  const parts = content.split(/(【\d+】|\[\d+\])/g)

  return parts.map((part, idx) => {
    const cnMatch = part.match(/^【(\d+)】$/)
    const enMatch = part.match(/^\[(\d+)\]$/)
    const numStr = cnMatch?.[1] ?? enMatch?.[1]
    if (numStr) {
      const num = parseInt(numStr, 10)
      return (
        <span
          key={idx}
          className="cursor-pointer rounded bg-rose-100 px-1 text-rose-700 hover:bg-rose-200 active:bg-rose-300"
          onClick={() => onHighlightSource?.(num - 1)}
          title={`查看来源 #${num}`}
        >
          {part}
        </span>
      )
    }
    return part
  })
}

export default function AILoveQAPage() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const fetchCoupleInfo = useCoupleStore((s) => s.fetchCoupleInfo)
  const coupleLoading = useCoupleStore((s) => s.loading)
  const coupleInfo = useCoupleStore((s) => s.info)
  const coupleId = coupleInfo?.bindingId ?? undefined
  const canIngest = !!coupleId && !coupleLoading
  const canChat = canIngest

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [conversations, setConversations] = useState<LoveQaConversationSummary[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('chat')
  const [documents, setDocuments] = useState<LoveQaDocumentSummary[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [docPage, setDocPage] = useState(1)
  const [docTotal, setDocTotal] = useState(0)
  const [ingestOpen, setIngestOpen] = useState(false)
  const [ingestMode, setIngestMode] = useState<IngestMode>('text')
  const [ingestSubmitting, setIngestSubmitting] = useState(false)
  const [ingestFile, setIngestFile] = useState<UploadFile | null>(null)
  const [form] = Form.useForm<{
    title?: string
    text?: string
    sourceUrl?: string
    category?: string
  }>()
  const [highlightedSource, setHighlightedSource] = useState<HighlightedSource | null>(null)
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const prevConversationIdRef = useRef<string | null>(null)
  const [composerMultiLine, setComposerMultiLine] = useState(false)

  const syncComposerLayout = useCallback(() => {
    const textarea = resolveComposerTextArea(composerRef)
    if (!textarea) return
    const lineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight) || 24
    setComposerMultiLine(textarea.scrollHeight > lineHeight + 8)
  }, [])

  useLayoutEffect(() => {
    syncComposerLayout()
  }, [input, syncComposerLayout])

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

  const loadDocuments = useCallback(
    async (page?: number) => {
      const targetPage = page ?? 1
      if (!coupleId) {
        setDocuments([])
        setDocTotal(0)
        return
      }
      setDocumentsLoading(true)
      try {
        const resp = await getLoveQaDocuments(coupleId, targetPage, DOC_PAGE_SIZE)
        if (resp.code !== 0 || !resp.data) {
          throw new Error(resp.message || '加载知识库失败')
        }
        setDocuments(resp.data.items)
        setDocTotal(resp.data.total)
        setDocPage(resp.data.page)
      } catch (e) {
        message.error(e instanceof Error ? e.message : '加载知识库失败')
      } finally {
        setDocumentsLoading(false)
      }
    },
    [coupleId],
  )

  useEffect(() => {
    if (!isAuthed || sidebarTab !== 'knowledge') return
    void loadDocuments(docPage)
  }, [isAuthed, sidebarTab, coupleId, docPage, loadDocuments])

  const hasProcessingDocs = documents.some(
    (d) => d.status === 'PENDING' || d.status === 'PROCESSING',
  )

  useEffect(() => {
    if (!hasProcessingDocs || sidebarTab !== 'knowledge') return
    const timer = window.setInterval(() => {
      void loadDocuments(docPage)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [hasProcessingDocs, sidebarTab, docPage, loadDocuments])

  const handleDeleteDocument = useCallback(
    (doc: LoveQaDocumentSummary) => {
      Modal.confirm({
        title: '删除知识库文档',
        content: `确定删除「${doc.title?.trim() || '未命名文档'}」？删除后问答将不再召回该内容。`,
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          const resp = await deleteLoveQaDocument(doc.documentId)
          if (resp.code !== 0) {
            throw new Error(resp.message || '删除失败')
          }
          message.success('已删除')
          void loadDocuments(docPage)
        },
      })
    },
    [docPage, loadDocuments],
  )

  const handleReingestDocument = useCallback(
    async (doc: LoveQaDocumentSummary) => {
      try {
        const resp = await postLoveQaReingest(doc.documentId)
        if (resp.code !== 0 || !resp.data) {
          throw new Error(resp.message || '重入库失败')
        }
        message.info('已提交重入库，请稍候刷新状态')
        void loadDocuments(docPage)
      } catch (e) {
        message.error(e instanceof Error ? e.message : '重入库失败')
      }
    },
    [docPage, loadDocuments],
  )

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
      retrievedChunks:
        m.role === 'assistant' && m.retrievedChunks && m.retrievedChunks.length > 0
          ? m.retrievedChunks
          : undefined,
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
    if (!canChat) {
      message.warning('请先绑定情侣后再使用恋爱问答')
      return
    }
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
          onRetrieved: (chunks) => {
            // 将检索到的引用关联到当前 assistant 消息
            setMessages((prev) =>
              prev.map((m) => (m.key === assistantKey ? { ...m, retrievedChunks: chunks } : m)),
            )
          },
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
        e instanceof Error && e.name === 'AbortError'
          ? '请求超时，请稍后再试'
          : e instanceof Error
            ? e.message
            : '发送失败'
      message.error(errMsg)
    } finally {
      window.clearTimeout(timeoutId)
      setSending(false)
    }
  }, [input, sending, conversationId, coupleId, canChat, loadConversations])

  const openIngestModal = useCallback(() => {
    if (!canIngest) {
      message.warning('请先绑定情侣后再补充知识库')
      return
    }
    setIngestOpen(true)
  }, [canIngest])

  const closeIngestModal = useCallback(() => {
    if (ingestSubmitting) return
    setIngestOpen(false)
    setIngestMode('text')
    setIngestFile(null)
    form.resetFields()
  }, [form, ingestSubmitting])

  const onIngestModeChange = useCallback(
    (key: IngestMode) => {
      setIngestMode(key)
      setIngestFile(null)
      form.resetFields(['text', 'sourceUrl'])
    },
    [form],
  )

  const onIngest = useCallback(
    async (values: { title?: string; text?: string; sourceUrl?: string; category?: string }) => {
      if (!coupleId) {
        message.warning('请先绑定情侣后再补充知识库')
        return
      }
      setIngestSubmitting(true)
      try {
        let resp
        if (ingestMode === 'text') {
          const text = values.text?.trim()
          if (!text) {
            message.warning('请填写要入库的正文')
            return
          }
          resp = await postLoveQaIngest({
            text,
            title: values.title?.trim() || undefined,
            category: values.category?.trim() || undefined,
            coupleId,
          })
        } else if (ingestMode === 'file') {
          if (!ingestFile) {
            message.warning('请选择要上传的文件')
            return
          }
          const formData = new FormData()
          formData.append('file', ingestFile.originFileObj as File)
          if (values.title) formData.append('title', values.title)
          if (values.category) formData.append('category', values.category)
          formData.append('coupleId', coupleId)
          resp = await postLoveQaIngestFile(formData)
        } else if (ingestMode === 'url') {
          const url = values.sourceUrl?.trim()
          if (!url) {
            message.warning('请输入有效的 URL')
            return
          }
          resp = await postLoveQaIngestUrl({
            sourceUrl: url,
            title: values.title?.trim() || undefined,
            category: values.category?.trim() || undefined,
            coupleId,
          })
        } else {
          return
        }
        if (!resp || resp.code !== 0 || !resp.data) {
          throw new Error(resp?.message || '入库失败')
        }
        const { documentId, status, chunkCount } = resp.data
        if (status === 'PENDING' || status === 'PROCESSING') {
          message.success('已提交入库，正在后台处理…')
          setSidebarTab('knowledge')
          setDocPage(1)
          void loadDocuments(1)
        } else {
          message.success(
            `已入库 ${chunkCount} 个片段（文档 ${documentId.slice(0, 8)}…）`,
          )
        }
        form.resetFields()
        setIngestFile(null)
        setIngestOpen(false)
        setIngestMode('text')
      } catch (e) {
        message.error(e instanceof Error ? e.message : '入库失败')
      } finally {
        setIngestSubmitting(false)
      }
    },
    [form, ingestMode, ingestFile, coupleId, loadDocuments],
  )

  const knowledgeSidebarBody = useMemo(
    () => (
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 pb-3">
        <Tooltip title={canIngest ? '添加文本、文件或网页到情侣知识库' : '绑定情侣后可补充知识库'}>
          <Button
            type="default"
            icon={<UploadOutlined aria-hidden />}
            onClick={openIngestModal}
            disabled={!canIngest}
            className={SIDEBAR_ACTION_BTN_CLASS}
          >
            补充知识库
          </Button>
        </Tooltip>
        {!canIngest ? (
          <Text className="px-1 text-xs leading-relaxed text-[#831843]/55">
            绑定情侣后可管理情侣私有知识库
          </Text>
        ) : (
          <div className="flex items-center justify-between px-1">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-[#831843]/45">
              已入库文档
            </Text>
            {docTotal > 0 ? (
              <Text className="text-[11px] text-[#831843]/45">共 {docTotal} 篇</Text>
            ) : null}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin]">
          {documentsLoading && documents.length === 0 ? (
            <div className="flex justify-center py-6">
              <Spin />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-2 py-6 text-center">
              <Text className="text-xs leading-relaxed text-[#831843]/50">
                还没有知识内容，补充后问答会更懂你们
              </Text>
              <Button
                type="default"
                size="small"
                icon={<UploadOutlined aria-hidden />}
                onClick={openIngestModal}
                disabled={!canIngest}
                className="!rounded-full !border-rose-200/90 !text-[#831843] hover:!border-[#F472B6] hover:!bg-rose-50/90"
              >
                立即补充
              </Button>
            </div>
          ) : (
            <ul className="space-y-1" aria-label="知识库文档列表">
              {documents.map((doc) => (
                <li
                  key={doc.documentId}
                  className="group relative rounded-xl border border-rose-100/80 bg-white/90 px-2.5 py-2"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1 pr-6">
                      <div className="line-clamp-1 text-[13px] font-medium text-[#831843]">
                        {doc.title?.trim() || doc.sourceUrl?.trim() || '（未命名）'}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {documentStatusTag(doc.status)}
                        {doc.status === 'SUCCESS' ? (
                          <Text className="text-[11px] text-[#831843]/45">{doc.chunkCount} 片段</Text>
                        ) : null}
                      </div>
                      <Text className="mt-0.5 block text-[11px] text-[#831843]/40">
                        {doc.updatedAt ? dayjs(doc.updatedAt).format('MM-DD HH:mm') : ''}
                      </Text>
                    </div>
                    <Dropdown
                      trigger={['click']}
                      menu={{
                        items: [
                          ...(doc.status === 'FAILED'
                            ? [
                                {
                                  key: 'reingest',
                                  label: '重试入库',
                                  onClick: () => void handleReingestDocument(doc),
                                },
                              ]
                            : []),
                          {
                            key: 'delete',
                            label: '删除',
                            icon: <DeleteOutlined />,
                            danger: true,
                            onClick: () => handleDeleteDocument(doc),
                          },
                        ],
                      }}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<MoreOutlined />}
                        className="!absolute right-1 top-1 !text-[#831843]/50 opacity-0 group-hover:opacity-100"
                        aria-label="文档操作"
                      />
                    </Dropdown>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {docTotal > DOC_PAGE_SIZE ? (
          <Pagination
            size="small"
            simple
            current={docPage}
            pageSize={DOC_PAGE_SIZE}
            total={docTotal}
            onChange={(p) => setDocPage(p)}
            className="!text-center"
          />
        ) : null}
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined aria-hidden />}
          onClick={() => void loadDocuments(docPage)}
          className="!w-full !cursor-pointer !justify-start !text-[#831843]/70 hover:!bg-rose-100/60"
        >
          刷新列表
        </Button>
      </div>
    ),
    [
      canIngest,
      docPage,
      docTotal,
      documents,
      documentsLoading,
      handleDeleteDocument,
      handleReingestDocument,
      loadDocuments,
      openIngestModal,
    ],
  )

  const sidebarBody = useMemo(
    () => (
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 pb-3">
        <Button
          type="default"
          icon={<PlusOutlined aria-hidden />}
          onClick={startNewChat}
          className={SIDEBAR_ACTION_BTN_CLASS}
        >
          新建对话
        </Button>
        <div className="px-1">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-[#831843]/45">
            最近对话
          </Text>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin]">
          {listLoading ? (
            <div className="flex justify-center py-6">
              <Spin />
            </div>
          ) : conversations.length === 0 ? (
            <Text className="block px-2 py-4 text-center text-xs text-[#831843]/50">
              暂无历史，在右侧开始提问吧
            </Text>
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
            className="!w-full !cursor-pointer !justify-start !text-[#831843]/70 hover:!bg-rose-100/60 hover:!text-[#831843]"
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
        'flex gap-2 border border-rose-200/90 bg-white shadow-sm transition-shadow duration-200 focus-within:border-[#F472B6]/80 focus-within:shadow-md',
        composerMultiLine ? 'items-end' : 'items-center',
        opts.large ? 'rounded-[1.75rem] px-4 py-3 sm:gap-3 sm:px-5 sm:py-4' : 'rounded-2xl px-3 py-2.5',
      ].join(' ')}
    >
      <Input.TextArea
        ref={composerRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          canChat
            ? '向恋爱小助手提问，例如：吵架后怎么和好比较快？'
            : '绑定情侣后可基于你们的知识库提问'
        }
        autoSize={opts.large ? { minRows: 1, maxRows: 5 } : { minRows: 1, maxRows: 6 }}
        maxLength={4000}
        disabled={sending || !canChat}
        onPressEnter={(e) => {
          if (!e.shiftKey) {
            e.preventDefault()
            void onSend()
          }
        }}
        className="!min-h-11 !min-w-0 !flex-1 !resize-none !border-0 !bg-transparent !p-0 !py-[11px] !shadow-none !text-[15px] !leading-[22px] !text-[#431407] placeholder:!text-[#831843]/40 focus:!shadow-none"
      />
      <div className="flex shrink-0 items-center gap-1">
        {coupleLoading ? <Spin size="small" /> : null}
        <Button
          type="default"
          shape="circle"
          size="large"
          icon={<img src={sendButtonIcon} alt="" aria-hidden className="size-11 object-contain" />}
          loading={sending}
          onClick={() => void onSend()}
          disabled={!input.trim() || !canChat}
          aria-label="发送"
          className="!flex !size-11 !min-w-0 !cursor-pointer !items-center !justify-center !border-0 !bg-transparent !p-0 !shadow-none hover:!bg-transparent disabled:!cursor-not-allowed disabled:!opacity-40"
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
        className="hidden h-full min-h-0 w-[min(100%,300px)] shrink-0 flex-col overflow-hidden border-b border-rose-100/90 bg-gradient-to-b from-[#FDF2F8] via-[#FFF7FB] to-white lg:flex lg:border-b-0 lg:border-r"
        aria-label="恋爱问答侧栏"
      >
        <div className="flex items-center gap-2 border-b border-rose-100/80 px-4 py-4">
          <KejiMascot />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[#831843]">恋爱问答</div>
            <div className="truncate text-xs text-[#831843]/55">知识库 + 多轮记忆</div>
          </div>
        </div>
        <SidebarTabSwitch
          activeKey={sidebarTab}
          onChange={setSidebarTab}
          knowledgeCount={docTotal}
          processingDocs={hasProcessingDocs}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {sidebarTab === 'chat' ? sidebarBody : knowledgeSidebarBody}
        </div>
      </aside>

      {/* 主区 */}
      <section className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
        {/* 移动端顶栏 */}
        <header className="flex items-center justify-between gap-2 border-b border-rose-100/90 px-3 py-2.5 lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <KejiMascot size="sm" />
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
              <div className="mb-5">
                <KejiMascot size="lg" />
              </div>
              <Title
                level={3}
                className="!mb-2 !text-xl !font-semibold !text-[#831843] sm:!text-2xl"
              >
                你好，我是恋爱小助手
              </Title>
              <Text className="max-w-md text-[15px] leading-relaxed text-[#831843]/75">
                一起回答找到答案。
              </Text>
            </div>
            <div className="w-full max-w-2xl">
              {!canChat ? (
                <Alert
                  type="info"
                  showIcon
                  className="!mb-3"
                  message="尚未绑定情侣"
                  description="恋爱问答会检索你们情侣私有知识库（及可选公共库），绑定后即可开始提问。"
                />
              ) : null}
              {composer({ large: true })}
            </div>
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
                      {/* 检索引用展示（仅 assistant 消息） */}
                      {m.role === 'assistant' &&
                        m.retrievedChunks &&
                        m.retrievedChunks.length > 0 && (
                          <div className="mb-2 space-y-1.5 border-b border-rose-100 pb-2">
                            <Text className="flex items-center gap-1 text-[11px] text-[#831843]/60">
                              <BookOutlined aria-hidden className="text-[11px]" />
                              <span>
                                参考了 {m.retrievedChunks.length} 条知识
                                {m.retrievedChunks.some((c) => c.source) && (
                                  <>
                                    ：
                                    {[
                                      ...new Set(
                                        m.retrievedChunks.map((c) => c.source).filter(Boolean),
                                      ),
                                    ]
                                      .slice(0, 3)
                                      .join('、')}
                                  </>
                                )}
                              </span>
                            </Text>
                            <div className="space-y-1">
                              {m.retrievedChunks.map((chunk, idx) => {
                                const highlighted =
                                  highlightedSource?.messageKey === m.key &&
                                  highlightedSource.idx === idx
                                return (
                                  <div
                                    key={`${chunk.id}-${idx}`}
                                    id={`source-${m.key}-${idx}`}
                                    className={[
                                      'rounded-lg border px-2 py-1.5 text-[11px] leading-snug transition-colors duration-300',
                                      highlighted
                                        ? 'border-rose-400 bg-rose-100/90 ring-1 ring-rose-300'
                                        : 'border-rose-100/80 bg-white/80 text-[#831843]/75',
                                    ].join(' ')}
                                  >
                                    <span className="font-medium text-rose-700">[{idx + 1}]</span>
                                    {chunk.source ? (
                                      <span className="ml-1 text-[#831843]/55">{chunk.source}</span>
                                    ) : null}
                                    {chunk.textPreview ? (
                                      <p className="mt-0.5 line-clamp-2 text-[#431407]/80">
                                        {chunk.textPreview}
                                      </p>
                                    ) : null}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      {m.role === 'assistant'
                        ? renderMessageWithCitations(m.content, (idx) => {
                            setHighlightedSource({ messageKey: m.key, idx })
                            window.setTimeout(() => {
                              const sourceEl = document.getElementById(`source-${m.key}-${idx}`)
                              sourceEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                              window.setTimeout(() => setHighlightedSource(null), 1800)
                            }, 80)
                          })
                        : m.content}
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
        title={<span className="text-[#831843]">对话与知识库</span>}
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={null}
        width={360}
        destroyOnClose
        classNames={{ body: '!pt-1' }}
      >
        <div className="flex max-h-[70vh] min-h-[50vh] flex-col overflow-hidden">
          <SidebarTabSwitch
            activeKey={sidebarTab}
            onChange={setSidebarTab}
            knowledgeCount={docTotal}
            processingDocs={hasProcessingDocs}
          />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {sidebarTab === 'chat' ? sidebarBody : knowledgeSidebarBody}
          </div>
        </div>
      </Modal>

      <Modal
        title={
          <div className="flex items-start gap-3 pr-6">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm shadow-rose-200/50"
              aria-hidden
            >
              <BookOutlined className="text-lg text-[#DB2777]" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold text-[#831843]">补充知识库</div>
              <div className="mt-0.5 text-sm font-normal leading-relaxed text-[#831843]/60">
                添加你们的约定、笔记或文章，恋爱问答会检索并引用这些内容
              </div>
            </div>
          </div>
        }
        open={ingestOpen}
        onCancel={closeIngestModal}
        footer={null}
        destroyOnClose
        centered
        width={640}
        classNames={{
          content: '!rounded-2xl !overflow-hidden !p-0',
          header: '!mb-0 !border-b !border-rose-100/90 !bg-gradient-to-r from-[#FFF7FB] to-white !px-6 !py-5',
          body: '!px-6 !py-5',
        }}
        maskClosable={!ingestSubmitting}
      >
        <div>
          {!canIngest ? (
            <Alert
              type="warning"
              showIcon
              className="!mb-4 !rounded-xl !border-amber-200/80 !bg-amber-50/80"
              message="尚未绑定情侣"
              description="知识库按情侣隔离存储，绑定后可为你们的专属知识库补充内容。"
            />
          ) : (
            <div className="mb-4 rounded-xl border border-rose-100/90 bg-rose-50/40 px-3.5 py-2.5">
              <Text className="text-xs leading-relaxed text-[#831843]/65">
                内容将分片写入向量库。处理完成后可在左侧「知识库」Tab 查看入库状态。
              </Text>
            </div>
          )}

          <IngestModeSwitch
            activeKey={ingestMode}
            onChange={onIngestModeChange}
            disabled={!canIngest || ingestSubmitting}
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={onIngest}
            disabled={!canIngest}
            className="love-qa-ingest-form mt-5 [&_.ant-form-item-label>label]:!text-[#831843]/80"
            requiredMark={false}
          >
            <div className="grid gap-0 sm:grid-cols-2 sm:gap-4">
              <Form.Item label="标题（可选）" name="title" className="!mb-4 sm:!mb-5">
                <Input
                  placeholder="例如：我们吵架后的沟通约定"
                  maxLength={120}
                  disabled={ingestSubmitting}
                />
              </Form.Item>
              <div>
                <Form.Item label="分类（可选）" name="category" className="!mb-2">
                  <Input
                    placeholder="沟通 / 冲突 / 浪漫 等"
                    disabled={ingestSubmitting}
                  />
                </Form.Item>
                <div className="mb-4 flex flex-wrap gap-1.5 sm:mb-5">
                  {CATEGORY_PRESETS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      disabled={!canIngest || ingestSubmitting}
                      onClick={() => form.setFieldValue('category', tag)}
                      className="cursor-pointer rounded-full border border-rose-200/90 bg-white px-2.5 py-0.5 text-xs text-[#831843]/75 transition-colors duration-200 hover:border-[#F472B6] hover:bg-rose-50/90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={INGEST_MODE_BODY_CLASS}>
              {ingestMode === 'text' ? (
                <Form.Item
                  label="正文"
                  name="text"
                  rules={[{ required: true, message: '请填写正文' }]}
                  className="!mb-0 !h-full [&_.ant-form-item-control]:!flex-1"
                >
                  <Input.TextArea
                    placeholder="粘贴文章片段、笔记或约定事项…"
                    maxLength={50_000}
                    showCount
                    disabled={ingestSubmitting}
                    className={INGEST_MODE_TEXTAREA_H}
                  />
                </Form.Item>
              ) : null}

              {ingestMode === 'file' ? (
                <Form.Item label="选择文件" required className="!mb-0 !h-full [&_.ant-form-item-control]:!flex-1">
                  <Upload.Dragger
                    beforeUpload={() => false}
                    maxCount={1}
                    fileList={ingestFile ? [ingestFile] : []}
                    onChange={({ fileList }) => setIngestFile(fileList[0] || null)}
                    accept=".txt,.md,.markdown"
                    disabled={!canIngest || ingestSubmitting}
                    className={`love-qa-ingest-upload !rounded-xl ${INGEST_MODE_FIELD_H} [&_.ant-upload-drag]:!rounded-xl [&_.ant-upload-drag]:!border-rose-200/90 [&_.ant-upload-drag]:!bg-rose-50/25 [&_.ant-upload-drag:hover]:!border-[#F472B6]`}
                  >
                    <p className="ant-upload-drag-icon !mb-2">
                      <UploadOutlined className="!text-2xl !text-[#DB2777]" aria-hidden />
                    </p>
                    <p className="ant-upload-text !text-sm !font-medium !text-[#831843]">
                      点击或拖拽文件到此处
                    </p>
                    <p className="ant-upload-hint !text-xs !text-[#831843]/50">
                      支持 .txt、.md，单个文本文件
                    </p>
                  </Upload.Dragger>
                </Form.Item>
              ) : null}

              {ingestMode === 'url' ? (
                <Form.Item
                  label="网页 URL"
                  name="sourceUrl"
                  rules={[
                    { required: true, message: '请输入 URL' },
                    {
                      pattern: /^https?:\/\/.+/i,
                      message: '请以 http:// 或 https:// 开头',
                    },
                  ]}
                  className="!mb-0 !h-full [&_.ant-form-item-control]:!flex-1"
                >
                  <div className={`flex ${INGEST_MODE_FIELD_H} flex-col justify-center`}>
                    <Input
                      prefix={<LinkOutlined className="text-[#831843]/40" aria-hidden />}
                      placeholder="https://example.com/love-article"
                      disabled={ingestSubmitting}
                    />
                  </div>
                </Form.Item>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-rose-100/90 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Text className="text-xs leading-relaxed text-[#831843]/45">
                {ingestMode === 'file'
                  ? '上传后将自动分片入库'
                  : ingestMode === 'url'
                    ? '系统将抓取网页正文后入库'
                    : '建议单次粘贴清晰、完整的段落'}
              </Text>
              <div className="flex shrink-0 justify-end gap-2">
                <Button onClick={closeIngestModal} disabled={ingestSubmitting}>
                  取消
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={ingestSubmitting}
                  disabled={!canIngest}
                  icon={<UploadOutlined aria-hidden />}
                  className="!min-w-[7.5rem]"
                >
                  {INGEST_SUBMIT_LABEL[ingestMode]}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  )
}
