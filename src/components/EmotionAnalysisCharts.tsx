import * as echarts from 'echarts'
import { useEffect, useRef } from 'react'
import { moodLabel } from './MoodTag'

type Props = {
  distribution: Record<string, number>
  trend: Array<{ date: string; moodScore: number; dominantMood: string }>
  className?: string
}

const PIE_COLORS = ['#e11d48', '#f97316', '#fbbf24', '#34d399', '#a78bfa', '#fb7185']

/**
 * 情感分布环形图 + 日趋势折线图（ECharts，与主题色一致）。
 */
export default function EmotionAnalysisCharts({ distribution, trend, className }: Props) {
  const pieRef = useRef<HTMLDivElement | null>(null)
  const lineRef = useRef<HTMLDivElement | null>(null)

  // 合并为单次 effect：减少 StrictMode 下两套 effect 各自 mount/cleanup 带来的重复初始化与闪动
  useEffect(() => {
    const pieEl = pieRef.current
    const lineEl = lineRef.current
    if (!pieEl || !lineEl) return

    const pieChart = echarts.init(pieEl)
    const lineChart = echarts.init(lineEl)

    const entries = Object.entries(distribution).filter(([, v]) => v > 0)
    const sum = Object.values(distribution).reduce((a, b) => a + b, 0)
    if (sum === 0 || entries.length === 0) {
      pieChart.setOption({
        title: {
          text: '暂无占比数据',
          left: 'center',
          top: 'center',
          textStyle: { color: '#9f1239', fontSize: 14, fontWeight: 500 },
        },
      })
    } else {
      pieChart.setOption({
        color: PIE_COLORS,
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderColor: '#fecdd3',
          textStyle: { color: '#881337' },
          formatter: (p: { name: string; value: number; percent: number }) =>
            `${p.name}<br/>${p.value}%（占比 ${p.percent}%）`,
        },
        legend: {
          bottom: 0,
          textStyle: { color: '#9f1239', fontSize: 11 },
        },
        series: [
          {
            name: '心情占比',
            type: 'pie',
            radius: ['42%', '68%'],
            center: ['50%', '44%'],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
            label: { color: '#881337', formatter: '{b}\n{d}%' },
            data: entries.map(([k, v]) => ({ name: moodLabel(k), value: v })),
          },
        ],
      })
    }

    const dates = trend.map((t) => t.date)
    const scores = trend.map((t) => t.moodScore)
    if (trend.length === 0) {
      lineChart.setOption({
        title: {
          text: '暂无按日趋势',
          left: 'center',
          top: 'center',
          textStyle: { color: '#9f1239', fontSize: 14, fontWeight: 500 },
        },
      })
    } else {
      lineChart.setOption({
        color: ['#e11d48'],
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderColor: '#fecdd3',
          textStyle: { color: '#881337' },
          formatter: (params: unknown) => {
            const p = (Array.isArray(params) ? params[0] : params) as {
              axisValue?: string
              value?: number
            }
            if (!p?.axisValue) return ''
            const row = trend.find((t) => t.date === p.axisValue)
            const dom = row ? moodLabel(row.dominantMood) : ''
            return `${p.axisValue}<br/>情绪分：${p.value ?? ''}${dom ? `<br/>主导心情：${dom}` : ''}`
          },
        },
        grid: { left: 48, right: 20, top: 24, bottom: 28 },
        xAxis: {
          type: 'category',
          data: dates,
          axisLine: { lineStyle: { color: '#fecdd3' } },
          axisLabel: { color: '#9f1239', fontSize: 11, rotate: dates.length > 10 ? 35 : 0 },
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 100,
          splitLine: { lineStyle: { color: '#ffe4e6' } },
          axisLabel: { color: '#9f1239' },
        },
        series: [
          {
            name: '情绪分',
            type: 'line',
            smooth: true,
            symbolSize: 8,
            data: scores,
            lineStyle: { width: 3, color: '#e11d48' },
            itemStyle: { color: '#fb7185', borderColor: '#fff', borderWidth: 2 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(225,29,72,0.22)' },
                { offset: 1, color: 'rgba(225,29,72,0.02)' },
              ]),
            },
          },
        ],
      })
    }

    const onResize = () => {
      pieChart.resize()
      lineChart.resize()
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      pieChart.dispose()
      lineChart.dispose()
    }
  }, [distribution, trend])

  return (
    <div className={`grid gap-4 lg:grid-cols-2 ${className ?? ''}`}>
      <div
        className="ls-surface min-h-[280px] p-2 sm:p-4"
        role="img"
        aria-label="心情标签占比环形图"
      >
        <div ref={pieRef} className="h-[280px] w-full min-h-[240px]" />
      </div>
      <div
        className="ls-surface min-h-[280px] p-2 sm:p-4"
        role="img"
        aria-label="每日情绪分趋势折线图"
      >
        <div ref={lineRef} className="h-[280px] w-full min-h-[240px]" />
      </div>
    </div>
  )
}
