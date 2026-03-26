import { CalendarOutlined, FlagOutlined } from '@ant-design/icons'
import { Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import type { Plan } from '../services/plan'
import { displayPlanProgress } from '../utils/planProgress'
import BudgetTracker from './BudgetTracker'
import ProgressBar from './ProgressBar'

const PLAN_TYPE_LABEL: Record<string, string> = {
  goal: '目标',
  travel: '旅行',
  event: '事件',
}

type PlanCardProps = {
  plan: Plan
  selected?: boolean
  onClick?: () => void
  compact?: boolean
}

/**
 * 计划卡片：标题、类型、进度条、日期区间、预算摘要。
 *
 * <p>传入 {@code onClick} 时为可点击列表项；不传则渲染为静态卡片（详情区）。
 */
export default function PlanCard({ plan, selected, onClick, compact }: PlanCardProps) {
  const progress = displayPlanProgress(plan)
  const typeLabel = PLAN_TYPE_LABEL[plan.planType] ?? plan.planType
  const hasRange = plan.startDate || plan.endDate
  const rangeText = hasRange
    ? `${plan.startDate ? dayjs(plan.startDate).format('MM-DD') : '…'} — ${plan.endDate ? dayjs(plan.endDate).format('MM-DD') : '…'}`
    : null

  const surfaceClass = `ls-surface w-full text-left transition-all duration-200 motion-reduce:transition-none ${
    onClick ? 'cursor-pointer' : ''
  } ${
    onClick
      ? selected
        ? 'ring-2 ring-rose-400/90 ring-offset-2 ring-offset-rose-50'
        : 'hover:border-rose-300 hover:shadow-md'
      : ''
  } ${compact ? 'p-4' : 'p-5'}`

  const inner = (
    <>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Typography.Title level={compact ? 5 : 4} className="!mb-1 !text-rose-950">
            {plan.title}
          </Typography.Title>
          <div className="flex flex-wrap gap-1.5">
            <Tag icon={<FlagOutlined />} color="magenta" className="!m-0">
              {typeLabel}
            </Tag>
            {plan.status ? (
              <Tag className="!m-0 border-rose-200 bg-rose-50 text-rose-900">{plan.status}</Tag>
            ) : null}
          </div>
        </div>
      </div>

      {plan.description && !compact ? (
        <p className="mb-3 line-clamp-2 text-sm text-rose-900/70">{plan.description}</p>
      ) : null}

      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-rose-800/75">
        <span className="font-medium">完成度</span>
        <span className="tabular-nums font-semibold text-rose-900">{progress}%</span>
      </div>
      <ProgressBar percent={progress} aria-label={`完成度 ${progress}%`} className="mb-3" />

      {rangeText ? (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-rose-800/80">
          <CalendarOutlined className="text-rose-500" aria-hidden />
          <span>{rangeText}</span>
        </div>
      ) : null}

      <BudgetTracker total={plan.budgetTotal} spent={plan.budgetSpent} />
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={surfaceClass}
        aria-pressed={selected}
        aria-label={`计划 ${plan.title}`}
      >
        {inner}
      </button>
    )
  }

  return (
    <div className={surfaceClass} aria-label={`计划 ${plan.title}`}>
      {inner}
    </div>
  )
}
