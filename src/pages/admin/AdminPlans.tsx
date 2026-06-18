import { Button, Input, Modal, Table, Tabs, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import {
  deleteAdminPlan,
  fetchAdminPlanExpenses,
  fetchAdminPlans,
  fetchAdminPlanTasks,
  type AdminPlan,
  type AdminPlanExpense,
  type AdminPlanTask,
} from '../../services/admin/plans'

export default function AdminPlans() {
  const [coupleId, setCoupleId] = useState('')
  const [planId, setPlanId] = useState('')
  const [planPage, setPlanPage] = useState(1)
  const [taskPage, setTaskPage] = useState(1)
  const [expensePage, setExpensePage] = useState(1)
  const [pageSize] = useState(10)
  const [plans, setPlans] = useState<AdminPlan[]>([])
  const [tasks, setTasks] = useState<AdminPlanTask[]>([])
  const [expenses, setExpenses] = useState<AdminPlanExpense[]>([])
  const [planTotal, setPlanTotal] = useState(0)
  const [taskTotal, setTaskTotal] = useState(0)
  const [expenseTotal, setExpenseTotal] = useState(0)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [loadingExpenses, setLoadingExpenses] = useState(false)

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true)
    try {
      const resp = await fetchAdminPlans({
        coupleId: coupleId || undefined,
        page: planPage,
        pageSize,
      })
      if (resp.code !== 0) throw new Error(resp.message)
      setPlans(resp.data.records)
      setPlanTotal(resp.data.total)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载计划失败')
    } finally {
      setLoadingPlans(false)
    }
  }, [coupleId, planPage, pageSize])

  const loadTasks = useCallback(async () => {
    setLoadingTasks(true)
    try {
      const resp = await fetchAdminPlanTasks({
        planId: planId || undefined,
        page: taskPage,
        pageSize,
      })
      if (resp.code !== 0) throw new Error(resp.message)
      setTasks(resp.data.records)
      setTaskTotal(resp.data.total)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载任务失败')
    } finally {
      setLoadingTasks(false)
    }
  }, [planId, taskPage, pageSize])

  const loadExpenses = useCallback(async () => {
    setLoadingExpenses(true)
    try {
      const resp = await fetchAdminPlanExpenses({
        planId: planId || undefined,
        page: expensePage,
        pageSize,
      })
      if (resp.code !== 0) throw new Error(resp.message)
      setExpenses(resp.data.records)
      setExpenseTotal(resp.data.total)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载费用失败')
    } finally {
      setLoadingExpenses(false)
    }
  }, [planId, expensePage, pageSize])

  useEffect(() => {
    void loadPlans()
  }, [loadPlans])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  useEffect(() => {
    void loadExpenses()
  }, [loadExpenses])

  const planColumns: ColumnsType<AdminPlan> = [
    { title: '标题', dataIndex: 'title' },
    { title: '情侣 ID', dataIndex: 'coupleId', ellipsis: true },
    { title: '状态', dataIndex: 'status', width: 100 },
    { title: '创建时间', dataIndex: 'createdAt', width: 170 },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          size="small"
          danger
          onClick={() =>
            Modal.confirm({
              title: '删除计划',
              content: '将同时删除任务与费用记录，确定继续？',
              okType: 'danger',
              onOk: async () => {
                const resp = await deleteAdminPlan(record.id)
                if (resp.code !== 0) {
                  message.error(resp.message)
                  return
                }
                message.success('已删除')
                void loadPlans()
              },
            })
          }
        >
          删除
        </Button>
      ),
    },
  ]

  const taskColumns: ColumnsType<AdminPlanTask> = [
    { title: '计划 ID', dataIndex: 'planId', ellipsis: true },
    { title: '标题', dataIndex: 'title' },
    {
      title: '完成',
      dataIndex: 'isCompleted',
      width: 80,
      render: (v: number) => (v === 1 ? '是' : '否'),
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 170 },
  ]

  const expenseColumns: ColumnsType<AdminPlanExpense> = [
    { title: '计划 ID', dataIndex: 'planId', ellipsis: true },
    { title: '金额', dataIndex: 'amount', width: 100 },
    { title: '说明', dataIndex: 'description', ellipsis: true },
    { title: '创建时间', dataIndex: 'createdAt', width: 170 },
  ]

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-stone-800">共同计划</h1>
      <Tabs
        items={[
          {
            key: 'plans',
            label: '计划',
            children: (
              <>
                <Input.Search
                  className="mb-3"
                  placeholder="情侣 ID"
                  allowClear
                  onSearch={(v) => {
                    setPlanPage(1)
                    setCoupleId(v)
                  }}
                  style={{ width: 200 }}
                />
                <Table
                  rowKey="id"
                  columns={planColumns}
                  dataSource={plans}
                  loading={loadingPlans}
                  pagination={{
                    current: planPage,
                    pageSize,
                    total: planTotal,
                    onChange: setPlanPage,
                  }}
                />
              </>
            ),
          },
          {
            key: 'tasks',
            label: '任务',
            children: (
              <>
                <Input.Search
                  className="mb-3"
                  placeholder="计划 ID"
                  allowClear
                  onSearch={(v) => {
                    setTaskPage(1)
                    setPlanId(v)
                  }}
                  style={{ width: 200 }}
                />
                <Table
                  rowKey="id"
                  columns={taskColumns}
                  dataSource={tasks}
                  loading={loadingTasks}
                  pagination={{
                    current: taskPage,
                    pageSize,
                    total: taskTotal,
                    onChange: setTaskPage,
                  }}
                />
              </>
            ),
          },
          {
            key: 'expenses',
            label: '费用',
            children: (
              <>
                <Input.Search
                  className="mb-3"
                  placeholder="计划 ID"
                  allowClear
                  onSearch={(v) => {
                    setExpensePage(1)
                    setPlanId(v)
                  }}
                  style={{ width: 200 }}
                />
                <Table
                  rowKey="id"
                  columns={expenseColumns}
                  dataSource={expenses}
                  loading={loadingExpenses}
                  pagination={{
                    current: expensePage,
                    pageSize,
                    total: expenseTotal,
                    onChange: setExpensePage,
                  }}
                />
              </>
            ),
          },
        ]}
      />
    </div>
  )
}
