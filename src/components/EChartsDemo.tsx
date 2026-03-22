import { Card } from 'antd'
import * as echarts from 'echarts'
import { useEffect, useRef } from 'react'

export default function EChartsDemo() {
  const elRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!elRef.current) return

    const chart = echarts.init(elRef.current)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      yAxis: { type: 'value' },
      series: [{ type: 'line', data: [120, 200, 150, 80, 70] }],
    })

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [])

  return (
    <Card title="ECharts Demo">
      <div ref={elRef} className="h-72 w-full" />
    </Card>
  )
}
