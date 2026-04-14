import { Button, Card, Form, Input, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import AuthPageShell from '../components/AuthPageShell'
import { useAuthStore } from '../stores/authStore'

const CN_MOBILE = /^1[3-9]\d{9}$/

type FormValues = {
  phone: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const onFinish = async (values: FormValues) => {
    const phone = values.phone.replace(/\D/g, '')
    try {
      await login(phone, values.password)
      message.success('登录成功')
      navigate('/couple')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '登录失败')
    }
  }

  return (
    <AuthPageShell title="登录" subtitle="使用手机号与密码进入你们的空间">
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
