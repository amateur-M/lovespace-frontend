import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Collapse, Empty, FloatButton, List, Modal, Spin, Typography, message } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import MemorialDayFormModal from '../components/MemorialDayFormModal'
import MemorialPhotoWall from '../components/memorial/MemorialPhotoWall'
import MemorialRomanticDecor from '../components/memorial/MemorialRomanticDecor'
import { deleteMemorial, type MemorialDay } from '../services/memorial'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'
import {
  formatCountdown,
  remainingMsFromAnchor,
  useMemorialStore,
} from '../stores/memorialStore'

const { Text, Paragraph } = Typography

const POLL_NEXT_MS = 15_000
const POLL_LIST_MS = 45_000

const BLESSING_LINES = [
  '把平凡的日子过成节日，把心动藏进每一次倒数。',
  '时间会慢慢走，但与你有关的日子，永远闪闪发亮。',
  '愿每一次纪念日，都是温柔提醒：我们仍彼此选择。',
  '在循环的年岁里，重复同一句喜欢，也很浪漫。',
]

function sortMemorials(items: MemorialDay[]): MemorialDay[] {
  return [...items].sort((a, b) => a.memorialDate.localeCompare(b.memorialDate))
}

function blessingForCouple(coupleId: string): string {
  let h = 0
  for (let i = 0; i < coupleId.length; i++) h = (h * 31 + coupleId.charCodeAt(i)) >>> 0
  return BLESSING_LINES[h % BLESSING_LINES.length]
}

function WavyTitleLine() {
  return (
    <svg
      className="mx-auto mt-3 h-4 w-56 text-rose-400/85 sm:w-64"
      viewBox="0 0 240 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 10c18-8 38 8 56 0s38-8 56 0 38 8 56 0 38-8 56 0"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-90"
      />
    </svg>
  )
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

  const remainingMs = useMemo(
    () => remainingMsFromAnchor(countdownAnchor),
    [countdownAnchor, tick],
  )
  const cd =
    remainingMs != null && nextPayload?.memorial
      ? formatCountdown(remainingMs)
      : null

  const blessingText = useMemo(() => {
    const desc = nextPayload?.memorial?.description?.trim()
    if (desc) return desc
    if (coupleId) return blessingForCouple(coupleId)
    return BLESSING_LINES[0]
  }, [nextPayload?.memorial?.description, coupleId])

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

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="relative w-full">
      <MemorialRomanticDecor />

      {coupleLoading ? (
        <div className="relative z-10 flex justify-center py-24">
          <Spin size="large" />
        </div>
      ) : !coupleId ? (
        <Empty
          className="relative z-10 ls-surface py-16"
          description="请先完成情侣绑定"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Link to="/couple" className="ls-link">
            去情侣首页绑定
          </Link>
        </Empty>
      ) : (
        <div className="relative z-10 flex flex-col gap-10">
          {/* 顶部：标题与创建入口 */}
          <header className="text-center">
            <p className="memorial-accent text-2xl leading-none text-rose-700/85 sm:text-3xl">
              Love &amp; Dates
            </p>
            <h1 className="memorial-display mt-2 text-4xl text-rose-950 sm:text-5xl">纪念日</h1>
            <WavyTitleLine />
            <Paragraph className="mx-auto mt-4 max-w-lg text-pretty text-sm leading-relaxed text-stone-600 sm:text-base">
              简约留白，只放最重要的事：与你有关的日子，值得被轻轻记住、慢慢倒数。
            </Paragraph>
          </header>

          {/* 恋爱倒计时与祝福语（位于照片墙上方） */}
          <section className="rounded-2xl border border-rose-200/85 bg-gradient-to-b from-white/95 to-rose-50/90 p-6 shadow-md sm:p-8">
            <div className="text-center">
              <Text type="secondary" className="text-xs uppercase tracking-[0.2em] text-rose-800/70">
                下一次心动
              </Text>
              <h2 className="memorial-display mt-2 text-2xl text-stone-900 sm:text-3xl">
                {nextPayload?.memorial?.name ?? '还没有纪念日'}
              </h2>
              {nextPayload?.memorial ? (
                <Text type="secondary" className="mt-1 block text-sm">
                  下次：{nextPayload.nextOccurrenceDate ?? '—'}
                  {nextPayload.today ? ' · 就是今天' : ''}
                </Text>
              ) : (
                <Text type="secondary" className="mt-1 block text-sm">
                  点击右下角「+」，写下第一个只属于你们的日子
                </Text>
              )}
            </div>

            {loadingNext && !nextPayload ? (
              <div className="mt-6 flex justify-center py-6">
                <Spin />
              </div>
            ) : null}

            {cd && nextPayload?.memorial ? (
              <div className="mt-6 flex justify-center">
                <div className="rounded-2xl border border-rose-200/90 bg-white/90 px-6 py-4 text-center shadow-inner">
                  <Text type="secondary" className="text-xs">
                    剩余时间
                  </Text>
                  <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-rose-900 sm:text-3xl">
                    <span>{cd.days}</span>
                    <span className="text-stone-500"> 天 </span>
                    <span>{String(cd.hours).padStart(2, '0')}</span>
                    <span className="text-stone-400">:</span>
                    <span>{String(cd.minutes).padStart(2, '0')}</span>
                    <span className="text-stone-400">:</span>
                    <span>{String(cd.seconds).padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            ) : null}

            <blockquote className="mx-auto mt-8 max-w-xl border-l-4 border-rose-300/80 pl-4 text-left text-base italic leading-relaxed text-stone-700 sm:text-lg">
              {nextPayload?.today && nextPayload.memorial
                ? '就是今天。把喜欢再说一遍，把拥抱再紧一点。'
                : blessingText}
            </blockquote>
          </section>

          {/* 照片墙 */}
          <section className="rounded-2xl border border-rose-200/80 bg-white/75 p-4 shadow-sm backdrop-blur-sm sm:p-6">
            <MemorialPhotoWall coupleId={coupleId} />
          </section>

          {/* 列表管理 */}
          <Collapse
            bordered={false}
            className="rounded-xl bg-white/70 shadow-sm"
            items={[
              {
                key: 'manage',
                label: (
                  <span className="font-medium text-stone-800">全部纪念日</span>
                ),
                children: (
                  <div className="flex flex-col gap-4">
                    <Spin spinning={loadingList}>
                      <List
                      dataSource={sortedItems}
                      locale={{ emptyText: '暂无纪念日，点击右下角「+」创建' }}
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
                    </Spin>
                  </div>
                ),
              },
            ]}
          />

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
