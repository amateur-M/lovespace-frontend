import { CalendarOutlined, DeleteOutlined, EditOutlined, FlagOutlined, MoreOutlined } from '@ant-design/icons'
import { Dropdown, Modal, Tag, Typography } from 'antd'
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
  /** 点击卡片主体（列表选中） */
  onClick?: () => void
  compact?: boolean
  /** 与时间轴记录一致：右上角菜单 */
  onEdit?: () => void
  onDelete?: () => void
}

/**
 * 计划卡片：标题、类型、进度条、日期区间、预算摘要。
 *
 * <p>传入 {@code onClick} 时主体可点击用于列表选中；{@code onEdit}/{@code onDelete} 时在右上角显示「⋯」菜单。
 */
export default function PlanCard({ plan, selected, onClick, compact, onEdit, onDelete }: PlanCardProps) {
  const progress = displayPlanProgress(plan)
  const typeLabel = PLAN_TYPE_LABEL[plan.planType] ?? plan.planType
  const hasRange = plan.startDate || plan.endDate
  const rangeText = hasRange
    ? `${plan.startDate ? dayjs(plan.startDate).format('MM-DD') : '…'} — ${plan.endDate ? dayjs(plan.endDate).format('MM-DD') : '…'}`
    : null

  const showMenu = Boolean(onEdit && onDelete)

  const surfaceClass = `relative w-full text-left transition-all duration-200 motion-reduce:transition-none ls-surface ${
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
      <div className={`mb-3 flex flex-wrap items-start justify-between gap-2 ${showMenu ? 'pr-8' : ''}`}>
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

  const menu = showMenu ? (
    <div className="absolute right-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
      <Dropdown
        trigger={['click']}
        menu={{
          items: [
            {
              key: 'edit',
              label: '编辑',
              icon: <EditOutlined />,
              onClick: () => onEdit?.(),
            },
            {
              key: 'delete',
              danger: true,
              label: '删除',
              icon: <DeleteOutlined />,
              onClick: () => {
                Modal.confirm({
                  title: '删除该计划？',
                  content: '其下全部任务将一并删除，且无法恢复。',
                  okText: '删除',
                  okType: 'danger',
                  cancelText: '取消',
                  onOk: () => onDelete?.(),
                })
              },
            },
          ],
        }}
      >
        <button
          type="button"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-rose-700/80 transition-colors hover:bg-rose-50 hover:text-rose-900"
          aria-label="计划操作"
        >
          <MoreOutlined />
        </button>
      </Dropdown>
    </div>
  ) : null

  if (onClick) {
    return (
      <div className={surfaceClass} aria-label={`计划 ${plan.title}`}>
        {menu}
        <div
          role="button"
          tabIndex={0}
          className="outline-none"
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClick()
            }
          }}
          aria-pressed={selected}
        >
          {inner}
        </div>
      </div>
    )
  }

  return (
    <div className={surfaceClass} aria-label={`计划 ${plan.title}`}>
      {menu}
      {inner}
    </div>
  )
}
