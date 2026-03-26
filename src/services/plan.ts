import { http } from './http'
import type { ApiResponse } from '../types/api'

export type PlanTask = {
  id: string
  planId: string
  title: string
  assigneeId?: string | null
  completed: boolean
  completedAt?: string | null
  dueDate?: string | null
  createdAt?: string | null
}

export type Plan = {
  id: string
  coupleId: string
  title: string
  description?: string | null
  planType: string
  priority: number
  startDate?: string | null
  endDate?: string | null
  status: string
  progress: number
  budgetTotal?: number | string | null
  budgetSpent?: number | string | null
  createdAt?: string | null
  updatedAt?: string | null
  /** 接口可能返回 null；业务侧请用 {@link normalizePlan} 或 {@link getPlanTasks} */
  tasks?: PlanTask[] | null
}

function coerceProgress(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return Math.min(100, Math.max(0, v))
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0
}

/** 单条任务字段兜底，避免接口缺字段导致渲染报错。 */
export function normalizePlanTask(raw: PlanTask): PlanTask {
  return {
    ...raw,
    id: raw.id != null ? String(raw.id) : '',
    planId: raw.planId != null ? String(raw.planId) : '',
    title: raw.title ?? '',
    completed: Boolean(raw.completed),
  }
}

/**
 * 将计划中的 tasks 规范为数组（接口可能返回 null / 非数组），并校正 progress。
 */
export function normalizePlan(raw: Plan): Plan {
  const rawTasks = raw.tasks
  const tasks: PlanTask[] = Array.isArray(rawTasks)
    ? rawTasks
        .filter((t): t is PlanTask => t != null && typeof t === 'object')
        .map((t) => normalizePlanTask(t))
        .filter((t) => Boolean(t.id))
    : []
  return {
    ...raw,
    tasks,
    progress: coerceProgress(raw.progress),
    priority: typeof raw.priority === 'number' && !Number.isNaN(raw.priority) ? raw.priority : Number(raw.priority) || 0,
  }
}

/** 安全读取任务列表（未归一化对象也可调用）。 */
export function getPlanTasks(plan: Pick<Plan, 'tasks'> | null | undefined): PlanTask[] {
  const t = plan?.tasks
  return Array.isArray(t) ? t : []
}

export type CreatePlanBody = {
  coupleId: string
  title: string
  description?: string | null
  planType: string
  priority?: number | null
  startDate?: string | null
  endDate?: string | null
  status?: string | null
  progress?: number | null
  budgetTotal?: number | null
  budgetSpent?: number | null
}

export type UpdatePlanBody = {
  title?: string | null
  description?: string | null
  planType?: string | null
  priority?: number | null
  startDate?: string | null
  endDate?: string | null
  status?: string | null
  progress?: number | null
  budgetTotal?: number | null
  budgetSpent?: number | null
}

export type CreatePlanTaskBody = {
  title: string
  assigneeId?: string | null
  dueDate?: string | null
}

export async function listPlans(coupleId: string) {
  const { data } = await http.get<ApiResponse<Plan[]>>('/api/v1/plans', { params: { coupleId } })
  if (data.code !== 0 || data.data == null) return data
  const list = Array.isArray(data.data) ? data.data.map(normalizePlan) : []
  return { ...data, data: list }
}

export async function createPlan(body: CreatePlanBody) {
  const { data } = await http.post<ApiResponse<Plan>>('/api/v1/plans', body)
  if (data.code !== 0 || data.data == null) return data
  return { ...data, data: normalizePlan(data.data) }
}

export async function updatePlan(planId: string, body: UpdatePlanBody) {
  const { data } = await http.put<ApiResponse<Plan>>(`/api/v1/plans/${planId}`, body)
  if (data.code !== 0 || data.data == null) return data
  return { ...data, data: normalizePlan(data.data) }
}

export async function deletePlan(planId: string) {
  const { data } = await http.delete<ApiResponse<unknown>>(`/api/v1/plans/${planId}`)
  return data
}

export async function createPlanTask(planId: string, body: CreatePlanTaskBody) {
  const { data } = await http.post<ApiResponse<PlanTask>>(`/api/v1/plans/${planId}/tasks`, body)
  if (data.code !== 0 || data.data == null) return data
  return { ...data, data: normalizePlanTask(data.data) }
}

export async function completePlanTask(planId: string, taskId: string) {
  const { data } = await http.put<ApiResponse<PlanTask>>(`/api/v1/plans/${planId}/tasks/${taskId}`)
  if (data.code !== 0 || data.data == null) return data
  return { ...data, data: normalizePlanTask(data.data) }
}
