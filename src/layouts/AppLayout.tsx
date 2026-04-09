import {
  CalendarOutlined,
  CarryOutOutlined,
  HeartOutlined,
  HomeOutlined,
  LineChartOutlined,
  MessageOutlined,
  PictureOutlined,
} from '@ant-design/icons'
import { Avatar, Dropdown, Layout, Typography, message } from 'antd'
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const { Header, Content, Footer } = Layout

type NavItem = { to: string; label: string; icon: React.ReactNode }

const authedNavItems: NavItem[] = [
  { to: '/couple', label: '情侣首页', icon: <HeartOutlined aria-hidden /> },
  { to: '/timeline', label: '时间轴', icon: <CalendarOutlined aria-hidden /> },
  { to: '/album', label: '相册', icon: <PictureOutlined aria-hidden /> },
  { to: '/chat', label: '私密消息', icon: <MessageOutlined aria-hidden /> },
  { to: '/plan', label: '共同计划', icon: <CarryOutOutlined aria-hidden /> },
  { to: '/emotion', label: '情感洞察', icon: <LineChartOutlined aria-hidden /> },
]

const guestNavItems: NavItem[] = [{ to: '/', label: '首页', icon: <HomeOutlined aria-hidden /> }]

function NavPill({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        [
          'flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-sm font-medium transition-colors duration-200 sm:px-3',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500',
          isActive
            ? 'bg-rose-100/95 text-rose-950 shadow-sm ring-1 ring-rose-200/80'
            : 'text-stone-600 hover:bg-rose-50/90 hover:text-rose-900',
        ].join(' ')
      }
    >
      <span className="flex shrink-0 text-[15px] text-rose-600 [&_.anticon]:align-[-0.125em]">{item.icon}</span>
      <span className="hidden min-[400px]:inline">{item.label}</span>
    </NavLink>
  )
}

export default function AppLayout() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const hydrate = useAuthStore((s) => s.hydrate)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)
  const logout = useAuthStore((s) => s.logout)

  const navItems = isAuthed ? authedNavItems : guestNavItems

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
      <Header className="sticky top-0 z-50 h-auto border-0 bg-transparent leading-normal shadow-none">
        {/* ui-ux-pro-max：顶栏与视口边缘留白，悬浮式圆角容器 */}
        <div className="px-3 pt-3 sm:px-4 sm:pt-4">
          <div className="mx-auto flex max-w-6xl items-center gap-2 rounded-2xl border border-rose-200/90 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur-md sm:gap-3 sm:px-3 sm:py-2">
            <Link
              to="/couple"
              className="group flex shrink-0 cursor-pointer items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 sm:pr-3"
              aria-label="LoveSpace 首页"
            >
              <img
                src="/lovespace-logo-four.svg"
                width={36}
                height={36}
                className="size-8 shrink-0 sm:size-9"
                alt=""
                decoding="async"
              />
              <div className="hidden flex-col leading-tight sm:flex">
                <Typography.Text className="!m-0 !text-sm !font-semibold !tracking-tight !text-rose-950">
                  LoveSpace
                </Typography.Text>
                <span className="text-[10px] font-medium text-rose-600/80">两个人的小宇宙</span>
              </div>
            </Link>

            <nav
              className="ls-nav-scroll flex min-w-0 flex-1 items-center justify-end gap-0.5 sm:justify-center sm:gap-1"
              aria-label="主导航"
            >
              {navItems.map((item) => (
                <NavPill key={item.to} item={item} />
              ))}
            </nav>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <button
                type="button"
                className="flex shrink-0 cursor-pointer select-none items-center rounded-full border border-rose-200/90 bg-white p-0.5 transition-colors duration-200 hover:border-rose-300 hover:shadow-sm"
                aria-label="用户菜单"
              >
                <Avatar size={34} src={user?.avatarUrl ?? undefined}>
                  {user?.username?.slice(0, 1)?.toUpperCase() ?? 'U'}
                </Avatar>
              </button>
            </Dropdown>
          </div>
        </div>
      </Header>
      <Content className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </Content>
      <Footer className="border-t border-rose-200/80 bg-white py-8 text-center text-sm text-rose-800/65">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
          <img src="/lovespace-logo-four.svg" width={28} height={28} className="opacity-90" alt="" aria-hidden />
          <span>LoveSpace © {new Date().getFullYear()}</span>
        </div>
      </Footer>
    </Layout>
  )
}
