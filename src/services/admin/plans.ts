import type { ApiResponse } from '../../types/api'
import { http } from '../http'
import type { AdminPage } from './users'

export type AdminPlan = {
  id: string
  coupleId: string
  title: string
  description?: string | null
  status?: string | null
  createdAt?: string | null
}

export type AdminPlanTask = {
  id: string
  planId: string
  title: string
  isCompleted?: number | null
  createdAt?: string | null
}

export type AdminPlanExpense = {
  id: string
  planId: string
  amount?: number | null
  description?: string | null
  createdAt?: string | null
}

export async function fetchAdminPlans(params: {
  coupleId?: string
  page?: number
  pageSize?: number
}) {
  const { data } = await http.get<ApiResponse<AdminPage<AdminPlan>>>('/api/v1/admin/plans', {
    params,
  })
  return data
}

export async function deleteAdminPlan(id: string) {
  const { data } = await http.delete<ApiResponse<null>>(`/api/v1/admin/plans/${id}`)
  return data
}

export async function fetchAdminPlanTasks(params: {
  planId?: string
  page?: number
  pageSize?: number
}) {
  const { data } = await http.get<ApiResponse<AdminPage<AdminPlanTask>>>(
    '/api/v1/admin/plans/tasks',
    { params },
  )
  return data
}

export async function fetchAdminPlanExpenses(params: {
  planId?: string
  page?: number
  pageSize?: number
}) {
  const { data } = await http.get<ApiResponse<AdminPage<AdminPlanExpense>>>(
    '/api/v1/admin/plans/expenses',
    { params },
  )
  return data
}
