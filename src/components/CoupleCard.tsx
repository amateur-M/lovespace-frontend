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

function statusMeta(status: number): { color: string; label: string } {
  switch (status) {
    case 1:
      return { color: 'success', label: '交往中' }
    case 2:
      return { color: 'warning', label: '已冻结' }
    default:
      return { color: 'default', label: `状态 ${status}` }
  }
}

/**
 * 情侣信息卡片：双方头像与昵称，以及绑定状态标签。
 */
export default function CoupleCard({ me, partner, status, className }: CoupleCardProps) {
  const meta = statusMeta(status)

  return (
    <Card className={className} styles={{ body: { padding: 24 } }}>
      <div className="mb-4 flex justify-center">
        <Tag color={meta.color}>{meta.label}</Tag>
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
          <Typography.Text type="secondary" className="text-2xl">
            ♥
          </Typography.Text>
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
