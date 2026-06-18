import { Button, Input, Modal, Space, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import {
  deleteAdminMessage,
  fetchAdminMessages,
  type AdminMessage,
} from '../../services/admin/messages'

export default function AdminMessages() {
  const [coupleId, setCoupleId] = useState('')
  const [senderId, setSenderId] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<AdminMessage[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetchAdminMessages({
        coupleId: coupleId || undefined,
        senderId: senderId || undefined,
        page,
        pageSize,
      })
      if (resp.code !== 0) throw new Error(resp.message)
      setRows(resp.data.records)
      setTotal(resp.data.total)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [coupleId, senderId, page, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  const columns: ColumnsType<AdminMessage> = [
    { title: '情侣 ID', dataIndex: 'coupleId', ellipsis: true, width: 120 },
    { title: '发送者', dataIndex: 'senderId', ellipsis: true, width: 120 },
    { title: '接收者', dataIndex: 'receiverId', ellipsis: true, width: 120 },
    { title: '类型', dataIndex: 'messageType', width: 80 },
    { title: '内容', dataIndex: 'content', ellipsis: true },
    { title: '时间', dataIndex: 'createdAt', width: 170 },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          size="small"
          danger
          onClick={() =>
            Modal.confirm({
              title: '删除消息',
              okType: 'danger',
              onOk: async () => {
                const resp = await deleteAdminMessage(record.id)
                if (resp.code !== 0) {
                  message.error(resp.message)
                  return
                }
                message.success('已删除')
                void load()
              },
            })
          }
        >
          删除
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-stone-800">私信审计</h1>
        <Space>
          <Input.Search
            placeholder="情侣 ID"
            allowClear
            onSearch={(v) => {
              setPage(1)
              setCoupleId(v)
            }}
            style={{ width: 160 }}
          />
          <Input.Search
            placeholder="发送者 ID"
            allowClear
            onSearch={(v) => {
              setPage(1)
              setSenderId(v)
            }}
            style={{ width: 160 }}
          />
        </Space>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{ current: page, pageSize, total, onChange: setPage }}
        scroll={{ x: 1000 }}
      />
    </div>
  )
}
