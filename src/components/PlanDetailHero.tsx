import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  FlagOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import { Dropdown, Modal, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import type { Plan } from '../services/plan'
import { getPlanTasks } from '../services/plan'
import { displayPlanProgress } from '../utils/planProgress'
import BudgetTracker from './BudgetTracker'
import ProgressBar from './ProgressBar'

const PLAN_TYPE_LABEL: Record<string, string> = {
  goal: '目标',
  travel: '旅行',
  event: '事件',
}

type PlanDetailHeroProps = {
  plan: Plan
  onEdit: () => void
  onDelete: () => void
}

/**
 * 当前计划详情头：完整标题、描述、元数据、进度与预算（侧栏不再重复展示这些内容）。
 */
export default function PlanDetailHero({ plan, onEdit, onDelete }: PlanDetailHeroProps) {
  const progress = displayPlanProgress(plan)
  const tasks = getPlanTasks(plan)
  const taskCount = tasks.length
  const doneCount = tasks.filter((t) => t.completed).length
  const typeLabel = PLAN_TYPE_LABEL[plan.planType] ?? plan.planType
  const hasRange = plan.startDate || plan.endDate
  const rangeText = hasRange
    ? `${plan.startDate ? dayjs(plan.startDate).format('YYYY年M月D日') : '…'} — ${
        plan.endDate ? dayjs(plan.endDate).format('YYYY年M月D日') : '…'
      }`
    : null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-rose-200/50 bg-gradient-to-br from-white via-rose-50/30 to-amber-50/20 shadow-[0_1px_2px_rgba(190,24,93,0.06),0_8px_24px_-4px_rgba(190,24,93,0.08)]">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-rose-200/25 blur-3xl"
        aria-hidden
      />
      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Tag icon={<FlagOutlined />} color="magenta" className="!m-0 border-0">
                {typeLabel}
              </Tag>
              {plan.status ? (
                <Tag className="!m-0 border-rose-200/80 bg-white/80 text-rose-900">{plan.status}</Tag>
              ) : null}
            </div>
            <Typography.Title level={2} className="!mb-3 !text-rose-950 !text-2xl !font-semibold !tracking-tight sm:!text-3xl">
              {plan.title}
            </Typography.Title>
            {plan.description ? (
              <p className="max-w-3xl text-[15px] leading-relaxed text-rose-900/75">{plan.description}</p>
            ) : (
              <p className="text-sm italic text-rose-800/45">暂无描述</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:pt-1">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-rose-200/90 bg-white/90 px-4 py-2 text-sm font-medium text-rose-900 shadow-sm transition hover:border-rose-300 hover:bg-white"
            >
              <EditOutlined />
              编辑
            </button>
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  {
                    key: 'delete',
                    danger: true,
                    label: '删除计划',
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
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-rose-200/80 bg-white/80 text-rose-800 transition hover:bg-rose-50"
                aria-label="更多操作"
              >
                <MoreOutlined className="text-lg" />
              </button>
            </Dropdown>
          </div>
        </div>

        {rangeText ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-rose-800/80">
            <CalendarOutlined className="text-rose-500" aria-hidden />
            <span>{rangeText}</span>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-lg">
          <div className="rounded-xl border border-rose-100/90 bg-white/60 px-4 py-3 backdrop-blur-sm">
            <div className="text-[11px] font-medium uppercase tracking-wider text-rose-700/55">完成度</div>
            <div className="mt-1 tabular-nums text-xl font-semibold text-rose-950">{progress}%</div>
          </div>
          <div className="rounded-xl border border-rose-100/90 bg-white/60 px-4 py-3 backdrop-blur-sm">
            <div className="text-[11px] font-medium uppercase tracking-wider text-rose-700/55">任务</div>
            <div className="mt-1 tabular-nums text-xl font-semibold text-rose-950">
              {taskCount ? `${doneCount}/${taskCount}` : '—'}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar percent={progress} aria-label={`完成度 ${progress}%`} />
        </div>

        <div className="mt-6 rounded-xl border border-amber-100/80 bg-white/50 px-4 py-4 backdrop-blur-sm sm:px-5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-rose-800/50">预算与消费</div>
          <BudgetTracker
            total={plan.budgetTotal}
            spent={plan.budgetSpent}
            breakdown={plan.expenseSummary ?? null}
          />
        </div>
      </div>
    </div>
  )
}
