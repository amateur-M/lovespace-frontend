import { PlusOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Button, DatePicker, Empty, Form, Input, Select, Space, Spin, Typography, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import PlanCard from '../components/PlanCard'
import PlanForm, { type PlanFormValues } from '../components/PlanForm'
import TaskItem from '../components/TaskItem'
import {
  completePlanTask,
  createPlan,
  createPlanTask,
  getPlanTasks,
  listPlans,
  updatePlan,
  type CreatePlanBody,
  type Plan,
} from '../services/plan'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'
import { computeTaskProgressPercent } from '../utils/planProgress'
import dayjs from 'dayjs'

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
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
  const [addingTask, setAddingTask] = useState(false)

  const [planForm] = Form.useForm<PlanFormValues>()
  const [taskForm] = Form.useForm<{ title: string; assigneeId?: string; dueDate?: dayjs.Dayjs | null }>()

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

  /** 任务变更后根据子任务比例回写服务端 progress，再刷新列表。 */
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

  const handleCreatePlan = async (body: CreatePlanBody) => {
    setCreating(true)
    try {
      const resp = await createPlan(body)
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '创建失败')
      }
      message.success('已创建计划')
      setCreateOpen(false)
      planForm.resetFields()
      await refreshPlans()
      setSelectedId(resp.data.id)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  const handleCompleteTask = async (planId: string, taskId: string) => {
    setCompletingTaskId(taskId)
    try {
      const resp = await completePlanTask(planId, taskId)
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '操作失败')
      }
      message.success('任务已完成')
      await refreshAndSyncProgress(planId)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '操作失败')
    } finally {
      setCompletingTaskId(null)
    }
  }

  const handleAddTask = async (planId: string) => {
    const v = await taskForm.validateFields()
    setAddingTask(true)
    try {
      const resp = await createPlanTask(planId, {
        title: v.title.trim(),
        assigneeId: v.assigneeId ?? null,
        dueDate: v.dueDate ? v.dueDate.format('YYYY-MM-DD') : null,
      })
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '添加失败')
      }
      message.success('已添加任务')
      taskForm.resetFields()
      await refreshAndSyncProgress(planId)
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error(e instanceof Error ? e.message : '添加失败')
    } finally {
      setAddingTask(false)
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
          onClick={() => setCreateOpen(true)}
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
                <PlanCard plan={selectedPlan} compact={false} />

                <div className="ls-surface p-5">
                  <Typography.Title level={5} className="!mb-4 !text-rose-950">
                    任务清单
                  </Typography.Title>
                  <div className="flex flex-col gap-2">
                    {selectedTasks.map((t, idx) => (
                      <TaskItem
                        key={t.id || `task-${idx}`}
                        task={t}
                        currentUserId={currentUserId}
                        partnerUserId={partnerId}
                        completing={completingTaskId === t.id}
                        onComplete={() => handleCompleteTask(selectedPlan.id, t.id)}
                      />
                    ))}
                    {!selectedTasks.length ? (
                      <p className="text-sm text-rose-800/60">暂无子任务，可在下方添加。</p>
                    ) : null}
                  </div>

                  <Form
                    form={taskForm}
                    layout="vertical"
                    className="mt-6 border-t border-rose-100 pt-5"
                    onFinish={() => handleAddTask(selectedPlan.id)}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Form.Item
                        name="title"
                        label="新任务"
                        rules={[{ required: true, message: '请输入任务标题' }]}
                        className="!mb-0 sm:col-span-2"
                      >
                        <Input placeholder="任务标题" maxLength={200} />
                      </Form.Item>
                      <Form.Item name="assigneeId" label="负责人" className="!mb-0">
                        <Select
                          allowClear
                          placeholder="可选"
                          options={[
                            ...(currentUserId ? [{ value: currentUserId, label: '我' }] : []),
                            ...(partnerId ? [{ value: partnerId, label: 'Ta' }] : []),
                          ]}
                        />
                      </Form.Item>
                      <Form.Item name="dueDate" label="截止日期" className="!mb-0">
                        <DatePicker className="w-full" format="YYYY-MM-DD" />
                      </Form.Item>
                    </div>
                    <Space className="mt-3">
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={addingTask}
                        className="cursor-pointer"
                      >
                        添加任务
                      </Button>
                    </Space>
                  </Form>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      <PlanForm
        open={createOpen}
        modalTitle="新建共同计划"
        confirmLoading={creating}
        coupleId={coupleId ?? ''}
        form={planForm}
        onCancel={() => {
          setCreateOpen(false)
          planForm.resetFields()
        }}
        onSubmit={handleCreatePlan}
      />
    </div>
  )
}
