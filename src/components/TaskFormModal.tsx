import { Form, Input, Modal, Select, Switch, DatePicker } from 'antd'
import type { FormInstance } from 'antd/es/form'
import dayjs from 'dayjs'
import type { PlanTask } from '../services/plan'

export type TaskFormValues = {
  title: string
  assigneeId?: string
  dueDate: dayjs.Dayjs | null
  completed: boolean
}

type TaskFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  title: string
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: TaskFormValues) => void | Promise<void>
  form: FormInstance<TaskFormValues>
  currentUserId: string
  partnerId?: string
}

/**
 * 新建 / 编辑子任务（Modal）。
 */
export default function TaskFormModal({
  open,
  mode,
  title,
  confirmLoading,
  onCancel,
  onSubmit,
  form,
  currentUserId,
  partnerId,
}: TaskFormModalProps) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText={mode === 'create' ? '添加' : '保存'}
      cancelText="取消"
      destroyOnClose
      width={480}
      onOk={() => form.submit()}
    >
      <Form<TaskFormValues>
        form={form}
        layout="vertical"
        className="mt-2"
        initialValues={{ completed: false }}
        onFinish={async (v) => {
          await onSubmit(v)
        }}
      >
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入任务标题' }]}>
          <Input placeholder="任务标题" maxLength={200} showCount />
        </Form.Item>
        <Form.Item name="assigneeId" label="负责人">
          <Select
            allowClear
            placeholder="可选"
            options={[
              ...(currentUserId ? [{ value: currentUserId, label: '我' }] : []),
              ...(partnerId ? [{ value: partnerId, label: 'Ta' }] : []),
            ]}
          />
        </Form.Item>
        <Form.Item name="dueDate" label="截止日期">
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>
        {mode === 'edit' ? (
          <Form.Item name="completed" label="完成状态" valuePropName="checked">
            <Switch checkedChildren="已完成" unCheckedChildren="未完成" />
          </Form.Item>
        ) : null}
      </Form>
    </Modal>
  )
}

/** 打开编辑弹窗时填充表单。 */
// eslint-disable-next-line react-refresh/only-export-components
export function applyTaskToForm(form: FormInstance<TaskFormValues>, task: PlanTask) {
  form.setFieldsValue({
    title: task.title ?? '',
    assigneeId: task.assigneeId ?? undefined,
    dueDate: task.dueDate ? dayjs(task.dueDate) : null,
    completed: Boolean(task.completed),
  })
}
