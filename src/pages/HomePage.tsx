import { Button, Card, Descriptions, Space, Typography } from 'antd'
import { Link } from 'react-router-dom'
import EChartsDemo from '../components/EChartsDemo'
import { useAuthStore } from '../stores/authStore'

export default function HomePage() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const user = useAuthStore((s) => s.user)

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Card>
        <Typography.Title level={3} className="!m-0">
          首页
        </Typography.Title>
        <Typography.Paragraph className="!mb-0">
          React + TypeScript + Vite + Ant Design + TailwindCSS 已就绪。
        </Typography.Paragraph>
      </Card>

      <Card
        title="当前登录用户"
        extra={
          !isAuthed ? (
            <Space>
              <Button type="primary">
                <Link to="/login">去登录</Link>
              </Button>
              <Button>
                <Link to="/register">去注册</Link>
              </Button>
            </Space>
          ) : null
        }
      >
        {isAuthed ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="用户ID">{user?.id}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Typography.Text type="secondary">未登录</Typography.Text>
        )}
      </Card>
      <EChartsDemo />
    </Space>
  )
}
