import { HeartOutlined } from '@ant-design/icons'
import { Avatar, Card, Space, Tag, Typography } from 'antd'
import type { User } from '../services/auth'

type CoupleCardProps = {
  /** 当前登录用户 */
  me: User | null
  /** 情侣对方 */
  partner: User | null
  /** 绑定状态：1 交往 2 冻结（与后端 couple_binding.status 一致） */
  status: number
  className?: string
}

function statusMeta(status: number): { className: string; label: string } {
  switch (status) {
    case 1:
      return { className: 'border border-emerald-200 bg-emerald-50 text-emerald-800', label: '交往中' }
    case 2:
      return { className: 'border border-amber-200 bg-amber-50 text-amber-900', label: '已冻结' }
    default:
      return { className: 'border border-rose-200 bg-rose-100 text-rose-900', label: `状态 ${status}` }
  }
}

/**
 * 情侣信息卡片：双方头像与昵称，以及绑定状态标签。
 */
export default function CoupleCard({ me, partner, status, className }: CoupleCardProps) {
  const meta = statusMeta(status)

  return (
    <Card className={`ls-surface !shadow-sm ${className ?? ''}`} styles={{ body: { padding: 24 } }}>
      <div className="mb-4 flex justify-center">
        <Tag bordered={false} className={`!m-0 !rounded-full !px-3 !py-0.5 !text-xs !font-medium ${meta.className}`}>
          {meta.label}
        </Tag>
      </div>
      <Space size={32} align="start" className="w-full justify-center" wrap>
        <Space direction="vertical" align="center" size={8}>
          <Avatar size={80} src={me?.avatarUrl ?? undefined}>
            {me?.username?.slice(0, 1)?.toUpperCase() ?? '我'}
          </Avatar>
          <Typography.Text strong>{me?.username ?? '我'}</Typography.Text>
          <Typography.Text type="secondary" className="!text-xs">
            我
          </Typography.Text>
        </Space>

        <div className="flex flex-col items-center justify-center pt-6">
          <HeartOutlined className="text-2xl text-rose-300" aria-hidden />
        </div>

        <Space direction="vertical" align="center" size={8}>
          <Avatar size={80} src={partner?.avatarUrl ?? undefined}>
            {partner?.username?.slice(0, 1)?.toUpperCase() ?? 'TA'}
          </Avatar>
          <Typography.Text strong>{partner?.username ?? 'TA'}</Typography.Text>
          <Typography.Text type="secondary" className="!text-xs">
            TA
          </Typography.Text>
        </Space>
      </Space>
    </Card>
  )
}
