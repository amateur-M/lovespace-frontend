import { Avatar, Dropdown, Layout, Menu, Typography, message } from 'antd'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

const { Header, Content, Footer } = Layout

const baseMenuItems = [
  {
    key: '/',
    label: <Link to="/">首页</Link>,
  },
]

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const hydrate = useAuthStore((s) => s.hydrate)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)
  const logout = useAuthStore((s) => s.logout)

  const menuItems = isAuthed
    ? [
        ...baseMenuItems,
        { key: '/couple', label: <Link to="/couple">情侣首页</Link> },
      ]
    : baseMenuItems
  const selectedKeys = menuItems.map((i) => i.key).filter((k) => location.pathname === k)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!token) return
    fetchProfile().catch(async () => {
      await logout()
      message.warning('登录状态已失效，请重新登录')
      navigate('/login', { replace: true })
    })
  }, [fetchProfile, logout, navigate, token])

  const userMenuItems = isAuthed
    ? [
        { key: 'profile', label: <Link to="/profile">个人信息</Link> },
        {
          key: 'logout',
          label: '退出登录',
          onClick: async () => {
            await logout()
            message.success('已退出登录')
            navigate('/login')
          },
        },
      ]
    : [
        { key: 'login', label: <Link to="/login">登录</Link> },
        { key: 'register', label: <Link to="/register">注册</Link> },
      ]

  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center gap-4">
        <Typography.Text className="!text-white !m-0">LoveSpace</Typography.Text>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={selectedKeys}
          items={menuItems}
          className="flex-1"
        />
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div className="cursor-pointer select-none">
            <Avatar size="small" src={user?.avatarUrl ?? undefined}>
              {user?.username?.slice(0, 1)?.toUpperCase() ?? 'U'}
            </Avatar>
          </div>
        </Dropdown>
      </Header>
      <Content className="p-6">
        <div className="mx-auto w-full max-w-5xl">
          <Outlet />
        </div>
      </Content>
      <Footer className="text-center text-gray-500">LoveSpace © {new Date().getFullYear()}</Footer>
    </Layout>
  )
}
