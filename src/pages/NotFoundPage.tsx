import { Button, Result } from 'antd'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="ls-surface mx-auto max-w-lg py-12">
      <Result
        status="404"
        title={<span className="text-orange-950">404</span>}
        subTitle={<span className="text-rose-800/70">页面不存在</span>}
        extra={
          <Link to="/">
            <Button type="primary">返回首页</Button>
          </Link>
        }
      />
    </div>
  )
}
