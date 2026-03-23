import { Card } from 'antd'
import * as echarts from 'echarts'
import { useEffect, useRef } from 'react'

export default function EChartsDemo() {
  const elRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!elRef.current) return

    const chart = echarts.init(elRef.current)
    chart.setOption({
      color: ['#e11d48'],
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderColor: '#fecdd3',
        textStyle: { color: '#9f1239' },
      },
      grid: { left: 48, right: 16, top: 20, bottom: 28 },
      xAxis: {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        axisLine: { lineStyle: { color: '#fecdd3' } },
        axisLabel: { color: '#be123c' },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#ffe4e6' } },
        axisLabel: { color: '#be123c' },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          data: [120, 200, 150, 80, 70],
          lineStyle: { width: 2, color: '#e11d48' },
          itemStyle: { color: '#f97316' },
          areaStyle: { color: 'rgba(225,29,72,0.08)' },
        },
      ],
    })

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [])

  return (
    <Card className="ls-surface !shadow-sm" title={<span className="font-medium text-orange-950">ECharts Demo</span>}>
      <div ref={elRef} className="h-72 w-full min-h-[18rem]" />
    </Card>
  )
}
