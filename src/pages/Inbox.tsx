import { HeartOutlined, InboxOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, DatePicker, Empty, List, Modal, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import type { CouplePendingInvite } from '../services/couple'
import { listPendingInvites } from '../services/couple'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'
import { useInboxStore } from '../stores/inboxStore'

const { Paragraph, Text } = Typography

export default function Inbox() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const accept = useCoupleStore((s) => s.accept)
  const fetchCoupleInfo = useCoupleStore((s) => s.fetchCoupleInfo)
  const refreshPendingCount = useInboxStore((s) => s.refreshPendingCount)

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<CouplePendingInvite[]>([])
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [activeInvite, setActiveInvite] = useState<CouplePendingInvite | null>(null)
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await listPendingInvites()
      if (resp.code === 0 && resp.data) {
        setItems(resp.data)
      } else {
        throw new Error(resp.message || '加载失败')
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthed) return
    void load()
    void refreshPendingCount()
  }, [isAuthed, load, refreshPendingCount])

  const openAccept = (inv: CouplePendingInvite) => {
    setActiveInvite(inv)
    setStartDate(null)
    setAcceptOpen(true)
  }

  const submitAccept = async () => {
    if (!activeInvite) return
    setSubmitting(true)
    try {
      await accept(activeInvite.bindingId, startDate ? startDate.format('YYYY-MM-DD') : null)
      message.success('已成功绑定情侣')
      setAcceptOpen(false)
      setActiveInvite(null)
      await fetchCoupleInfo()
      await load()
      await refreshPendingCount()
    } catch (e) {
      message.error(e instanceof Error ? e.message : '接受失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="w-full space-y-6 pb-4">
      <section className="ls-page-intro space-y-2">
        <div className="inline-flex items-center gap-2 text-rose-600">
          <InboxOutlined className="text-lg" aria-hidden />
          <Text className="!m-0 text-xs font-semibold uppercase tracking-wide text-rose-800/70">消息</Text>
        </div>
        <Typography.Title level={2} className="!m-0 !text-2xl !font-semibold !text-stone-900 sm:!text-3xl">
          待处理邀请
        </Typography.Title>
        <Paragraph className="!mb-0 max-w-xl text-[15px] text-rose-900/75">
          有人向你发出情侣邀请时，会出现在这里。点击「接受邀请」即可绑定，无需再输入绑定 ID。
        </Paragraph>
      </section>

      <Card className="ls-surface !shadow-sm" loading={loading}>
        {!loading && items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无待处理消息"
            className="py-6"
          >
            <Link
              to="/couple"
              className="ls-link text-sm font-medium text-rose-700 hover:text-rose-900"
            >
              返回情侣首页
            </Link>
          </Empty>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={items}
            renderItem={(inv) => (
              <List.Item
                className="!px-0 !py-4 first:!pt-0"
                actions={[
                  <Button key="accept" type="primary" onClick={() => openAccept(inv)}>
                    接受邀请
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar size={48} src={inv.inviter.avatarUrl ?? undefined} className="shrink-0">
                      {inv.inviter.username?.slice(0, 1)?.toUpperCase() ?? '?'}
                    </Avatar>
                  }
                  title={
                    <span className="text-base font-medium text-stone-900">{inv.inviter.username}</span>
                  }
                  description={
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-rose-900/80">
                        <HeartOutlined className="text-rose-500" aria-hidden />
                        <span>邀请你成为情侣</span>
                      </div>
                      <Text type="secondary" className="text-xs">
                        {inv.invitedAt
                          ? dayjs(inv.invitedAt).format('YYYY-MM-DD HH:mm')
                          : '—'}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title="接受情侣邀请"
        open={acceptOpen}
        okText="确认绑定"
        cancelText="取消"
        confirmLoading={submitting}
        onOk={submitAccept}
        onCancel={() => {
          setAcceptOpen(false)
          setActiveInvite(null)
        }}
        destroyOnClose
      >
        <Paragraph type="secondary" className="text-sm">
          与 <strong>{activeInvite?.inviter.username}</strong> 绑定后，即可使用时间轴、相册等功能。可选指定恋爱开始日，留空则默认今天。
        </Paragraph>
        <DatePicker
          className="w-full"
          placeholder="恋爱开始日（可选）"
          value={startDate}
          onChange={(d) => setStartDate(d)}
        />
      </Modal>
    </div>
  )
}
