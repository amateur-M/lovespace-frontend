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
import Register from './pages/Register'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <ConfigProvider theme={lovespaceTheme} locale={zhCN}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/couple" element={<CoupleHome />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/album" element={<Album />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ConfigProvider>
  )
}

export default App
