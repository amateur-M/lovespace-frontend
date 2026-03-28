import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Table, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import {
  PLAN_EXPENSE_TYPE_OPTIONS,
  createPlanExpense,
  deletePlanExpense,
  expenseTypeLabel,
  listPlanExpenses,
  updatePlanExpense,
  type PlanExpense,
  type PlanExpenseCreateBody,
} from '../services/plan'

type PlanExpensePanelProps = {
  planId: string
  /** 消费变更后回调（用于刷新计划列表以更新预算汇总） */
  onExpensesChanged?: () => void | Promise<void>
  /** 根节点样式，默认 `ls-surface p-5` */
  className?: string
}

type ExpenseFormValues = {
  expenseType: string
  amount: number
  spentDate?: dayjs.Dayjs | null
  note?: string
}

const DEFAULT_FORM: ExpenseFormValues = {
  expenseType: 'lodging',
  amount: 0,
  spentDate: null,
  note: undefined,
}

function toCreateBody(v: ExpenseFormValues): PlanExpenseCreateBody {
  return {
    expenseType: v.expenseType,
    amount: v.amount,
    spentDate: v.spentDate ? v.spentDate.format('YYYY-MM-DD') : null,
    note: v.note?.trim() || null,
  }
}

/**
 * 计划消费记录：列表、记一笔、编辑、删除。
 */
export default function PlanExpensePanel({
  planId,
  onExpensesChanged,
  className = 'ls-surface p-5',
}: PlanExpensePanelProps) {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<PlanExpense[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<ExpenseFormValues>()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await listPlanExpenses(planId)
      if (resp.code !== 0 || resp.data == null) {
        throw new Error(resp.message || '加载消费记录失败')
      }
      setRows(resp.data)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载消费记录失败')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [planId])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setModalMode('create')
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ ...DEFAULT_FORM, spentDate: dayjs() })
    setModalOpen(true)
  }

  const openEdit = (r: PlanExpense) => {
    setModalMode('edit')
    setEditingId(r.id)
    form.setFieldsValue({
      expenseType: r.expenseType,
      amount: typeof r.amount === 'number' ? r.amount : Number(r.amount),
      spentDate: r.spentDate ? dayjs(r.spentDate) : null,
      note: r.note ?? undefined,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (v: ExpenseFormValues) => {
    if (v.amount == null || v.amount <= 0) {
      message.warning('请输入大于 0 的金额')
      return
    }
    setSubmitting(true)
    try {
      if (modalMode === 'create') {
        const resp = await createPlanExpense(planId, toCreateBody(v))
        if (resp.code !== 0 || !resp.data) {
          throw new Error(resp.message || '添加失败')
        }
        message.success('已记一笔')
      } else if (editingId) {
        const resp = await updatePlanExpense(planId, editingId, {
          expenseType: v.expenseType,
          amount: v.amount,
          spentDate: v.spentDate ? v.spentDate.format('YYYY-MM-DD') : null,
          note: v.note?.trim() || null,
        })
        if (resp.code !== 0 || !resp.data) {
          throw new Error(resp.message || '保存失败')
        }
        message.success('已更新')
      }
      setModalOpen(false)
      setEditingId(null)
      await load()
      await onExpensesChanged?.()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error(e instanceof Error ? e.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (r: PlanExpense) => {
    Modal.confirm({
      title: '删除这条消费记录？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const resp = await deletePlanExpense(planId, r.id)
          if (resp.code !== 0) {
            throw new Error(resp.message || '删除失败')
          }
          message.success('已删除')
          await load()
          await onExpensesChanged?.()
        } catch (e) {
          message.error(e instanceof Error ? e.message : '删除失败')
        }
      },
    })
  }

  const columns: ColumnsType<PlanExpense> = [
    {
      title: '类型',
      dataIndex: 'expenseType',
      width: 88,
      render: (t: string) => expenseTypeLabel(t),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 110,
      align: 'right',
      render: (a: number | string) =>
        `¥${(typeof a === 'number' ? a : Number(a)).toLocaleString('zh-CN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      title: '日期',
      dataIndex: 'spentDate',
      width: 108,
      render: (d: string | null | undefined) => (d ? dayjs(d).format('MM-DD') : '—'),
    },
    {
      title: '备注',
      dataIndex: 'note',
      ellipsis: true,
      render: (n: string | null | undefined) => n || '—',
    },
    {
      title: '',
      key: 'actions',
      width: 88,
      align: 'right',
      render: (_, r) => (
        <div className="flex justify-end gap-1">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} aria-label="编辑" />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(r)}
            aria-label="删除"
          />
        </div>
      ),
    },
  ]

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-800/45">流水</div>
          <Typography.Title level={5} className="!mb-0 !mt-0.5 !text-rose-950">
            消费明细
          </Typography.Title>
        </div>
        <Button type="primary" icon={<PlusOutlined />} className="cursor-pointer" onClick={openCreate}>
          记一笔
        </Button>
      </div>
      <Table<PlanExpense>
        size="small"
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={rows.length > 8 ? { pageSize: 8, showSizeChanger: false } : false}
        locale={{ emptyText: '暂无消费记录，点击「记一笔」添加。' }}
      />

      <Modal
        title={modalMode === 'edit' ? '编辑消费' : '记一笔'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          setEditingId(null)
          form.resetFields()
        }}
        confirmLoading={submitting}
        okText="保存"
        cancelText="取消"
        destroyOnClose
        onOk={() => form.submit()}
      >
        <Form<ExpenseFormValues> form={form} layout="vertical" initialValues={DEFAULT_FORM} onFinish={handleSubmit} className="mt-2">
          <Form.Item name="expenseType" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select options={PLAN_EXPENSE_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber min={0.01} className="w-full" placeholder="0.00" addonBefore="¥" />
          </Form.Item>
          <Form.Item name="spentDate" label="消费日期">
            <DatePicker className="w-full" format="YYYY-MM-DD" allowClear placeholder="可选" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} maxLength={500} showCount placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
