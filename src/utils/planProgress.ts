import type { Plan, PlanTask } from '../services/plan'
import { getPlanTasks } from '../services/plan'

/**
 * 根据子任务完成情况计算进度百分比；无任务时返回 null（沿用服务端 progress）。
 */
export function computeTaskProgressPercent(tasks: PlanTask[] | undefined | null): number | null {
  if (!Array.isArray(tasks) || tasks.length === 0) return null
  const done = tasks.filter((t) => t && t.completed).length
  return Math.round((done / tasks.length) * 100)
}

function coerceDisplayProgress(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return Math.min(100, Math.max(0, v))
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0
}

/** 展示用进度：有任务时以任务汇总为准，否则用服务端字段。 */
export function displayPlanProgress(plan: Plan): number {
  const fromTasks = computeTaskProgressPercent(getPlanTasks(plan))
  return fromTasks !== null ? fromTasks : coerceDisplayProgress(plan.progress)
}
