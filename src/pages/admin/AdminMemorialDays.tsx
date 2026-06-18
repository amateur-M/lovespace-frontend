import { Button, Input, Modal, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import {
  deleteAdminMemorialDay,
  fetchAdminMemorialDays,
  type AdminMemorialDay,
} from '../../services/admin/memorial'

export default function AdminMemorialDays() {
  const [coupleId, setCoupleId] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<AdminMemorialDay[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetchAdminMemorialDays({
        coupleId: coupleId || undefined,
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
  }, [coupleId, page, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  const columns: ColumnsType<AdminMemorialDay> = [
    { title: '名称', dataIndex: 'name' },
    { title: '纪念日期', dataIndex: 'memorialDate', width: 120 },
    { title: '情侣 ID', dataIndex: 'coupleId', ellipsis: true },
    { title: '描述', dataIndex: 'description', ellipsis: true },
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
              title: '删除纪念日',
              okType: 'danger',
              onOk: async () => {
                const resp = await deleteAdminMemorialDay(record.id)
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
        <h1 className="text-xl font-semibold text-stone-800">纪念日管理</h1>
        <Input.Search
          placeholder="情侣 ID"
          allowClear
          onSearch={(v) => {
            setPage(1)
            setCoupleId(v)
          }}
          style={{ width: 200 }}
        />
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
