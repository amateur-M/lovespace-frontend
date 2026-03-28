import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'
import { Dropdown, Modal, Tag } from 'antd'
import dayjs from 'dayjs'
import type { Plan } from '../services/plan'
import { displayPlanProgress } from '../utils/planProgress'

const PLAN_TYPE_LABEL: Record<string, string> = {
  goal: '目标',
  travel: '旅行',
  event: '事件',
}

type PlanListItemProps = {
  plan: Plan
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

/**
 * 侧栏计划行：仅保留识别与快速扫描信息，与详情区不重复堆叠。
 */
export default function PlanListItem({ plan, selected, onSelect, onEdit, onDelete }: PlanListItemProps) {
  const progress = displayPlanProgress(plan)
  const typeLabel = PLAN_TYPE_LABEL[plan.planType] ?? plan.planType
  const hasRange = plan.startDate || plan.endDate
  const rangeShort = hasRange
    ? `${plan.startDate ? dayjs(plan.startDate).format('M/D') : '…'}–${plan.endDate ? dayjs(plan.endDate).format('M/D') : '…'}`
    : null

  return (
    <div
      className={`group relative flex w-full items-stretch gap-0 rounded-xl border transition-all duration-200 motion-reduce:transition-none ${
        selected
          ? 'border-rose-300/90 bg-white shadow-md ring-1 ring-rose-200/80'
          : 'border-transparent bg-white/40 hover:border-rose-200/70 hover:bg-white/90'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`min-w-0 flex-1 rounded-l-xl px-3 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 ${
          selected ? 'pl-3' : ''
        }`}
        aria-current={selected ? 'true' : undefined}
      >
        {selected ? (
          <span
            className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-rose-400 to-rose-600"
            aria-hidden
          />
        ) : null}
        <div className="flex items-start justify-between gap-2 pl-0.5">
          <span className="min-w-0 flex-1 truncate font-medium leading-snug text-rose-950">{plan.title}</span>
          <span className="shrink-0 tabular-nums text-xs font-semibold text-rose-700/90">{progress}%</span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-0.5">
          <Tag className="!m-0 border-rose-200/80 bg-rose-50/90 px-1.5 py-0 text-[11px] leading-tight text-rose-900">
            {typeLabel}
          </Tag>
          {rangeShort ? (
            <span className="text-[11px] tabular-nums text-rose-700/65">{rangeShort}</span>
          ) : (
            <span className="text-[11px] text-rose-600/50">未设日期</span>
          )}
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-rose-100/90 pl-0.5 pr-8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-400 to-amber-400/90 transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </button>

      <div
        className="flex shrink-0 items-start pt-2 pr-1"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'edit',
                label: '编辑',
                icon: <EditOutlined />,
                onClick: () => onEdit(),
              },
              {
                key: 'delete',
                danger: true,
                label: '删除',
                icon: <DeleteOutlined />,
                onClick: () => {
                  Modal.confirm({
                    title: '删除该计划？',
                    content: '其下任务与消费记录将一并删除，且无法恢复。',
                    okText: '删除',
                    okType: 'danger',
                    cancelText: '取消',
                    onOk: () => onDelete(),
                  })
                },
              },
            ],
          }}
        >
          <button
            type="button"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-rose-600/70 opacity-80 transition-all hover:bg-rose-50 hover:text-rose-900 group-hover:opacity-100 focus:outline-none"
            aria-label="计划操作"
          >
            <MoreOutlined />
          </button>
        </Dropdown>
      </div>
    </div>
  )
}
