import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons'
import {
  Button,
  Calendar,
  Card,
  Empty,
  FloatButton,
  List,
  Modal,
  Spin,
  Typography,
  message,
} from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react'
import { Link, Navigate } from 'react-router-dom'
import MemorialDayFormModal from '../components/MemorialDayFormModal'
import { deleteMemorial, monthDayKey, type MemorialDay } from '../services/memorial'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'
import {
  formatCountdown,
  remainingMsFromAnchor,
  useMemorialStore,
} from '../stores/memorialStore'

const { Title, Text, Paragraph } = Typography

const POLL_NEXT_MS = 15_000
const POLL_LIST_MS = 45_000

function sortMemorials(items: MemorialDay[]): MemorialDay[] {
  return [...items].sort((a, b) => a.memorialDate.localeCompare(b.memorialDate))
}

export default function MemorialPage() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const fetchCoupleInfo = useCoupleStore((s) => s.fetchCoupleInfo)
  const coupleLoading = useCoupleStore((s) => s.loading)
  const coupleInfo = useCoupleStore((s) => s.info)
  const coupleId = coupleInfo?.bindingId ?? null

  const items = useMemorialStore((s) => s.items)
  const nextPayload = useMemorialStore((s) => s.nextPayload)
  const countdownAnchor = useMemorialStore((s) => s.countdownAnchor)
  const loadingList = useMemorialStore((s) => s.loadingList)
  const loadingNext = useMemorialStore((s) => s.loadingNext)
  const fetchList = useMemorialStore((s) => s.fetchList)
  const fetchNext = useMemorialStore((s) => s.fetchNext)
  const fetchUpcoming = useMemorialStore((s) => s.fetchUpcoming)
  const invalidate = useMemorialStore((s) => s.invalidate)
  const clearMemorial = useMemorialStore((s) => s.clear)

  const [calValue, setCalValue] = useState(() => dayjs())
  const [tick, setTick] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [formDefaultDate, setFormDefaultDate] = useState(() => dayjs())
  const [formEditing, setFormEditing] = useState<MemorialDay | null>(null)

  const sortedItems = useMemo(() => sortMemorials(items), [items])

  useEffect(() => {
    if (!isAuthed) return
    void fetchCoupleInfo().catch(() => undefined)
  }, [isAuthed, fetchCoupleInfo])

  useEffect(() => {
    if (!coupleId) {
      clearMemorial()
      return
    }
    void fetchList(coupleId).catch(() => undefined)
    void fetchNext(coupleId).catch(() => undefined)
    void fetchUpcoming(coupleId).catch(() => undefined)
  }, [coupleId, fetchList, fetchNext, fetchUpcoming, clearMemorial])

  useEffect(() => {
    if (!coupleId) return
    const id = window.setInterval(() => {
      void fetchNext(coupleId).catch(() => undefined)
      void fetchUpcoming(coupleId).catch(() => undefined)
    }, POLL_NEXT_MS)
    return () => window.clearInterval(id)
  }, [coupleId, fetchNext, fetchUpcoming])

  useEffect(() => {
    if (!coupleId) return
    const id = window.setInterval(() => {
      void fetchList(coupleId).catch(() => undefined)
    }, POLL_LIST_MS)
    return () => window.clearInterval(id)
  }, [coupleId, fetchList])

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const monthDaySet = useMemo(() => {
    const s = new Set<string>()
    for (const m of items) {
      s.add(monthDayKey(m.memorialDate))
    }
    return s
  }, [items])

  const remainingMs = useMemo(
    () => remainingMsFromAnchor(countdownAnchor),
    [countdownAnchor, tick],
  )
  const cd =
    remainingMs != null && nextPayload?.memorial
      ? formatCountdown(remainingMs)
      : null

  const openCreate = useCallback((d: Dayjs) => {
    setFormEditing(null)
    setFormDefaultDate(d)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((m: MemorialDay) => {
    setFormEditing(m)
    setFormDefaultDate(dayjs(m.memorialDate))
    setFormOpen(true)
  }, [])

  const onDelete = useCallback(
    (m: MemorialDay) => {
      Modal.confirm({
        title: '删除纪念日',
        content: `确定删除「${m.name}」吗？`,
        okButtonProps: { danger: true },
        onOk: async () => {
          const resp = await deleteMemorial(m.id)
          if (resp.code !== 0) {
            message.error(resp.message || '删除失败')
            return
          }
          message.success('已删除')
          if (coupleId) await invalidate(coupleId)
        },
      })
    },
    [coupleId, invalidate],
  )

  /** 与默认 Calendar 头部能力对齐：年月展示 + 切月 + 回到今天（组件 headerRender API） */
  const calendarHeaderRender = useCallback(
    ({
      value,
      onChange,
    }: {
      value: Dayjs
      type: 'month' | 'year'
      onChange: (d: Dayjs) => void
      onTypeChange: (t: 'month' | 'year') => void
    }) => (
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-rose-100/90 px-1 pb-3">
        <div className="flex min-w-0 flex-1 items-center justify-center gap-0.5 sm:justify-start">
          <Button
            type="text"
            size="small"
            className="shrink-0 cursor-pointer text-stone-600 hover:!bg-rose-50 hover:!text-rose-900"
            icon={<LeftOutlined />}
            aria-label="上一月"
            onClick={() => onChange(value.subtract(1, 'month'))}
          />
          <Text strong className="min-w-0 px-1 text-center text-[15px] text-stone-900 sm:min-w-[9rem]">
            {value.format('YYYY年 M月')}
          </Text>
          <Button
            type="text"
            size="small"
            className="shrink-0 cursor-pointer text-stone-600 hover:!bg-rose-50 hover:!text-rose-900"
            icon={<RightOutlined />}
            aria-label="下一月"
            onClick={() => onChange(value.add(1, 'month'))}
          />
        </div>
        <Button
          size="small"
          type="default"
          className="cursor-pointer shrink-0 border-rose-200/90 bg-white text-rose-900 shadow-sm transition-colors duration-200 hover:border-rose-300 hover:!bg-rose-50 hover:!text-rose-950"
          onClick={() => onChange(dayjs())}
        >
          今天
        </Button>
      </div>
    ),
    [],
  )

  /** 有纪念日的日期：圆形底纹 + 小点辅助（非唯一信息载体，列表可管理） */
  const fullCellRender = useCallback(
    (current: Dayjs, info: { type: string; originNode: ReactElement }) => {
      if (info.type !== 'date') {
        return info.originNode
      }
      const marked = monthDaySet.has(current.format('MM-DD'))
      return (
        <div className="relative flex min-h-[72px] flex-col items-center">
          {marked ? (
            <div
              className="pointer-events-none absolute left-1/2 top-[6px] h-8 w-8 -translate-x-1/2 rounded-full bg-gradient-to-b from-rose-200/90 to-rose-300/75 shadow-inner ring-2 ring-rose-400/35"
              aria-hidden
            />
          ) : null}
          <div className={`relative z-[1] w-full ${marked ? '[&_.ant-picker-calendar-date-value]:font-semibold [&_.ant-picker-calendar-date-value]:text-rose-950' : ''}`}>
            {info.originNode}
          </div>
        </div>
      )
    },
    [monthDaySet],
  )

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {coupleLoading ? (
        <div className="flex justify-center py-24">
          <Spin size="large" />
        </div>
      ) : !coupleId ? (
        <Empty
          className="ls-surface py-16"
          description="请先完成情侣绑定"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Link to="/couple" className="ls-link">
            去情侣首页绑定
          </Link>
        </Empty>
      ) : (
        <div className="flex flex-col gap-6">
          <Card className="ls-surface border-rose-200/90" loading={loadingNext && !nextPayload}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 transition-shadow duration-200 hover:shadow-md">
                  <CalendarOutlined className="text-xl" aria-hidden />
                </div>
                <div>
                  <Text type="secondary" className="text-xs uppercase tracking-wide">
                    最近纪念日
                  </Text>
                  {nextPayload?.memorial ? (
                    <>
                      <Title level={4} className="!mb-0 !mt-1 !text-stone-900">
                        {nextPayload.memorial.name}
                      </Title>
                      <Text type="secondary" className="text-sm">
                        下次：{nextPayload.nextOccurrenceDate ?? '—'}
                        {nextPayload.today ? ' · 就是今天' : ''}
                      </Text>
                    </>
                  ) : (
                    <Paragraph className="!mb-0 !mt-1 text-stone-600">
                      暂无纪念日，点击右下角「+」添加
                    </Paragraph>
                  )}
                </div>
              </div>
              {cd && nextPayload?.memorial ? (
                <div className="rounded-xl border border-rose-200/80 bg-white px-4 py-3 text-center shadow-sm transition-shadow duration-200 hover:shadow-md sm:text-left">
                  <Text type="secondary" className="text-xs">
                    剩余时间
                  </Text>
                  <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-rose-900 sm:text-2xl">
                    <span>{cd.days}</span>
                    <span className="text-stone-500"> 天 </span>
                    <span>{String(cd.hours).padStart(2, '0')}</span>
                    <span className="text-stone-400">:</span>
                    <span>{String(cd.minutes).padStart(2, '0')}</span>
                    <span className="text-stone-400">:</span>
                    <span>{String(cd.seconds).padStart(2, '0')}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="ls-surface overflow-hidden border-rose-200/90 p-0">
            <div className="memorial-calendar-wrap px-2 pb-4 pt-2">
              <Spin spinning={loadingList}>
                <Calendar
                  value={calValue}
                  onChange={(v) => setCalValue(v)}
                  headerRender={calendarHeaderRender}
                  fullCellRender={fullCellRender}
                  fullscreen={false}
                />
              </Spin>
            </div>
          </Card>

          <Card className="ls-surface border-rose-200/90">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <Text strong className="text-stone-800">
                  全部纪念日
                </Text>
                <Text type="secondary" className="ml-2 text-sm">
                  管理名称与日期
                </Text>
              </div>
            </div>
            <List
              dataSource={sortedItems}
              locale={{ emptyText: '暂无纪念日，请点击右下角「+」创建' }}
              renderItem={(m) => (
                <List.Item
                  className="!px-0"
                  actions={[
                    <Button
                      key="e"
                      type="link"
                      size="small"
                      className="cursor-pointer"
                      icon={<EditOutlined />}
                      onClick={() => openEdit(m)}
                    >
                      编辑
                    </Button>,
                    <Button
                      key="d"
                      type="link"
                      size="small"
                      danger
                      className="cursor-pointer"
                      icon={<DeleteOutlined />}
                      onClick={() => onDelete(m)}
                    >
                      删除
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={<span className="text-stone-900">{m.name}</span>}
                    description={
                      <span className="text-stone-600">
                        每年 {dayjs(m.memorialDate).format('M月D日')}
                        {m.description ? ` · ${m.description}` : ''}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <FloatButton
            type="primary"
            icon={<PlusOutlined />}
            tooltip="新建纪念日"
            className="!border-rose-400 !bg-rose-500 hover:!bg-rose-600"
            style={{ insetInlineEnd: 24, bottom: 24 }}
            onClick={() => openCreate(dayjs())}
          />
        </div>
      )}

      <MemorialDayFormModal
        open={formOpen && !!coupleId}
        coupleId={coupleId ?? ''}
        defaultDate={formDefaultDate}
        editing={formEditing}
        onClose={() => {
          setFormOpen(false)
          setFormEditing(null)
        }}
        onSaved={() => {
          if (coupleId) void invalidate(coupleId)
        }}
      />
    </div>
  )
}
