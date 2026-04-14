import { Button, Card, Form, Input, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import AuthPageShell from '../components/AuthPageShell'
import { useAuthStore } from '../stores/authStore'

const CN_MOBILE = /^1[3-9]\d{9}$/

type FormValues = {
  phone: string
  username: string
  password: string
  confirmPassword: string
}

export default function Register() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)

  const onFinish = async (values: FormValues) => {
    const phone = values.phone.replace(/\D/g, '')
    try {
      await register(phone, values.username.trim(), values.password)
      message.success('注册成功，请登录')
      navigate('/login')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '注册失败')
    }
  }

  return (
    <AuthPageShell title="注册" subtitle="创建账号，开始记录属于你们的故事">
      <Card className="ls-surface w-full !shadow-none" variant="borderless">
        <Form layout="vertical" onFinish={onFinish} autoComplete="off" className="!mt-0">
          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              {
                validator: (_, v) => {
                  const d = (v as string)?.replace(/\D/g, '') ?? ''
                  if (!d) return Promise.reject(new Error('请输入手机号'))
                  if (!CN_MOBILE.test(d)) return Promise.reject(new Error('请输入有效的 11 位手机号'))
                  return Promise.resolve()
                },
              },
            ]}
          >
            <Input placeholder="11 位手机号（用于登录）" maxLength={13} autoComplete="tel" />
          </Form.Item>

          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="展示名称，可在个人资料中修改" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
            hasFeedback
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入密码" />
          </Form.Item>

          <Button type="primary" htmlType="submit" className="w-full">
            注册
          </Button>

          <div className="mt-6 text-center text-sm text-rose-800/65">
            已有账号？{' '}
            <Link to="/login" className="ls-link">
              去登录
            </Link>
          </div>
        </Form>
      </Card>
    </AuthPageShell>
  )
}
