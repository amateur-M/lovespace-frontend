import { Button, Result } from 'antd'
import { Link } from 'react-router-dom'

export default function AdminForbidden() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Result
        status="403"
        title="无管理权限"
        subTitle="当前账号不是管理员，无法访问后台。"
        extra={[
          <Button type="primary" key="home">
            <Link to="/">返回首页</Link>
          </Button>,
          <Button key="login">
            <Link to="/admin/login">管理员登录</Link>
          </Button>,
        ]}
      />
    </div>
  )
}
