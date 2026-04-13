import { Form, Input, Modal, DatePicker, message } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import {
  createMemorial,
  updateMemorial,
  type MemorialDay,
} from '../services/memorial'

export type MemorialFormValues = {
  name: string
  description?: string
  memorialDate: Dayjs
}

type Props = {
  open: boolean
  coupleId: string
  /** 新建时默认选中的日期 */
  defaultDate: Dayjs
  /** 非空则编辑 */
  editing: MemorialDay | null
  onClose: () => void
  onSaved: () => void
}

export default function MemorialDayFormModal({
  open,
  coupleId,
  defaultDate,
  editing,
  onClose,
  onSaved,
}: Props) {
  const [form] = Form.useForm<MemorialFormValues>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        description: editing.description ?? undefined,
        memorialDate: dayjs(editing.memorialDate),
      })
    } else {
      form.setFieldsValue({
        name: '',
        description: undefined,
        memorialDate: defaultDate,
      })
    }
  }, [open, editing, defaultDate, form])

  const handleOk = async () => {
    const v = await form.validateFields()
    setSubmitting(true)
    try {
      const memorialDate = v.memorialDate.format('YYYY-MM-DD')
      if (editing) {
        const resp = await updateMemorial(editing.id, {
          name: v.name.trim(),
          description: v.description?.trim() || null,
          memorialDate,
        })
        if (resp.code !== 0) {
          throw new Error(resp.message || '更新失败')
        }
      } else {
        const resp = await createMemorial({
          coupleId,
          name: v.name.trim(),
          description: v.description?.trim() || null,
          memorialDate,
        })
        if (resp.code !== 0) {
          throw new Error(resp.message || '创建失败')
        }
      }
      message.success(editing ? '已更新' : '已创建')
      onSaved()
      onClose()
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? '编辑纪念日' : '新建纪念日'}
      okText="保存"
      cancelText="取消"
      destroyOnClose
      onCancel={onClose}
      afterClose={() => form.resetFields()}
      onOk={() => void handleOk()}
      confirmLoading={submitting}
    >
      <Form
        form={form}
        layout="vertical"
        className="pt-2"
      >
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入名称' }, { max: 200, message: '最多 200 字' }]}
        >
          <Input placeholder="例如：恋爱纪念日" maxLength={200} showCount />
        </Form.Item>
        <Form.Item name="description" label="描述（可选）" rules={[{ max: 2000, message: '最多 2000 字' }]}>
          <Input.TextArea rows={3} placeholder="简短备注" maxLength={2000} showCount />
        </Form.Item>
        <Form.Item
          name="memorialDate"
          label="纪念日日期"
          rules={[{ required: true, message: '请选择日期' }]}
        >
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
