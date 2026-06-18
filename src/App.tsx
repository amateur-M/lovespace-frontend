import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { Route, Routes } from 'react-router-dom'
import { lovespaceTheme } from './theme/antdTheme'
import AppLayout from './layouts/AppLayout'
import CoupleHome from './pages/CoupleHome'
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Timeline from './pages/Timeline'
import Album from './pages/Album'
import Chat from './pages/Chat'
import Plan from './pages/Plan'
import EmotionAnalysis from './pages/EmotionAnalysis'
import AILoveLetter from './pages/AILoveLetter'
import AILoveQA from './pages/AILoveQA'
import Memorial from './pages/Memorial'
import Inbox from './pages/Inbox'
import Register from './pages/Register'
import NotFoundPage from './pages/NotFoundPage'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './layouts/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminForbidden from './pages/admin/AdminForbidden'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminCouples from './pages/admin/AdminCouples'
import AdminTimeline from './pages/admin/AdminTimeline'
import AdminAlbums from './pages/admin/AdminAlbums'
import AdminMessages from './pages/admin/AdminMessages'
import AdminPlans from './pages/admin/AdminPlans'
import AdminMemorialDays from './pages/admin/AdminMemorialDays'
import AdminLoveQA from './pages/admin/AdminLoveQA'

function App() {
  return (
    <ConfigProvider theme={lovespaceTheme} locale={zhCN} getPopupContainer={() => document.body}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/forbidden" element={<AdminForbidden />} />
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="couples" element={<AdminCouples />} />
            <Route path="timeline" element={<AdminTimeline />} />
            <Route path="albums" element={<AdminAlbums />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="memorial-days" element={<AdminMemorialDays />} />
            <Route path="love-qa" element={<AdminLoveQA />} />
          </Route>
        </Route>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/couple" element={<CoupleHome />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/album" element={<Album />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/memorial" element={<Memorial />} />
          <Route path="/emotion" element={<EmotionAnalysis />} />
          <Route path="/love-letter" element={<AILoveLetter />} />
          <Route path="/love-qa" element={<AILoveQA />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ConfigProvider>
  )
}

export default App
