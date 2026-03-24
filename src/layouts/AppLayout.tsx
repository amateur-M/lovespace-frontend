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
        { key: '/timeline', label: <Link to="/timeline">时间轴</Link> },
        { key: '/album', label: <Link to="/album">相册</Link> },
        { key: '/chat', label: <Link to="/chat">私密消息</Link> },
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
    <Layout className="min-h-screen bg-rose-50">
      <Header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b border-rose-200/90 bg-white/95 px-4 backdrop-blur-md sm:gap-4 sm:px-5">
        <Link to="/" className="shrink-0">
          <Typography.Text className="!m-0 !text-sm !font-semibold !tracking-wide !text-orange-950">
            LoveSpace
          </Typography.Text>
        </Link>
        <Menu
          mode="horizontal"
          selectedKeys={selectedKeys}
          items={menuItems}
          className="min-w-0 flex-1 border-0 bg-transparent !leading-normal [&_.ant-menu-item]:!rounded-lg [&_.ant-menu-item]:after:!border-none"
        />
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <button
            type="button"
            className="flex cursor-pointer select-none items-center rounded-full border border-rose-200/90 bg-white p-0.5 transition-colors duration-200 hover:border-rose-300"
            aria-label="用户菜单"
          >
            <Avatar size={32} src={user?.avatarUrl ?? undefined}>
              {user?.username?.slice(0, 1)?.toUpperCase() ?? 'U'}
            </Avatar>
          </button>
        </Dropdown>
      </Header>
      <Content className="px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </Content>
      <Footer className="border-t border-rose-200/80 bg-white py-8 text-center text-sm text-rose-800/65">
        LoveSpace © {new Date().getFullYear()}
      </Footer>
    </Layout>
  )
}
