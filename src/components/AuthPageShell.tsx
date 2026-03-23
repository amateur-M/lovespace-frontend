import { Typography } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AuthPageShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

/** 登录/注册页共用极简顶栏与背景（仅布局，不涉及接口）。 */
export default function AuthPageShell({ title, subtitle, children }: AuthPageShellProps) {
  return (
    <div className="ls-auth-root min-h-screen bg-gradient-to-b from-rose-50 to-orange-50/40 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-10 text-center">
          <Link
            to="/"
            className="text-sm font-semibold tracking-wide text-rose-800 transition-colors duration-200 hover:text-rose-950"
          >
            LoveSpace
          </Link>
        </div>
        <Typography.Title level={3} className="!mb-2 !mt-0 text-center !font-semibold !tracking-tight !text-orange-950">
          {title}
        </Typography.Title>
        {subtitle ? (
          <Typography.Paragraph className="!mb-10 text-center !text-sm !leading-relaxed !text-rose-800/70">
            {subtitle}
          </Typography.Paragraph>
        ) : (
          <div className="mb-10" />
        )}
        {children}
      </div>
    </div>
  )
}
