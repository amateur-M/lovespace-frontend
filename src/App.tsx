import { ConfigProvider } from 'antd'
import { Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import CoupleHome from './pages/CoupleHome'
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Register from './pages/Register'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <ConfigProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/couple" element={<CoupleHome />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ConfigProvider>
  )
}

export default App
