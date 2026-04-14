import { Avatar, Button, Card, DatePicker, Form, Input, Select, Space, Upload, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

type ProfileFormValues = {
  username?: string
  email?: string
  avatarUrl?: string
  gender?: number
  birthday?: dayjs.Dayjs
}

export default function Profile() {
  const [form] = Form.useForm<ProfileFormValues>()
  const user = useAuthStore((s) => s.user)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const uploadAvatar = useAuthStore((s) => s.uploadAvatar)

  useEffect(() => {
    fetchProfile().catch(() => undefined)
  }, [fetchProfile])

  useEffect(() => {
    if (!user) return
    const updates: ProfileFormValues = {}
    // avatarUrl 总是从 store 同步，确保上传后立即刷新
    updates.avatarUrl = user.avatarUrl ?? undefined
    if (!form.isFieldTouched('gender')) {
      updates.gender = user.gender ?? undefined
    }
    if (!form.isFieldTouched('birthday')) {
      updates.birthday = user.birthday ? dayjs(user.birthday) : undefined
    }
    if (!form.isFieldTouched('username')) {
      updates.username = user.username
    }
    if (!form.isFieldTouched('email')) {
      updates.email = user.email ?? ''
    }
    form.setFieldsValue({
      ...updates,
    })
  }, [form, user])

  const onSave = async (values: ProfileFormValues) => {
    try {
      await updateProfile({
        avatarUrl: values.avatarUrl ?? null,
        gender: values.gender ?? null,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null,
        username: values.username?.trim() ?? '',
        email: values.email !== undefined && values.email !== null ? values.email.trim() : '',
      })
      message.success('个人信息已更新')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败')
    }
  }

  return (
    <Card className="ls-surface !shadow-sm" title={<span className="font-medium text-orange-950">个人信息</span>}>
      <Form form={form} layout="vertical" onFinish={onSave}>
        <Space align="center" size={16} className="mb-4">
          <Avatar size={72} src={user?.avatarUrl || undefined}>
            {user?.username?.slice(0, 1)?.toUpperCase() ?? 'U'}
          </Avatar>
          <Upload
            accept=".jpg,.jpeg,.png,.webp"
            showUploadList={false}
            beforeUpload={(file) => {
              const allowed = ['image/jpeg', 'image/png', 'image/webp']
              if (!allowed.includes(file.type)) {
                message.error('仅支持 jpg/jpeg/png/webp 格式')
                return Upload.LIST_IGNORE
              }
              const maxBytes = 2 * 1024 * 1024
              if (file.size > maxBytes) {
                message.error('头像大小不能超过 2MB')
                return Upload.LIST_IGNORE
              }
              return true
            }}
            customRequest={async ({ file, onSuccess, onError }) => {
              try {
                await uploadAvatar(file as File)
                message.success('头像上传成功')
                onSuccess?.({}, new XMLHttpRequest())
              } catch (err) {
                onError?.(err as Error)
              }
            }}
          >
            <Button>上传头像</Button>
          </Upload>
        </Space>

        <Form.Item label="手机号">
          <Input value={user?.phone} disabled />
        </Form.Item>

        <Form.Item
          label="用户名"
          name="username"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input placeholder="展示名称" />
        </Form.Item>

        <Form.Item
          label="邮箱"
          name="email"
          rules={[{ type: 'email', message: '邮箱格式不正确' }]}
        >
          <Input placeholder="选填，用于联系与找回提示" allowClear />
        </Form.Item>

        <Form.Item label="性别" name="gender">
          <Select
            allowClear
            placeholder="请选择性别"
            options={[
              { label: '男', value: 1 },
              { label: '女', value: 2 },
              { label: '保密', value: 0 },
            ]}
          />
        </Form.Item>

        <Form.Item label="生日" name="birthday">
          <DatePicker className="w-full" />
        </Form.Item>

        <Button type="primary" htmlType="submit">
          保存修改
        </Button>
      </Form>
    </Card>
  )
}
