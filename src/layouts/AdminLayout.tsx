import {
  DashboardOutlined,
  HeartOutlined,
  MessageOutlined,
  PictureOutlined,
  QuestionCircleOutlined,
  ScheduleOutlined,
  StarOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Layout, Menu, Typography } from 'antd'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: <Link to="/admin">仪表盘</Link> },
  { key: '/admin/users', icon: <UserOutlined />, label: <Link to="/admin/users">用户</Link> },
  { key: '/admin/couples', icon: <TeamOutlined />, label: <Link to="/admin/couples">情侣</Link> },
  {
    key: '/admin/timeline',
    icon: <ScheduleOutlined />,
    label: <Link to="/admin/timeline">时间轴</Link>,
  },
  { key: '/admin/albums', icon: <PictureOutlined />, label: <Link to="/admin/albums">相册</Link> },
  { key: '/admin/messages', icon: <MessageOutlined />, label: <Link to="/admin/messages">私信</Link> },
  { key: '/admin/plans', icon: <StarOutlined />, label: <Link to="/admin/plans">计划</Link> },
  {
    key: '/admin/memorial-days',
    icon: <HeartOutlined />,
    label: <Link to="/admin/memorial-days">纪念日</Link>,
  },
  {
    key: '/admin/love-qa',
    icon: <QuestionCircleOutlined />,
    label: <Link to="/admin/love-qa">恋爱问答</Link>,
  },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const selectedKey =
    menuItems
      .map((m) => m.key)
      .filter((k) => location.pathname === k || location.pathname.startsWith(`${k}/`))
      .sort((a, b) => b.length - a.length)[0] ?? '/admin'

  const onLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <Layout className="min-h-screen">
      <Sider breakpoint="lg" collapsedWidth={64} theme="light" className="!border-r !border-stone-200">
        <div className="px-4 py-5">
          <Typography.Title level={5} className="!mb-0 !text-stone-800">
            LoveSpace 管理
          </Typography.Title>
        </div>
        <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} />
      </Sider>
      <Layout>
        <Header className="flex items-center justify-between !bg-white !px-6 !border-b !border-stone-200">
          <Typography.Text type="secondary">后台管理系统</Typography.Text>
          <div className="flex items-center gap-3">
            <Typography.Text>{user?.username ?? user?.phone}</Typography.Text>
            <Button type="link" onClick={() => navigate('/')}>
              返回 C 端
            </Button>
            <Button onClick={onLogout}>退出</Button>
          </div>
        </Header>
        <Content className="bg-stone-50 p-6">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
