import {
  CalendarOutlined,
  CarryOutOutlined,
  HeartOutlined,
  MessageOutlined,
  PictureOutlined,
} from '@ant-design/icons'
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
import { Link, Navigate } from 'react-router-dom'
import CoupleCard from '../components/CoupleCard'
import DaysCounter from '../components/DaysCounter'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'
import { useInboxStore } from '../stores/inboxStore'

const { Paragraph, Text } = Typography

const quickLinks = [
  { to: '/timeline', label: '恋爱时间轴', icon: <CalendarOutlined aria-hidden /> },
  { to: '/album', label: '情侣相册', icon: <PictureOutlined aria-hidden /> },
  { to: '/chat', label: '私密消息', icon: <MessageOutlined aria-hidden /> },
  { to: '/plan', label: '共同计划', icon: <CarryOutOutlined aria-hidden /> },
] as const

export default function CoupleHome() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const user = useAuthStore((s) => s.user)

  const info = useCoupleStore((s) => s.info)
  const loading = useCoupleStore((s) => s.loading)
  const fetchCoupleInfo = useCoupleStore((s) => s.fetchCoupleInfo)
  const invite = useCoupleStore((s) => s.invite)
  const updateStartDate = useCoupleStore((s) => s.updateStartDate)
  const separate = useCoupleStore((s) => s.separate)
  const pendingInviteCount = useInboxStore((s) => s.pendingCount)
  const refreshPendingCount = useInboxStore((s) => s.refreshPendingCount)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteeId, setInviteeId] = useState('')
  const [dateOpen, setDateOpen] = useState(false)
  const [pendingDate, setPendingDate] = useState<dayjs.Dayjs | null>(null)

  useEffect(() => {
    if (!isAuthed) return
    fetchCoupleInfo().catch(() => undefined)
    void refreshPendingCount()
  }, [isAuthed, fetchCoupleInfo, refreshPendingCount])

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
      await invite(id)
      message.success('邀请已发送，对方可在右上角「消息」中查看并处理')
      setInviteOpen(false)
      setInviteeId('')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '邀请失败')
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
    <div className="w-full space-y-8 pb-4">
      {!isBound && (
        <>
          <section className="relative overflow-hidden rounded-3xl border border-rose-200/85 bg-gradient-to-br from-white via-rose-50/95 to-pink-50/40 px-5 py-10 shadow-sm sm:px-8 sm:py-12">
            <div className="pointer-events-none absolute -right-12 -top-10 h-40 w-40 rounded-full bg-rose-200/40 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-pink-200/35 blur-2xl" />
            <div className="relative mx-auto max-w-lg text-center">
              <div className="mb-4 inline-flex items-center justify-center gap-2 rounded-full border border-rose-200/90 bg-white/85 px-4 py-1.5 text-xs font-medium text-rose-900/85 shadow-sm">
                <HeartOutlined className="text-rose-500" aria-hidden />
                两个人的小宇宙，从这里开始
              </div>
              <Typography.Title level={2} className="!mb-2 !text-2xl !text-stone-900 sm:!text-3xl">
                绑定情侣，解锁时间轴与相册
              </Typography.Title>
              <Paragraph className="!mb-0 text-[15px] leading-relaxed text-rose-900/70">
                向 TA 发出邀请后，对方在「消息」里一键接受即可绑定，无需再传绑定码。
              </Paragraph>
            </div>
          </section>

          {pendingInviteCount > 0 && (
            <div className="mx-auto max-w-lg rounded-2xl border border-rose-300/80 bg-rose-100/50 px-4 py-3 text-center shadow-sm">
              <Text className="text-sm text-rose-950">
                你有 <strong>{pendingInviteCount}</strong> 条待处理邀请，请前往
              </Text>{' '}
              <Link to="/inbox" className="ls-link text-sm font-semibold text-rose-800 underline-offset-2">
                消息
              </Link>
              <Text className="text-sm text-rose-950"> 处理。</Text>
            </div>
          )}

          <Card className="ls-surface mx-auto max-w-lg !shadow-sm" loading={loading}>
            <Empty
              description="暂未绑定情侣"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Space wrap className="justify-center">
                <Button type="primary" size="large" onClick={() => setInviteOpen(true)}>
                  邀请 TA
                </Button>
                <Link to="/inbox">
                  <Button size="large">查看消息</Button>
                </Link>
              </Space>
            </Empty>
            <Typography.Paragraph className="!mb-0 !mt-4 text-center text-sm text-rose-800/70">
              需要对方的用户 ID（可在个人资料页查看）。若收到邀请，请打开右上角「消息」或上方入口处理。
            </Typography.Paragraph>
          </Card>
        </>
      )}

      {isBound && info && (
        <>
          <section
            className="relative overflow-hidden rounded-3xl border border-rose-200/85 bg-gradient-to-br from-white via-rose-50/90 to-amber-50/30 px-5 py-8 shadow-sm sm:px-8 sm:py-10"
            aria-labelledby="couple-hero-title"
          >
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-rose-200/35 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-amber-100/40 blur-2xl" />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/90 bg-white/80 px-3 py-1 text-xs font-medium text-rose-900/80 shadow-sm backdrop-blur-sm">
                  <HeartOutlined className="text-rose-500" aria-hidden />
                  今天也想见你
                </div>
                <Typography.Title
                  level={2}
                  id="couple-hero-title"
                  className="!mb-0 !text-2xl !font-semibold !tracking-tight !text-stone-900 sm:!text-3xl"
                >
                  {info.partner?.username
                    ? `和 ${info.partner.username} 的小世界`
                    : '我们的小世界'}
                </Typography.Title>
                <Paragraph className="!mb-0 max-w-xl text-[15px] leading-relaxed text-rose-900/75">
                  时间轴、相册与计划都在这里串联；每一天都值得被记住。
                </Paragraph>
              </div>
              <div className="flex shrink-0 gap-2 text-2xl text-rose-300/90 sm:text-3xl" aria-hidden>
                <HeartOutlined />
                <HeartOutlined className="!opacity-70" />
                <HeartOutlined className="!opacity-40" />
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
            <div className="lg:col-span-5">
              <CoupleCard me={user} partner={info.partner} status={info.status} className="!h-full" />
            </div>

            <div className="flex flex-col gap-6 lg:col-span-7">
              <Card className="ls-surface !shadow-sm">
                <Space direction="vertical" size={20} className="w-full">
                  <DaysCounter days={info.relationshipDays} />
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="恋爱开始日">
                      <Space wrap>
                        <span>{info.startDate ?? '—'}</span>
                        <Button type="link" className="!p-0" onClick={openEditDate}>
                          设置
                        </Button>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="绑定状态">
                      {info.status === 1 ? '交往中' : info.status === 2 ? '已冻结' : `状态码 ${info.status}`}
                    </Descriptions.Item>
                  </Descriptions>
                </Space>
              </Card>

              <div>
                <Text className="mb-3 block text-xs font-medium uppercase tracking-wide text-rose-800/55">
                  一起去看看
                </Text>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="group flex flex-col items-center gap-2 rounded-2xl border border-rose-200/80 bg-white/90 px-3 py-4 text-center shadow-sm transition-all duration-200 hover:border-rose-300 hover:bg-rose-50/90 hover:shadow-md"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100/90 text-lg text-rose-600 transition-colors group-hover:bg-rose-200/90">
                        {item.icon}
                      </span>
                      <span className="text-xs font-medium text-stone-700 group-hover:text-rose-950">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-rose-200/70 bg-rose-50/40 px-4 py-5 text-center sm:px-6">
            <Text type="secondary" className="block text-xs leading-relaxed text-stone-500">
              若双方决定结束当前关系，可解除绑定。解除后时间轴等数据将按服务端规则处理。
            </Text>
            <Popconfirm
              title="确定解除情侣关系？"
              description="此操作不可撤销，请与对方沟通后再操作。"
              okText="确定解除"
              cancelText="再想想"
              okButtonProps={{ danger: true }}
              onConfirm={onSeparate}
            >
              <Button type="link" size="small" className="!mt-2 !h-auto !p-0 !text-stone-400 hover:!text-rose-700">
                解除情侣关系
              </Button>
            </Popconfirm>
          </div>
        </>
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
