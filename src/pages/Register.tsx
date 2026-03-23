import { Button, Card, Form, Input, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import AuthPageShell from '../components/AuthPageShell'
import { useAuthStore } from '../stores/authStore'

type FormValues = {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export default function Register() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)

  const onFinish = async (values: FormValues) => {
    try {
      await register(values.username, values.email, values.password)
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
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
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
