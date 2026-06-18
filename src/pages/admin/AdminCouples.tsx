import { Button, Input, Modal, Select, Space, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import {
  fetchAdminCouples,
  forceSeparateCouple,
  type AdminCoupleItem,
} from '../../services/admin/couples'

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '待接受', color: 'gold' },
  1: { label: '交往中', color: 'green' },
  2: { label: '冻结', color: 'blue' },
  3: { label: '已解除', color: 'default' },
}

export default function AdminCouples() {
  const [status, setStatus] = useState<number | undefined>()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<AdminCoupleItem[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetchAdminCouples({
        status,
        keyword: keyword || undefined,
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
  }, [status, keyword, page, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  const onForceSeparate = (record: AdminCoupleItem) => {
    Modal.confirm({
      title: '强制解除情侣关系',
      content: `确定解除 ${record.user1Name} 与 ${record.user2Name} 的绑定？`,
      okType: 'danger',
      onOk: async () => {
        const resp = await forceSeparateCouple(record.id)
        if (resp.code !== 0) {
          message.error(resp.message)
          return
        }
        message.success('已解除')
        void load()
      },
    })
  }

  const columns: ColumnsType<AdminCoupleItem> = [
    { title: 'ID', dataIndex: 'id', ellipsis: true, width: 120 },
    {
      title: '用户 1',
      key: 'u1',
      render: (_, r) => `${r.user1Name ?? '-'} (${r.user1Phone ?? '-'})`,
    },
    {
      title: '用户 2',
      key: 'u2',
      render: (_, r) => `${r.user2Name ?? '-'} (${r.user2Phone ?? '-'})`,
    },
    { title: '开始日', dataIndex: 'startDate', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: number) => {
        const s = STATUS_MAP[v] ?? { label: String(v), color: 'default' }
        return <Tag color={s.color}>{s.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) =>
        record.status !== 3 ? (
          <Button size="small" danger onClick={() => onForceSeparate(record)}>
            强制解除
          </Button>
        ) : null,
    },
  ]

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-stone-800">情侣管理</h1>
        <Space>
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 120 }}
            value={status}
            onChange={(v) => {
              setPage(1)
              setStatus(v)
            }}
            options={Object.entries(STATUS_MAP).map(([k, v]) => ({
              value: Number(k),
              label: v.label,
            }))}
          />
          <Input.Search
            placeholder="手机号 / 用户名 / ID"
            allowClear
            onSearch={(v) => {
              setPage(1)
              setKeyword(v)
            }}
            style={{ width: 220 }}
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
