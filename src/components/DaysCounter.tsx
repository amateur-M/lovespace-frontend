import { Typography } from 'antd'

type DaysCounterProps = {
  /** 已在一起天数（含开始日当天为第 1 天，与后端一致） */
  days: number
  className?: string
}

/**
 * 展示「我们已经在一起第 X 天」文案。
 */
export default function DaysCounter({ days, className }: DaysCounterProps) {
  return (
    <Typography.Title level={4} className={`!m-0 text-center ${className ?? ''}`}>
      我们已经在一起第{' '}
      <Typography.Text type="danger" className="text-2xl font-semibold">
        {days}
      </Typography.Text>{' '}
      天
    </Typography.Title>
  )
}
