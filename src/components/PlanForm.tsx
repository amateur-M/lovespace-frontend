import { Form, Input, InputNumber, Modal, Select, DatePicker } from 'antd'
import type { FormInstance } from 'antd/es/form'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import type { CreatePlanBody, Plan, UpdatePlanBody } from '../services/plan'

const PLAN_TYPES = [
  { value: 'goal', label: '目标' },
  { value: 'travel', label: '旅行' },
  { value: 'event', label: '事件' },
]

const STATUSES = [
  { value: 'draft', label: '草稿' },
  { value: 'active', label: '进行中' },
  { value: 'in_progress', label: '执行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

export type PlanFormValues = {
  title: string
  description?: string
  planType: string
  priority?: number | null
  range?: [dayjs.Dayjs, dayjs.Dayjs]
  status?: string
  progress?: number | null
  budgetTotal?: number | null
}

type PlanFormProps = {
  mode?: 'create' | 'edit'
  open: boolean
  modalTitle: string
  confirmLoading?: boolean
  onCancel: () => void
  coupleId: string
  /** 编辑模式下传入当前计划 */
  editingPlan?: Plan | null
  form: FormInstance<PlanFormValues>
  onSubmitCreate: (body: CreatePlanBody) => void | Promise<void>
  onSubmitUpdate?: (planId: string, body: UpdatePlanBody) => void | Promise<void>
}

function buildCreateBody(coupleId: string, values: PlanFormValues): CreatePlanBody {
  const range = values.range
  return {
    coupleId,
    title: values.title.trim(),
    description: values.description?.trim() || null,
    planType: values.planType,
    priority: values.priority ?? 0,
    startDate: range?.[0] ? range[0].format('YYYY-MM-DD') : null,
    endDate: range?.[1] ? range[1].format('YYYY-MM-DD') : null,
    status: values.status ?? 'draft',
    progress: values.progress ?? 0,
    budgetTotal: values.budgetTotal ?? null,
  }
}

function buildUpdateBody(values: PlanFormValues): UpdatePlanBody {
  const range = values.range
  return {
    title: values.title.trim(),
    description: values.description?.trim() ?? null,
    planType: values.planType,
    priority: values.priority ?? 0,
    startDate: range?.[0] ? range[0].format('YYYY-MM-DD') : null,
    endDate: range?.[1] ? range[1].format('YYYY-MM-DD') : null,
    status: values.status ?? 'draft',
    progress: values.progress ?? 0,
    budgetTotal: values.budgetTotal ?? null,
  }
}

const DEFAULT_CREATE_VALUES: PlanFormValues = {
  title: '',
  description: undefined,
  planType: 'goal',
  priority: 0,
  range: undefined,
  status: 'draft',
  progress: 0,
  budgetTotal: null,
}

/**
 * 新建 / 编辑共同计划（Modal 内）。
 */
export default function PlanForm({
  mode = 'create',
  open,
  modalTitle,
  confirmLoading,
  onCancel,
  coupleId,
  editingPlan,
  form,
  onSubmitCreate,
  onSubmitUpdate,
}: PlanFormProps) {
  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && editingPlan) {
      const p = editingPlan
      const start = p.startDate ? dayjs(p.startDate) : null
      const end = p.endDate ? dayjs(p.endDate) : null
      let range: [dayjs.Dayjs, dayjs.Dayjs] | undefined
      if (start && end) {
        range = [start, end]
      } else if (start) {
        range = [start, start]
      } else if (end) {
        range = [end, end]
      }
      form.setFieldsValue({
        title: p.title,
        description: p.description ?? undefined,
        planType: p.planType,
        priority: p.priority ?? 0,
        range: range ?? undefined,
        status: p.status,
        progress: p.progress ?? 0,
        budgetTotal:
          p.budgetTotal != null && p.budgetTotal !== ''
            ? typeof p.budgetTotal === 'number'
              ? p.budgetTotal
              : Number(p.budgetTotal)
            : null,
      })
    } else if (mode === 'create') {
      form.resetFields()
      form.setFieldsValue(DEFAULT_CREATE_VALUES)
    }
  }, [open, mode, editingPlan, form])

  const handleFinish = async (values: PlanFormValues) => {
    if (mode === 'edit' && editingPlan && onSubmitUpdate) {
      await onSubmitUpdate(editingPlan.id, buildUpdateBody(values))
    } else {
      await onSubmitCreate(buildCreateBody(coupleId, values))
    }
  }

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText={mode === 'edit' ? '保存' : '创建'}
      cancelText="取消"
      destroyOnClose
      width={520}
      classNames={{ body: '!pt-2' }}
      onOk={() => form.submit()}
    >
      <Form<PlanFormValues>
        form={form}
        layout="vertical"
        initialValues={DEFAULT_CREATE_VALUES}
        className="mt-2"
        onFinish={handleFinish}
      >
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="例如：五一青岛行" maxLength={200} showCount />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea placeholder="可选" rows={3} maxLength={2000} showCount />
        </Form.Item>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Form.Item name="planType" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select options={PLAN_TYPES} placeholder="类型" />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <InputNumber min={0} max={999} className="w-full" placeholder="0" />
          </Form.Item>
        </div>
        <Form.Item name="range" label="起止日期">
          <DatePicker.RangePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Form.Item name="status" label="状态">
            <Select options={STATUSES} allowClear placeholder="草稿" />
          </Form.Item>
          <Form.Item
            name="progress"
            label="进度 %"
            rules={[
              {
                type: 'number',
                min: 0,
                max: 100,
                message: '0–100',
              },
            ]}
          >
            <InputNumber min={0} max={100} className="w-full" placeholder="0" />
          </Form.Item>
        </div>
        <Form.Item name="budgetTotal" label="预算总额">
          <InputNumber min={0} className="w-full max-w-xs" placeholder="可选" addonBefore="¥" />
        </Form.Item>
        <p className="!mb-0 text-xs text-rose-800/60">已花费由「消费记录」自动汇总，无需在此填写。</p>
      </Form>
    </Modal>
  )
}
