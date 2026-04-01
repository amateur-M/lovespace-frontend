import { Button, Card, Form, Input, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import AuthPageShell from '../components/AuthPageShell'
import { useAuthStore } from '../stores/authStore'

type FormValues = {
  email: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const onFinish = async (values: FormValues) => {
    try {
      await login(values.email, values.password)
      message.success('登录成功')
      navigate('/couple')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '登录失败')
    }
  }

  return (
    <AuthPageShell title="登录" subtitle="使用邮箱与密码进入你们的空间">
      <Card className="ls-surface w-full !shadow-none" variant="borderless">
        <Form layout="vertical" onFinish={onFinish} autoComplete="off" className="!mt-0">
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
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Button type="primary" htmlType="submit" className="w-full">
            登录
          </Button>

          <div className="mt-6 text-center text-sm text-rose-800/65">
            还没有账号？{' '}
            <Link to="/register" className="ls-link">
              去注册
            </Link>
          </div>
        </Form>
      </Card>
    </AuthPageShell>
  )
}
