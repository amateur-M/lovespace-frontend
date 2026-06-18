import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuthStore } from '../stores/authStore'
import { isAdminUser } from '../utils/adminRole'

/** 管理端路由守卫：需登录且 role=ADMIN。 */
export default function AdminRoute() {
  const location = useLocation()
  const authHydrated = useAuthStore((s) => s.authHydrated)
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const user = useAuthStore((s) => s.user)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)

  useEffect(() => {
    if (authHydrated && isAuthed && !user) {
      void fetchProfile().catch(() => {
        useAuthStore.getState().logout()
      })
    }
  }, [authHydrated, isAuthed, user, fetchProfile])

  if (!authHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!isAuthed) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  if (!isAdminUser(user?.role)) {
    return <Navigate to="/admin/forbidden" replace />
  }

  return <Outlet />
}
