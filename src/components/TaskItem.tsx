import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import { Dropdown, Modal } from 'antd'
import dayjs from 'dayjs'
import type { PlanTask } from '../services/plan'

type TaskItemProps = {
  task: PlanTask
  currentUserId: string
  partnerUserId?: string
  onToggleComplete: () => void | Promise<void>
  onEdit: () => void
  onDelete: () => void
  toggleLoading?: boolean
  deleteLoading?: boolean
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
 * 单条子任务：与时间轴记录一致，右上角「⋯」菜单（完成状态、编辑、删除）。
 */
export default function TaskItem({
  task,
  currentUserId,
  partnerUserId,
  onToggleComplete,
  onEdit,
  onDelete,
  toggleLoading,
  deleteLoading,
}: TaskItemProps) {
  const done = Boolean(task.completed)
  const title = task.title?.trim() || '（无标题）'

  const toggleLabel = done ? '标记为未完成' : '标记为已完成'

  return (
    <div
      className={`relative rounded-xl border border-rose-200/90 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md ${
        done ? '!border-emerald-200/90 !bg-emerald-50/50' : ''
      }`}
    >
      <div className="absolute right-2 top-2 z-10">
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'toggle',
                label: toggleLabel,
                icon: <CheckCircleOutlined />,
                disabled: toggleLoading,
                onClick: () => void onToggleComplete(),
              },
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
                disabled: deleteLoading,
                onClick: () => {
                  Modal.confirm({
                    title: '删除该任务？',
                    content: '删除后无法恢复。',
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
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-rose-700/80 transition-colors hover:bg-rose-50 hover:text-rose-900"
            aria-label="任务操作"
          >
            <MoreOutlined />
          </button>
        </Dropdown>
      </div>

      <div className="pr-8">
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
              {done && task.completedAt ? ` · 完成于 ${dayjs(task.completedAt).format('MM-DD HH:mm')}` : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
