import { Button, Card, Descriptions, Space, Typography } from 'antd'
import { Link } from 'react-router-dom'
import EChartsDemo from '../components/EChartsDemo'
import { useAuthStore } from '../stores/authStore'

export default function HomePage() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const user = useAuthStore((s) => s.user)

  return (
    <Space direction="vertical" size={20} className="w-full">
      <Card className="ls-surface !shadow-sm">
        <Typography.Title level={3} className="!m-0 !font-semibold !tracking-tight !text-orange-950">
          首页
        </Typography.Title>
        <Typography.Paragraph className="ls-page-intro !mb-0 !mt-2">
          记录日常、时间轴与相册；界面保持简洁，让内容成为焦点。
        </Typography.Paragraph>
      </Card>

      <Card
        className="ls-surface !shadow-sm"
        title={<span className="font-medium text-orange-950">当前登录用户</span>}
        extra={
          !isAuthed ? (
            <Space>
              <Button type="primary">
                <Link to="/login" className="text-inherit">
                  去登录
                </Link>
              </Button>
              <Button>
                <Link to="/register" className="text-inherit">
                  去注册
                </Link>
              </Button>
            </Space>
          ) : null
        }
      >
        {isAuthed ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="手机号">{user?.phone}</Descriptions.Item>
            <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{user?.email ?? '—'}</Descriptions.Item>
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
