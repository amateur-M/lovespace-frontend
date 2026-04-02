import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Modal,
  Popconfirm,
  Space,
  Typography,
  Input,
  message,
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import CoupleCard from '../components/CoupleCard'
import DaysCounter from '../components/DaysCounter'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'

export default function CoupleHome() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const user = useAuthStore((s) => s.user)

  const info = useCoupleStore((s) => s.info)
  const loading = useCoupleStore((s) => s.loading)
  const fetchCoupleInfo = useCoupleStore((s) => s.fetchCoupleInfo)
  const invite = useCoupleStore((s) => s.invite)
  const accept = useCoupleStore((s) => s.accept)
  const updateStartDate = useCoupleStore((s) => s.updateStartDate)
  const separate = useCoupleStore((s) => s.separate)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [inviteeId, setInviteeId] = useState('')
  const [acceptBindingId, setAcceptBindingId] = useState('')
  const [acceptStartDate, setAcceptStartDate] = useState<dayjs.Dayjs | null>(null)
  const [dateOpen, setDateOpen] = useState(false)
  const [pendingDate, setPendingDate] = useState<dayjs.Dayjs | null>(null)

  useEffect(() => {
    if (!isAuthed) return
    fetchCoupleInfo().catch(() => undefined)
  }, [isAuthed, fetchCoupleInfo])

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  const isBound = Boolean(info)

  const openEditDate = () => {
    setPendingDate(info?.startDate ? dayjs(info.startDate) : dayjs())
    setDateOpen(true)
  }

  const submitStartDate = async () => {
    if (!pendingDate) {
      message.warning('请选择恋爱开始日')
      return
    }
    try {
      await updateStartDate(pendingDate.format('YYYY-MM-DD'))
      message.success('恋爱开始日已更新')
      setDateOpen(false)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '更新失败')
    }
  }

  const submitInvite = async () => {
    const id = inviteeId.trim()
    if (!id) {
      message.warning('请输入对方的用户 ID')
      return
    }
    try {
      const bindingId = await invite(id)
      message.success(`邀请已发送，绑定 ID：${bindingId}（请让对方在「接受邀请」中填写）`)
      setInviteOpen(false)
      setInviteeId('')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '邀请失败')
    }
  }

  const submitAccept = async () => {
    const bid = acceptBindingId.trim()
    if (!bid) {
      message.warning('请输入绑定 ID')
      return
    }
    try {
      await accept(bid, acceptStartDate ? acceptStartDate.format('YYYY-MM-DD') : null)
      message.success('已绑定情侣')
      setAcceptOpen(false)
      setAcceptBindingId('')
      setAcceptStartDate(null)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '接受失败')
    }
  }

  const onSeparate = async () => {
    try {
      await separate()
      message.success('已解除情侣关系')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '操作失败')
    }
  }

  return (
    <div className="w-full space-y-6">
      {!isBound && (
        <Card className="ls-surface mx-auto max-w-lg !shadow-sm" loading={loading}>
          <Empty
            description="暂未绑定情侣"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Space wrap className="justify-center">
              <Button type="primary" size="large" onClick={() => setInviteOpen(true)}>
                邀请 TA
              </Button>
              <Button size="large" onClick={() => setAcceptOpen(true)}>
                接受邀请
              </Button>
            </Space>
          </Empty>
          <Typography.Paragraph className="!mb-0 !mt-4 text-center text-sm text-rose-800/70">
            需要对方的用户 ID（可在个人资料或首页查看）。发送邀请后，请让对方在「接受邀请」中填写绑定 ID。
          </Typography.Paragraph>
        </Card>
      )}

      {isBound && info && (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <CoupleCard me={user} partner={info.partner} status={info.status} className="!h-full" />
          <Card className="ls-surface !flex !h-full !flex-col !shadow-sm">
            <Space direction="vertical" size={16} className="w-full flex-1">
              <DaysCounter days={info.relationshipDays} />
              <Descriptions column={1} size="small" bordered className="flex-1">
                <Descriptions.Item label="恋爱开始日">
                  <Space wrap>
                    <span>{info.startDate ?? '—'}</span>
                    <Button type="link" className="!p-0" onClick={openEditDate}>
                      设置 / 编辑
                    </Button>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="绑定状态">
                  {info.status === 1 ? '交往中' : info.status === 2 ? '已冻结' : `状态码 ${info.status}`}
                </Descriptions.Item>
              </Descriptions>
              <Popconfirm
                title="确定要解除情侣关系吗？"
                okText="确定"
                cancelText="取消"
                onConfirm={onSeparate}
              >
                <Button danger className="w-full sm:w-auto">
                  解除关系
                </Button>
              </Popconfirm>
            </Space>
          </Card>
        </div>
      )}

      <Modal
        title="邀请 TA"
        open={inviteOpen}
        onOk={submitInvite}
        onCancel={() => setInviteOpen(false)}
        okText="发送邀请"
        destroyOnClose
      >
        <Typography.Paragraph type="secondary" className="text-sm">
          请输入对方的用户 ID（UUID）
        </Typography.Paragraph>
        <Input
          placeholder="inviteeUserId"
          value={inviteeId}
          onChange={(e) => setInviteeId(e.target.value)}
        />
      </Modal>

      <Modal
        title="接受邀请"
        open={acceptOpen}
        onOk={submitAccept}
        onCancel={() => setAcceptOpen(false)}
        okText="确认绑定"
        destroyOnClose
      >
        <Typography.Paragraph type="secondary" className="text-sm">
          输入对方发送的绑定 ID；可选指定恋爱开始日，留空则默认今天。
        </Typography.Paragraph>
        <Space direction="vertical" className="w-full" size={12}>
          <Input
            placeholder="bindingId"
            value={acceptBindingId}
            onChange={(e) => setAcceptBindingId(e.target.value)}
          />
          <DatePicker
            className="w-full"
            placeholder="恋爱开始日（可选）"
            value={acceptStartDate}
            onChange={(d) => setAcceptStartDate(d)}
          />
        </Space>
      </Modal>

      <Modal
        title="恋爱开始日"
        open={dateOpen}
        onOk={submitStartDate}
        onCancel={() => setDateOpen(false)}
        okText="保存"
        destroyOnClose
      >
        <DatePicker className="w-full" value={pendingDate} onChange={(d) => setPendingDate(d)} />
      </Modal>
    </div>
  )
}
