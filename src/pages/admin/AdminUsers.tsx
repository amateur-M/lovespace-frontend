import { Button, Input, Modal, Space, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import type { User } from '../../services/auth'
import {
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from '../../services/admin/users'
import { ADMIN_ROLE } from '../../utils/adminRole'

export default function AdminUsers() {
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetchAdminUsers({ keyword: keyword || undefined, page, pageSize })
      if (resp.code !== 0) throw new Error(resp.message)
      setRows(resp.data.records)
      setTotal(resp.data.total)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [keyword, page, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  const onToggleStatus = (record: User) => {
    const next = record.status === 1 ? 0 : 1
    Modal.confirm({
      title: next === 1 ? '启用用户' : '禁用用户',
      content: `确定${next === 1 ? '启用' : '禁用'}用户 ${record.username}？`,
      onOk: async () => {
        const resp = await updateAdminUser(record.id, { status: next })
        if (resp.code !== 0) {
          message.error(resp.message)
          return
        }
        message.success('已更新')
        void load()
      },
    })
  }

  const onToggleRole = (record: User) => {
    const next = record.role === ADMIN_ROLE ? 0 : ADMIN_ROLE
    Modal.confirm({
      title: next === ADMIN_ROLE ? '设为管理员' : '取消管理员',
      content: `确定调整 ${record.username} 的角色？`,
      onOk: async () => {
        const resp = await updateAdminUser(record.id, { role: next })
        if (resp.code !== 0) {
          message.error(resp.message)
          return
        }
        message.success('已更新')
        void load()
      },
    })
  }

  const onDelete = (record: User) => {
    Modal.confirm({
      title: '删除用户',
      content: `确定删除用户 ${record.username}？此操作不可恢复。`,
      okType: 'danger',
      onOk: async () => {
        const resp = await deleteAdminUser(record.id)
        if (resp.code !== 0) {
          message.error(resp.message)
          return
        }
        message.success('已删除')
        void load()
      },
    })
  }

  const columns: ColumnsType<User> = [
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '邮箱', dataIndex: 'email', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: number) =>
        v === 1 ? <Tag color="green">正常</Tag> : <Tag color="red">禁用</Tag>,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      render: (v: number) =>
        v === ADMIN_ROLE ? <Tag color="blue">管理员</Tag> : <Tag>用户</Tag>,
    },
    { title: '注册时间', dataIndex: 'createdAt', width: 170 },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" onClick={() => onToggleStatus(record)}>
            {record.status === 1 ? '禁用' : '启用'}
          </Button>
          <Button size="small" onClick={() => onToggleRole(record)}>
            {record.role === ADMIN_ROLE ? '降权' : '设管'}
          </Button>
          <Button size="small" danger onClick={() => onDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-stone-800">用户管理</h1>
        <Space>
          <Input.Search
            placeholder="手机号 / 用户名"
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
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: setPage,
          showSizeChanger: false,
        }}
        scroll={{ x: 900 }}
      />
    </div>
  )
}
