import {
  BulbOutlined,
  HeartOutlined,
  LineChartOutlined,
  ReloadOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Empty,
  Progress,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import EmotionAnalysisCharts from '../components/EmotionAnalysisCharts'
import { moodLabel } from '../components/MoodTag'
import { getEmotionReport, type EmotionAnalysisReport, type OverallMood } from '../services/emotion'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'

const { Title, Paragraph, Text } = Typography

const OVERALL_META: Record<
  OverallMood,
  { label: string; tag: 'success' | 'default' | 'warning'; stroke: string }
> = {
  positive: { label: '积极向好', tag: 'success', stroke: '#059669' },
  neutral: { label: '整体平稳', tag: 'default', stroke: '#78716c' },
  negative: { label: '需要关怀', tag: 'warning', stroke: '#e11d48' },
}

export default function EmotionAnalysisPage() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const fetchCoupleInfo = useCoupleStore((s) => s.fetchCoupleInfo)
  const coupleLoading = useCoupleStore((s) => s.loading)
  const coupleInfo = useCoupleStore((s) => s.info)
  const coupleId = coupleInfo?.bindingId ?? null

  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().subtract(29, 'day').startOf('day'),
    dayjs().endOf('day'),
  ])
  const [report, setReport] = useState<EmotionAnalysisReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthed) return
    fetchCoupleInfo().catch(() => undefined)
  }, [isAuthed, fetchCoupleInfo])

  const loadReport = useCallback(async () => {
    if (!coupleId) return
    setLoading(true)
    try {
      const start = range[0].format('YYYY-MM-DD')
      const end = range[1].format('YYYY-MM-DD')
      const resp = await getEmotionReport(coupleId, start, end)
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '获取分析报告失败')
      }
      setReport(resp.data)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [coupleId, range])

  useEffect(() => {
    if (!coupleId) return
    void loadReport()
  }, [coupleId, loadReport])

  const overall = useMemo(() => {
    if (!report) return null
    return OVERALL_META[report.overallMood] ?? OVERALL_META.neutral
  }, [report])

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero：玻璃质感 + 渐变光晕（ui-ux-pro-max：顶栏留白由 AppLayout 负责） */}
      <section
        className="relative overflow-hidden rounded-3xl border border-rose-200/85 bg-gradient-to-br from-white via-rose-50/90 to-amber-50/35 px-5 py-8 shadow-sm sm:px-8 sm:py-10"
        aria-labelledby="emotion-hero-title"
      >
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-rose-300/40 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-orange-200/35 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/90 bg-white/80 px-3 py-1 text-xs font-medium text-rose-900/80 shadow-sm backdrop-blur-sm">
              <LineChartOutlined className="text-rose-600" aria-hidden />
              AI 情感洞察
            </div>
            <Title
              level={2}
              id="emotion-hero-title"
              className="!mb-0 !text-2xl !font-semibold !tracking-tight !text-stone-900 sm:!text-3xl"
            >
              读懂时间轴里的情绪
            </Title>
            <Paragraph className="!mb-0 ls-page-intro !text-[15px]">
              基于恋爱记录的心情标签与正文摘要，结合通义千问生成整体倾向、分数与相处建议。数据仅包含你在当前情侣下可见的记录。
            </Paragraph>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <DatePicker.RangePicker
              value={range}
              onChange={(v) => {
                if (v?.[0] && v[1]) setRange([v[0], v[1]])
              }}
              allowClear={false}
              disabledDate={(current) => !!current && current > dayjs().endOf('day')}
              className="!rounded-xl border-rose-200/90"
              presets={[
                { label: '最近7天', value: [dayjs().subtract(6, 'day'), dayjs()] },
                { label: '最近30天', value: [dayjs().subtract(29, 'day'), dayjs()] },
                { label: '最近90天', value: [dayjs().subtract(89, 'day'), dayjs()] },
              ]}
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => void loadReport()}
              className="!h-10 !rounded-xl !border-rose-300/90 !bg-rose-600 !px-5 shadow-sm transition-all duration-200 hover:!bg-rose-700"
            >
              刷新分析
            </Button>
          </div>
        </div>
      </section>

      {coupleLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Spin size="large" tip="加载情侣信息…" />
        </div>
      ) : !coupleId ? (
        <Card className="ls-surface !border-dashed !border-rose-300/80 !bg-white/90">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="请先完成情侣绑定后再查看情感分析"
          >
            <Link
              to="/couple"
              className="ls-link inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 font-medium"
            >
              <HeartOutlined aria-hidden />
              前往情侣首页
            </Link>
          </Empty>
        </Card>
      ) : (
        <>
          {loading && !report ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200/80 bg-white/90 py-16 shadow-sm">
              <Spin size="large" />
              <Text className="text-rose-900/75">正在生成分析报告（大模型可能需要数十秒）…</Text>
            </div>
          ) : report ? (
            <div
              className={`space-y-6 transition-opacity duration-200 ${loading ? 'pointer-events-none opacity-60' : ''}`}
            >
              {loading ? (
                <Alert
                  type="info"
                  showIcon
                  className="!rounded-xl"
                  message="正在更新分析结果…"
                />
              ) : null}
              <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
                {/* 综合分 + 倾向 */}
                <Card
                  className="ls-surface !border-rose-200/90 lg:col-span-5"
                  styles={{ body: { padding: '1.25rem 1.5rem' } }}
                >
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Text type="secondary" className="text-xs uppercase tracking-wide">
                        综合情绪分
                      </Text>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Tag
                          icon={<RiseOutlined />}
                          color={
                            report.overallMood === 'positive'
                              ? 'success'
                              : report.overallMood === 'negative'
                                ? 'warning'
                                : 'default'
                          }
                          className="!m-0 !rounded-lg !border-0 !px-2.5 !py-0.5 !text-xs"
                        >
                          {overall?.label ?? '—'}
                        </Tag>
                        <Text className="text-xs text-stone-500">
                          {range[0].format('MM.DD')} — {range[1].format('MM.DD')}
                        </Text>
                      </div>
                    </div>
                    <Progress
                      type="dashboard"
                      percent={Math.min(100, Math.max(0, report.moodScore))}
                      strokeColor={overall?.stroke ?? '#e11d48'}
                      trailColor="#ffe4e6"
                      format={(p) => (
                        <span className="text-lg font-semibold tabular-nums text-stone-900">
                          {Math.round(p ?? 0)}
                        </span>
                      )}
                      size={140}
                    />
                  </div>
                  <Alert
                    type="info"
                    showIcon
                    className="mt-4 !rounded-xl !border-rose-200/80 !bg-rose-50/80 !text-rose-950"
                    message="说明"
                    description="分数由记录心情标签加权统计，并结合大模型对整体氛围的解读；仅供参考，不构成心理诊断。"
                  />
                </Card>

                {/* AI 建议 */}
                <Card
                  className="ls-surface relative overflow-hidden !border-rose-200/90 lg:col-span-7"
                  title={
                    <span className="inline-flex items-center gap-2 font-medium text-stone-900">
                      <BulbOutlined className="text-amber-500" aria-hidden />
                      AI 建议
                    </span>
                  }
                  styles={{ body: { padding: '1rem 1.25rem 1.25rem' } }}
                >
                  <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-amber-100/50 blur-2xl" />
                  <Paragraph className="!mb-0 whitespace-pre-wrap text-[15px] leading-relaxed text-stone-800">
                    {report.insights}
                  </Paragraph>
                </Card>
              </div>

              <div>
                <Title level={4} className="!mb-3 !text-base !font-semibold !text-stone-900">
                  分布与趋势
                </Title>
                <EmotionAnalysisCharts distribution={report.emotionDistribution} trend={report.trendData} />
              </div>

              {/* 心情占比列表（无障碍：不仅依赖颜色） */}
              <Card size="small" className="ls-surface !border-rose-200/80" title="心情标签占比（数值）">
                <div className="flex flex-wrap gap-3">
                  {Object.entries(report.emotionDistribution).map(([key, pct]) => (
                    <div
                      key={key}
                      className="flex min-w-[140px] flex-1 cursor-default items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2 transition-colors duration-200 hover:border-rose-200 hover:bg-white"
                    >
                      <span className="text-sm font-medium text-stone-800">{moodLabel(key)}</span>
                      <span className="tabular-nums text-sm font-semibold text-rose-800">{pct}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Alert type="warning" message="暂无数据" description="请点击「刷新分析」重试。" showIcon />
          )}
        </>
      )}
    </div>
  )
}
