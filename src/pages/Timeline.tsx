import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  Button,
  DatePicker,
  Divider,
  Empty,
  FloatButton,
  Modal,
  Pagination,
  Space,
  Spin,
  Typography,
  message,
} from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import TimelineForm from '../components/TimelineForm'
import TimelineItem from '../components/TimelineItem'
import type { LoveRecord, TimelineListRange } from '../services/timeline'
import { deleteTimelineRecord, listTimelineRecords } from '../services/timeline'
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
  const me = useAuthStore((s) => s.user)
  const fetchCoupleInfo = useCoupleStore((s) => s.fetchCoupleInfo)
  const coupleLoading = useCoupleStore((s) => s.loading)
  const coupleInfo = useCoupleStore((s) => s.info)

  const [records, setRecords] = useState<LoveRecord[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<LoveRecord | null>(null)

  /** 记录日期区间；两端都选中方才筛选，清空为查看全部 */
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

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
    async (nextPage: number) => {
      if (!coupleId) return
      setLoading(true)
      try {
        const resp = await listTimelineRecords(coupleId, nextPage, PAGE_SIZE, listRange)
        if (resp.code !== 0 || !resp.data) {
          throw new Error(resp.message || '加载失败')
        }
        const { records: list, total: t, page: p } = resp.data
        setTotal(t)
        setPage(Number(p))
        setRecords(list)
      } catch (e) {
        message.error(e instanceof Error ? e.message : '加载失败')
      } finally {
        setLoading(false)
      }
    },
    [coupleId, listRange],
  )

  const refresh = useCallback(async () => {
    await loadPage(page)
  }, [loadPage, page])

  useEffect(() => {
    if (!coupleId) {
      setRecords([])
      setTotal(0)
      setPage(1)
      return
    }
    loadPage(1).catch(() => undefined)
  }, [coupleId, listRange?.startDate, listRange?.endDate, loadPage])

  const handlePageChange = (p: number) => {
    loadPage(p).catch(() => undefined)
  }

  const handleDelete = async (r: LoveRecord) => {
    if (!coupleId) return
    try {
      const resp = await deleteTimelineRecord(r.id)
      if (resp.code !== 0) {
        throw new Error(resp.message || '删除失败')
      }
      message.success('已删除')
      let targetPage = page
      let data = await listTimelineRecords(coupleId, targetPage, PAGE_SIZE, listRange)
      if (data.code !== 0 || !data.data) {
        throw new Error(data.message || '刷新失败')
      }
      let { records: list, total: t } = data.data
      if (list.length === 0 && targetPage > 1) {
        targetPage -= 1
        data = await listTimelineRecords(coupleId, targetPage, PAGE_SIZE, listRange)
        if (data.code === 0 && data.data) {
          list = data.data.records
          t = data.data.total
        }
      }
      setPage(targetPage)
      setTotal(t)
      setRecords(list)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '删除失败')
    }
  }

  const openCreate = () => {
    setEditingRecord(null)
    setFormOpen(true)
  }

  const openEdit = (r: LoveRecord) => {
    setEditingRecord(r)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingRecord(null)
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  const grouped = groupRecordsByMonth(records)

  return (
    <div className="relative pb-24">
      {coupleLoading && !coupleInfo ? (
        <div className="flex justify-center py-16">
          <Spin />
        </div>
      ) : null}

      {coupleId ? (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
          <Typography.Text className="shrink-0 text-sm font-medium text-rose-900/85">记录日期</Typography.Text>
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
          <Button icon={<ReloadOutlined />} onClick={() => refresh().catch(() => undefined)} loading={loading}>
            刷新
          </Button>
        </div>
      ) : null}

      {!coupleId && !coupleLoading ? (
        <div className="ls-surface py-12">
          <Empty description="请先完成情侣绑定">
            <Link to="/couple">
              <Button type="primary">去情侣首页绑定</Button>
            </Link>
          </Empty>
        </div>
      ) : null}

      {coupleId ? (
        <>
          <div className="min-h-[320px] rounded-xl border border-rose-200/90 bg-rose-50/50 p-3 sm:p-4">
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
                        <TimelineItem
                          key={r.id}
                          record={r}
                          currentUserId={me?.id}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </Space>
                  </div>
                ))}
              </Space>
            )}
          </div>

          {total > 0 ? (
            <div className="mt-4 flex justify-center">
              <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={total}
                onChange={handlePageChange}
                showSizeChanger={false}
                showTotal={(t) => `共 ${t} 条`}
              />
            </div>
          ) : null}

          <FloatButton icon={<PlusOutlined />} type="primary" tooltip="记录今天" onClick={openCreate} />
          <Modal
            title={editingRecord ? '编辑记录' : '记录今天'}
            open={formOpen}
            onCancel={closeForm}
            footer={null}
            destroyOnClose
            width={560}
          >
            <TimelineForm
              coupleId={coupleId}
              open={formOpen}
              editingRecord={editingRecord}
              onClose={closeForm}
              onSuccess={() => loadPage(page).catch(() => undefined)}
            />
          </Modal>
        </>
      ) : null}
    </div>
  )
}
