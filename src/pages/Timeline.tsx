import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Empty,
  FloatButton,
  Modal,
  Space,
  Spin,
  Typography,
  message,
} from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import TimelineForm from '../components/TimelineForm'
import TimelineItem from '../components/TimelineItem'
import type { LoveRecord, TimelineListRange } from '../services/timeline'
import { listTimelineRecords } from '../services/timeline'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'

const PAGE_SIZE = 10

function formatMonthTitle(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m) return ym
  return `${y}年${m}月`
}

function groupRecordsByMonth(records: LoveRecord[]): { month: string; items: LoveRecord[] }[] {
  const map = new Map<string, LoveRecord[]>()
  for (const r of records) {
    const key = r.recordDate.slice(0, 7)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, items]) => ({
      month,
      items: items.sort((a, b) => {
        const d = b.recordDate.localeCompare(a.recordDate)
        if (d !== 0) return d
        return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
      }),
    }))
}

export default function Timeline() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const fetchCoupleInfo = useCoupleStore((s) => s.fetchCoupleInfo)
  const coupleLoading = useCoupleStore((s) => s.loading)
  const coupleInfo = useCoupleStore((s) => s.info)

  const [records, setRecords] = useState<LoveRecord[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [pullPx, setPullPx] = useState(0)
  /** 记录日期区间；两端都选中方才筛选，清空为查看全部 */
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const pullStartY = useRef(0)
  const pullActive = useRef(false)

  const coupleId = coupleInfo?.bindingId ?? null

  const listRange: TimelineListRange | undefined = useMemo(() => {
    if (!dateRange?.[0] || !dateRange[1]) return undefined
    return {
      startDate: dateRange[0].format('YYYY-MM-DD'),
      endDate: dateRange[1].format('YYYY-MM-DD'),
    }
  }, [dateRange])

  useEffect(() => {
    if (!isAuthed) return
    fetchCoupleInfo().catch(() => undefined)
  }, [isAuthed, fetchCoupleInfo])

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!coupleId) return
      const setBusy = append ? setLoadingMore : setLoading
      setBusy(true)
      try {
        const resp = await listTimelineRecords(coupleId, nextPage, PAGE_SIZE, listRange)
        if (resp.code !== 0 || !resp.data) {
          throw new Error(resp.message || '加载失败')
        }
        const { records: list, total: t, page: p } = resp.data
        setTotal(t)
        setPage(Number(p))
        setRecords((prev) => (append ? [...prev, ...list] : list))
      } catch (e) {
        message.error(e instanceof Error ? e.message : '加载失败')
      } finally {
        setBusy(false)
      }
    },
    [coupleId, listRange],
  )

  const refresh = useCallback(async () => {
    await loadPage(1, false)
  }, [loadPage])

  useEffect(() => {
    if (!coupleId) {
      setRecords([])
      setTotal(0)
      setPage(1)
      return
    }
    loadPage(1, false).catch(() => undefined)
  }, [coupleId, listRange?.startDate, listRange?.endDate, loadPage])

  const hasMore = records.length < total

  const loadMore = () => {
    if (!hasMore || loadingMore || loading) return
    loadPage(page + 1, true).catch(() => undefined)
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  const grouped = groupRecordsByMonth(records)

  return (
    <div className="relative pb-20">
      <Card className="ls-surface !shadow-sm" loading={coupleLoading && !coupleInfo}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Typography.Title level={3} className="!mt-0 !font-semibold !tracking-tight !text-orange-950">
            恋爱时间轴
          </Typography.Title>
          {coupleId ? (
            <Button icon={<ReloadOutlined />} onClick={() => refresh().catch(() => undefined)} loading={loading}>
              刷新
            </Button>
          ) : null}
        </div>
        <Typography.Paragraph className="ls-page-intro !mb-3 !mt-2">
          按月份浏览记录；可选记录日期区间筛选；移动端在列表顶部下拉可刷新；底部加载更多。
        </Typography.Paragraph>
        {coupleId ? (
          <Space wrap className="w-full items-center" size="middle">
            <Typography.Text className="shrink-0 text-rose-900/75">
              记录日期
            </Typography.Text>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(v) => setDateRange(v)}
              allowEmpty={[true, true]}
              allowClear
              presets={[
                { label: '最近7天', value: [dayjs().subtract(6, 'day'), dayjs()] },
                { label: '最近30天', value: [dayjs().subtract(29, 'day'), dayjs()] },
                { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
              ]}
              className="min-w-[240px] flex-1 sm:max-w-md"
            />
            <Button
              type="link"
              className="!px-0"
              onClick={() => {
                setDateRange(null)
                message.info('已切换为全部时间')
              }}
            >
              全部时间
            </Button>
          </Space>
        ) : null}
      </Card>

      {!coupleId && !coupleLoading ? (
        <Card className="ls-surface mt-4 !shadow-sm">
          <Empty description="请先完成情侣绑定">
            <Link to="/couple">
              <Button type="primary">去情侣首页绑定</Button>
            </Link>
          </Empty>
        </Card>
      ) : null}

      {coupleId ? (
        <>
          <div className="relative mt-4">
            {pullPx > 8 ? (
              <div
                className="pointer-events-none absolute left-0 right-0 z-10 flex justify-center text-sm text-rose-800/65"
                style={{ top: -28 }}
              >
                {pullPx > 52 ? '松开刷新' : '下拉刷新'}
              </div>
            ) : null}
            <div
              ref={scrollRef}
              className="max-h-[calc(100vh-220px)] overflow-y-auto rounded-xl border border-rose-200/90 bg-rose-50/60 p-3"
              style={{ touchAction: 'pan-y' }}
              onTouchStart={(e) => {
                const el = scrollRef.current
                if (!el || el.scrollTop > 0) return
                pullStartY.current = e.touches[0].clientY
                pullActive.current = true
              }}
              onTouchMove={(e) => {
                const el = scrollRef.current
                if (!pullActive.current || !el || el.scrollTop > 0) {
                  if (pullPx !== 0) setPullPx(0)
                  return
                }
                const dy = e.touches[0].clientY - pullStartY.current
                if (dy > 0) {
                  setPullPx(Math.min(dy, 88))
                }
              }}
              onTouchEnd={async () => {
                if (pullPx > 52) {
                  setPullPx(0)
                  await refresh()
                } else {
                  setPullPx(0)
                }
                pullActive.current = false
              }}
            >
              <div style={{ transform: `translateY(${Math.min(pullPx, 56)}px)` }}>
                <div className="mb-2 flex justify-center">
                  {loading && records.length === 0 ? <Spin /> : null}
                </div>
                {grouped.length === 0 && !loading ? (
                  <Empty description="还没有记录，点击右下角记录今天吧" />
                ) : (
                  <Space direction="vertical" size={16} className="w-full">
                    {grouped.map(({ month, items }) => (
                      <div key={month}>
                        <Divider orientation="left" className="!mt-0 !border-rose-200 !text-rose-800/65">
                          {formatMonthTitle(month)}
                        </Divider>
                        <Space direction="vertical" size={12} className="w-full">
                          {items.map((r) => (
                            <TimelineItem key={r.id} record={r} />
                          ))}
                        </Space>
                      </div>
                    ))}
                  </Space>
                )}
                {hasMore ? (
                  <div className="mt-4 text-center">
                    <Button type="link" loading={loadingMore} onClick={loadMore} disabled={loading}>
                      {loadingMore ? '加载中…' : '加载更多'}
                    </Button>
                  </div>
                ) : records.length > 0 ? (
                  <Typography.Text className="mt-4 block text-center text-sm text-rose-800/65">
                    已加载全部 {total} 条
                  </Typography.Text>
                ) : null}
              </div>
            </div>
          </div>

          <FloatButton
            icon={<PlusOutlined />}
            type="primary"
            tooltip="记录今天"
            onClick={() => setFormOpen(true)}
          />
          <Modal
            title="记录今天"
            open={formOpen}
            onCancel={() => setFormOpen(false)}
            footer={null}
            destroyOnClose
            width={560}
          >
            <TimelineForm
              coupleId={coupleId}
              open={formOpen}
              onClose={() => setFormOpen(false)}
              onSuccess={() => refresh().catch(() => undefined)}
            />
          </Modal>
        </>
      ) : null}
    </div>
  )
}
