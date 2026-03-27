import { PlusOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Button, Empty, Form, Spin, Typography, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import PlanCard from '../components/PlanCard'
import PlanExpensePanel from '../components/PlanExpensePanel'
import PlanForm, { type PlanFormValues } from '../components/PlanForm'
import TaskFormModal, { applyTaskToForm, type TaskFormValues } from '../components/TaskFormModal'
import TaskItem from '../components/TaskItem'
import {
  createPlan,
  createPlanTask,
  deletePlan,
  deletePlanTask,
  getPlanTasks,
  listPlans,
  updatePlan,
  updatePlanTask,
  type CreatePlanBody,
  type Plan,
  type PlanTask,
  type PlanTaskReplaceBody,
  type UpdatePlanBody,
} from '../services/plan'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'
import { computeTaskProgressPercent } from '../utils/planProgress'

export default function PlanPage() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const currentUserId = useAuthStore((s) => s.user?.id ?? '')
  const fetchCoupleInfo = useCoupleStore((s) => s.fetchCoupleInfo)
  const coupleLoading = useCoupleStore((s) => s.loading)
  const coupleInfo = useCoupleStore((s) => s.info)

  const coupleId = coupleInfo?.bindingId ?? null
  const partnerId = coupleInfo?.partner?.id

  const [plans, setPlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [planModalMode, setPlanModalMode] = useState<'create' | 'edit'>('create')
  const [editingPlanForModal, setEditingPlanForModal] = useState<Plan | null>(null)
  const [planSaving, setPlanSaving] = useState(false)

  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit'>('create')
  const [editingTask, setEditingTask] = useState<PlanTask | null>(null)
  const [taskModalSubmitting, setTaskModalSubmitting] = useState(false)

  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)

  const [planForm] = Form.useForm<PlanFormValues>()
  const [taskModalForm] = Form.useForm<TaskFormValues>()

  useEffect(() => {
    if (!isAuthed) return
    fetchCoupleInfo().catch(() => undefined)
  }, [isAuthed, fetchCoupleInfo])

  const refreshPlans = useCallback(async (): Promise<Plan[]> => {
    if (!coupleId) return []
    setPlansLoading(true)
    try {
      const resp = await listPlans(coupleId)
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '加载计划失败')
      }
      setPlans(resp.data)
      return resp.data
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载计划失败')
      return []
    } finally {
      setPlansLoading(false)
    }
  }, [coupleId])

  useEffect(() => {
    if (!coupleId) {
      setPlans([])
      setSelectedId(null)
      return
    }
    void refreshPlans()
  }, [coupleId, refreshPlans])

  useEffect(() => {
    if (!plans.length) {
      setSelectedId(null)
      return
    }
    setSelectedId((prev) => (prev && plans.some((p) => p.id === prev) ? prev : plans[0].id))
  }, [plans])

  const selectedPlan = useMemo(
    () => (selectedId ? plans.find((p) => p.id === selectedId) ?? null : null),
    [plans, selectedId],
  )

  const selectedTasks = useMemo(
    () => (selectedPlan ? getPlanTasks(selectedPlan) : []),
    [selectedPlan],
  )

  const refreshAndSyncProgress = useCallback(
    async (planId: string) => {
      if (!coupleId) return
      const list = await refreshPlans()
      const plan = list.find((p) => p.id === planId)
      if (!plan) return
      const pct = computeTaskProgressPercent(getPlanTasks(plan))
      if (pct === null || pct === plan.progress) return
      const resp = await updatePlan(planId, { progress: pct })
      if (resp.code !== 0) {
        message.warning(resp.message || '同步进度失败')
        return
      }
      await refreshPlans()
    },
    [coupleId, refreshPlans],
  )

  const openCreatePlanModal = () => {
    setPlanModalMode('create')
    setEditingPlanForModal(null)
    setPlanModalOpen(true)
  }

  const openEditPlanModal = (plan: Plan) => {
    setPlanModalMode('edit')
    setEditingPlanForModal(plan)
    setPlanModalOpen(true)
  }

  const handleCreatePlan = async (body: CreatePlanBody) => {
    setPlanSaving(true)
    try {
      const resp = await createPlan(body)
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '创建失败')
      }
      message.success('已创建计划')
      setPlanModalOpen(false)
      planForm.resetFields()
      await refreshPlans()
      setSelectedId(resp.data.id)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '创建失败')
    } finally {
      setPlanSaving(false)
    }
  }

  const handleUpdatePlan = async (planId: string, body: UpdatePlanBody) => {
    setPlanSaving(true)
    try {
      const resp = await updatePlan(planId, body)
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '保存失败')
      }
      message.success('计划已更新')
      setPlanModalOpen(false)
      setEditingPlanForModal(null)
      await refreshPlans()
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败')
    } finally {
      setPlanSaving(false)
    }
  }

  const handleDeletePlan = async (plan: Plan) => {
    setPlanSaving(true)
    try {
      const resp = await deletePlan(plan.id)
      if (resp.code !== 0) {
        throw new Error(resp.message || '删除失败')
      }
      message.success('已删除计划')
      await refreshPlans()
    } catch (e) {
      message.error(e instanceof Error ? e.message : '删除失败')
    } finally {
      setPlanSaving(false)
    }
  }

  const toReplaceBody = (v: TaskFormValues): PlanTaskReplaceBody => ({
    title: v.title.trim(),
    assigneeId: v.assigneeId ?? null,
    dueDate: v.dueDate ? v.dueDate.format('YYYY-MM-DD') : null,
    completed: Boolean(v.completed),
  })

  const openAddTaskModal = () => {
    if (!selectedPlan) return
    setTaskModalMode('create')
    setEditingTask(null)
    taskModalForm.resetFields()
    taskModalForm.setFieldsValue({ title: '', assigneeId: undefined, dueDate: null, completed: false })
    setTaskModalOpen(true)
  }

  const openEditTaskModal = (task: PlanTask) => {
    setTaskModalMode('edit')
    setEditingTask(task)
    applyTaskToForm(taskModalForm, task)
    setTaskModalOpen(true)
  }

  const handleTaskModalSubmit = async (values: TaskFormValues) => {
    if (!selectedPlan) return
    setTaskModalSubmitting(true)
    try {
      if (taskModalMode === 'create') {
        const resp = await createPlanTask(selectedPlan.id, {
          title: values.title.trim(),
          assigneeId: values.assigneeId ?? null,
          dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null,
        })
        if (resp.code !== 0 || !resp.data) {
          throw new Error(resp.message || '添加失败')
        }
        message.success('已添加任务')
      } else if (editingTask) {
        const body = toReplaceBody(values)
        const resp = await updatePlanTask(selectedPlan.id, editingTask.id, body)
        if (resp.code !== 0 || !resp.data) {
          throw new Error(resp.message || '保存失败')
        }
        message.success('任务已更新')
      }
      setTaskModalOpen(false)
      setEditingTask(null)
      taskModalForm.resetFields()
      await refreshAndSyncProgress(selectedPlan.id)
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error(e instanceof Error ? e.message : '操作失败')
    } finally {
      setTaskModalSubmitting(false)
    }
  }

  const handleToggleTaskComplete = async (task: PlanTask) => {
    if (!selectedPlan) return
    setTogglingTaskId(task.id)
    try {
      const body: PlanTaskReplaceBody = {
        title: task.title,
        assigneeId: task.assigneeId ?? null,
        dueDate: task.dueDate ?? null,
        completed: !task.completed,
      }
      const resp = await updatePlanTask(selectedPlan.id, task.id, body)
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '操作失败')
      }
      message.success(body.completed ? '已标记完成' : '已标记未完成')
      await refreshAndSyncProgress(selectedPlan.id)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '操作失败')
    } finally {
      setTogglingTaskId(null)
    }
  }

  const handleDeleteTask = async (task: PlanTask) => {
    if (!selectedPlan) return
    setDeletingTaskId(task.id)
    try {
      const resp = await deletePlanTask(selectedPlan.id, task.id)
      if (resp.code !== 0) {
        throw new Error(resp.message || '删除失败')
      }
      message.success('已删除任务')
      await refreshAndSyncProgress(selectedPlan.id)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '删除失败')
    } finally {
      setDeletingTaskId(null)
    }
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="ls-page-intro min-h-[60vh] space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Typography.Title level={2} className="!mb-2 !text-rose-950">
            共同计划
          </Typography.Title>
          <p className="text-sm text-rose-900/75">
            与 Ta 一起列目标、旅行与日程；进度由任务完成情况自动汇总，也可在创建时填写初始进度。
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          disabled={!coupleId}
          className="cursor-pointer self-start shadow-sm"
          onClick={openCreatePlanModal}
        >
          新建计划
        </Button>
      </div>

      {coupleLoading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : !coupleId ? (
        <Empty
          description="请先绑定情侣后再使用共同计划"
          className="rounded-xl border border-dashed border-rose-200/90 bg-white/80 py-16"
        >
          <Link to="/couple" className="ls-link">
            去情侣首页
          </Link>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="lg:col-span-5">
            <div className="mb-3 flex items-center gap-2 text-rose-900/85">
              <UnorderedListOutlined className="text-rose-500" aria-hidden />
              <span className="text-sm font-semibold">计划列表</span>
            </div>
            {plansLoading && !plans.length ? (
              <div className="flex justify-center py-12">
                <Spin />
              </div>
            ) : !plans.length ? (
              <Empty
                description="还没有计划，点击「新建计划」开始"
                className="rounded-xl border border-rose-200/80 bg-white/90 py-12"
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {plans.map((p) => (
                  <li key={p.id}>
                    <PlanCard
                      plan={p}
                      compact
                      selected={p.id === selectedId}
                      onClick={() => setSelectedId(p.id)}
                      onEdit={() => openEditPlanModal(p)}
                      onDelete={() => void handleDeletePlan(p)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="lg:col-span-7">
            <div className="mb-3 text-sm font-semibold text-rose-900/85">详情与任务</div>
            {!selectedPlan ? (
              <div className="ls-surface p-10 text-center text-sm text-rose-800/70">请选择左侧计划</div>
            ) : (
              <div className="space-y-5">
                <PlanCard
                  plan={selectedPlan}
                  compact={false}
                  onEdit={() => openEditPlanModal(selectedPlan)}
                  onDelete={() => void handleDeletePlan(selectedPlan)}
                />

                <PlanExpensePanel
                  planId={selectedPlan.id}
                  onExpensesChanged={() => {
                    void refreshPlans()
                  }}
                />

                <div className="ls-surface p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <Typography.Title level={5} className="!mb-0 !text-rose-950">
                      任务清单
                    </Typography.Title>
                    <Button type="primary" icon={<PlusOutlined />} className="cursor-pointer" onClick={openAddTaskModal}>
                      添加任务
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {selectedTasks.map((t, idx) => (
                      <TaskItem
                        key={t.id || `task-${idx}`}
                        task={t}
                        currentUserId={currentUserId}
                        partnerUserId={partnerId}
                        toggleLoading={togglingTaskId === t.id}
                        deleteLoading={deletingTaskId === t.id}
                        onToggleComplete={() => void handleToggleTaskComplete(t)}
                        onEdit={() => openEditTaskModal(t)}
                        onDelete={() => void handleDeleteTask(t)}
                      />
                    ))}
                    {!selectedTasks.length ? (
                      <p className="text-sm text-rose-800/60">暂无子任务，可点击「添加任务」创建。</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      <PlanForm
        mode={planModalMode}
        open={planModalOpen}
        modalTitle={planModalMode === 'edit' ? '编辑计划' : '新建共同计划'}
        confirmLoading={planSaving}
        coupleId={coupleId ?? ''}
        editingPlan={planModalMode === 'edit' ? editingPlanForModal : null}
        form={planForm}
        onCancel={() => {
          setPlanModalOpen(false)
          setEditingPlanForModal(null)
          planForm.resetFields()
        }}
        onSubmitCreate={handleCreatePlan}
        onSubmitUpdate={handleUpdatePlan}
      />

      <TaskFormModal
        open={taskModalOpen}
        mode={taskModalMode}
        title={taskModalMode === 'edit' ? '编辑任务' : '添加任务'}
        confirmLoading={taskModalSubmitting}
        form={taskModalForm}
        currentUserId={currentUserId}
        partnerId={partnerId}
        onCancel={() => {
          setTaskModalOpen(false)
          setEditingTask(null)
          taskModalForm.resetFields()
        }}
        onSubmit={handleTaskModalSubmit}
      />
    </div>
  )
}
