import { Button, Input, Modal, Space, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import {
  deleteAdminTimelineRecord,
  fetchAdminTimelineRecords,
  type AdminTimelineRecord,
} from '../../services/admin/timeline'

export default function AdminTimeline() {
  const [coupleId, setCoupleId] = useState('')
  const [userId, setUserId] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<AdminTimelineRecord[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetchAdminTimelineRecords({
        coupleId: coupleId || undefined,
        userId: userId || undefined,
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
  }, [coupleId, userId, page, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  const onDelete = (record: AdminTimelineRecord) => {
    Modal.confirm({
      title: '删除时间轴记录',
      content: '确定删除该记录？关联评论与点赞将一并删除。',
      okType: 'danger',
      onOk: async () => {
        const resp = await deleteAdminTimelineRecord(record.id)
        if (resp.code !== 0) {
          message.error(resp.message)
          return
        }
        message.success('已删除')
        void load()
      },
    })
  }

  const columns: ColumnsType<AdminTimelineRecord> = [
    { title: '日期', dataIndex: 'recordDate', width: 110 },
    { title: '作者', dataIndex: 'authorId', ellipsis: true, width: 120 },
    { title: '情侣 ID', dataIndex: 'coupleId', ellipsis: true, width: 120 },
    { title: '心情', dataIndex: 'mood', width: 80 },
    { title: '内容', dataIndex: 'content', ellipsis: true },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button size="small" danger onClick={() => onDelete(record)}>
          删除
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-stone-800">时间轴管理</h1>
        <Space>
          <Input
            placeholder="情侣 ID"
            allowClear
            value={coupleId}
            onChange={(e) => setCoupleId(e.target.value)}
            onPressEnter={() => {
              setPage(1)
              void load()
            }}
            style={{ width: 160 }}
          />
          <Input.Search
            placeholder="作者 ID"
            allowClear
            onSearch={(v) => {
              setPage(1)
              setUserId(v)
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
      />
    </div>
  )
}
