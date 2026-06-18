import { Button, Card, Form, Input, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { isAdminUser } from '../../utils/adminRole'

const CN_MOBILE = /^1[3-9]\d{9}$/

type FormValues = {
  phone: string
  password: string
}

export default function AdminLogin() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)

  const onFinish = async (values: FormValues) => {
    const phone = values.phone.replace(/\D/g, '')
    try {
      await login(phone, values.password)
      await fetchProfile()
      const user = useAuthStore.getState().user
      if (!isAdminUser(user?.role)) {
        await useAuthStore.getState().logout()
        message.error('该账号无管理员权限')
        return
      }
      message.success('登录成功')
      navigate('/admin')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '登录失败')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <Card title="管理员登录" className="w-full max-w-md">
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              {
                validator: (_, v) => {
                  const d = (v as string)?.replace(/\D/g, '') ?? ''
                  if (!d) return Promise.reject(new Error('请输入手机号'))
                  if (!CN_MOBILE.test(d))
                    return Promise.reject(new Error('请输入有效的 11 位手机号'))
                  return Promise.resolve()
                },
              },
            ]}
          >
            <Input placeholder="11 位手机号" maxLength={13} autoComplete="tel" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" className="w-full">
            登录管理后台
          </Button>
        </Form>
      </Card>
    </div>
  )
}
