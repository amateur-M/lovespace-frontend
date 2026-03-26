import { CheckCircleOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import dayjs from 'dayjs'
import type { PlanTask } from '../services/plan'

type TaskItemProps = {
  task: PlanTask
  currentUserId: string
  partnerUserId?: string
  onComplete: () => void | Promise<void>
  completing?: boolean
}

function assigneeLabel(task: PlanTask, currentUserId: string, partnerUserId?: string): string {
  const raw = task.assigneeId
  if (raw == null || raw === '') return '未指定'
  const sid = String(raw)
  if (sid === currentUserId) return '我'
  if (partnerUserId && sid === partnerUserId) return 'Ta'
  return sid.length <= 8 ? `用户 ${sid}` : `用户 ${sid.slice(0, 6)}…`
}

/**
 * 单条子任务：完成按钮与截止日、负责人。
 */
export default function TaskItem({ task, currentUserId, partnerUserId, onComplete, completing }: TaskItemProps) {
  const done = Boolean(task.completed)
  const title = task.title?.trim() || '（无标题）'

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border px-3 py-2.5 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between ${
        done
          ? 'border-emerald-200/80 bg-emerald-50/50'
          : 'border-rose-200/80 bg-white hover:border-rose-300/90'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          {done ? (
            <CheckCircleOutlined className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-400" aria-hidden />
          )}
          <div className="min-w-0">
            <p
              className={`text-sm font-medium leading-snug text-rose-950 ${done ? 'text-emerald-900/90 line-through decoration-emerald-700/50' : ''}`}
            >
              {title}
            </p>
            <p className="mt-0.5 text-xs text-rose-800/65">
              {assigneeLabel(task, currentUserId, partnerUserId)}
              {task.dueDate ? ` · 截止 ${dayjs(task.dueDate).format('YYYY-MM-DD')}` : ''}
            </p>
          </div>
        </div>
      </div>
      {!done ? (
        <Button
          type="primary"
          size="small"
          loading={completing}
          className="shrink-0 cursor-pointer"
          onClick={() => void onComplete()}
          aria-label={`将任务「${title}」标为完成`}
        >
          完成
        </Button>
      ) : task.completedAt ? (
        <span className="shrink-0 text-xs text-emerald-800/70">
          {dayjs(task.completedAt).format('MM-DD HH:mm')}
        </span>
      ) : null}
    </div>
  )
}
