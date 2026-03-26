import { Form, Input, InputNumber, Modal, Select, DatePicker } from 'antd'
import type { FormInstance } from 'antd/es/form'
import type { CreatePlanBody } from '../services/plan'

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
  range?: [import('dayjs').Dayjs, import('dayjs').Dayjs] | null
  status?: string
  progress?: number | null
  budgetTotal?: number | null
  budgetSpent?: number | null
}

type PlanFormProps = {
  open: boolean
  modalTitle: string
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (body: CreatePlanBody) => void | Promise<void>
  coupleId: string
  form: FormInstance<PlanFormValues>
}

function buildBody(coupleId: string, values: PlanFormValues): CreatePlanBody {
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
    budgetSpent: values.budgetSpent ?? null,
  }
}

/**
 * 创建计划表单（Modal 内）。
 */
export default function PlanForm({
  open,
  modalTitle,
  confirmLoading,
  onCancel,
  onSubmit,
  coupleId,
  form,
}: PlanFormProps) {
  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText="创建"
      cancelText="取消"
      destroyOnClose
      width={520}
      classNames={{ body: '!pt-2' }}
      onOk={() => form.submit()}
    >
      <Form<PlanFormValues>
        form={form}
        layout="vertical"
        initialValues={{
          planType: 'goal',
          priority: 0,
          progress: 0,
          status: 'draft',
        }}
        className="mt-2"
        onFinish={async (values) => {
          await onSubmit(buildBody(coupleId, values))
        }}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Form.Item name="budgetTotal" label="预算总额">
            <InputNumber min={0} className="w-full" placeholder="可选" addonBefore="¥" />
          </Form.Item>
          <Form.Item name="budgetSpent" label="已花费">
            <InputNumber min={0} className="w-full" placeholder="可选" addonBefore="¥" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}
