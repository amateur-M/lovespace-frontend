import { Button, Input, Modal, Space, Table, Tabs, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import {
  deleteAdminLoveQaDocument,
  fetchAdminLoveQaConversations,
  fetchAdminLoveQaDocuments,
  type AdminLoveQaConversation,
  type AdminLoveQaDocument,
} from '../../services/admin/loveQa'

export default function AdminLoveQA() {
  const [scope, setScope] = useState('')
  const [coupleId, setCoupleId] = useState('')
  const [docPage, setDocPage] = useState(1)
  const [convPage, setConvPage] = useState(1)
  const [pageSize] = useState(10)
  const [documents, setDocuments] = useState<AdminLoveQaDocument[]>([])
  const [conversations, setConversations] = useState<AdminLoveQaConversation[]>([])
  const [docTotal, setDocTotal] = useState(0)
  const [convTotal, setConvTotal] = useState(0)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(false)

  const loadDocs = useCallback(async () => {
    setLoadingDocs(true)
    try {
      const resp = await fetchAdminLoveQaDocuments({
        scope: scope || undefined,
        coupleId: coupleId || undefined,
        page: docPage,
        pageSize,
      })
      if (resp.code !== 0) throw new Error(resp.message)
      setDocuments(resp.data.records)
      setDocTotal(resp.data.total)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载文档失败')
    } finally {
      setLoadingDocs(false)
    }
  }, [scope, coupleId, docPage, pageSize])

  const loadConvs = useCallback(async () => {
    setLoadingConvs(true)
    try {
      const resp = await fetchAdminLoveQaConversations({ page: convPage, pageSize })
      if (resp.code !== 0) throw new Error(resp.message)
      setConversations(resp.data.records)
      setConvTotal(resp.data.total)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载会话失败')
    } finally {
      setLoadingConvs(false)
    }
  }, [convPage, pageSize])

  useEffect(() => {
    void loadDocs()
  }, [loadDocs])

  useEffect(() => {
    void loadConvs()
  }, [loadConvs])

  const docColumns: ColumnsType<AdminLoveQaDocument> = [
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '范围', dataIndex: 'scope', width: 90 },
    { title: '状态', dataIndex: 'status', width: 90 },
    { title: '分片数', dataIndex: 'chunkCount', width: 80 },
    { title: '情侣 ID', dataIndex: 'coupleId', ellipsis: true },
    { title: '文档 ID', dataIndex: 'documentId', ellipsis: true },
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
              title: '删除知识库文档',
              content: '将同时删除 Milvus 向量，确定继续？',
              okType: 'danger',
              onOk: async () => {
                const resp = await deleteAdminLoveQaDocument(record.documentId)
                if (resp.code !== 0) {
                  message.error(resp.message)
                  return
                }
                message.success('已删除')
                void loadDocs()
              },
            })
          }
        >
          删除
        </Button>
      ),
    },
  ]

  const convColumns: ColumnsType<AdminLoveQaConversation> = [
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '用户 ID', dataIndex: 'userId', ellipsis: true },
    { title: '情侣 ID', dataIndex: 'coupleId', ellipsis: true },
    { title: '会话 ID', dataIndex: 'conversationId', ellipsis: true },
    { title: '更新时间', dataIndex: 'updatedAt', width: 170 },
  ]

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-stone-800">恋爱问答</h1>
      <Tabs
        items={[
          {
            key: 'documents',
            label: '知识库文档',
            children: (
              <>
                <Space className="mb-3">
                  <Input.Search
                    placeholder="scope (COUPLE/GLOBAL)"
                    allowClear
                    onSearch={(v) => {
                      setDocPage(1)
                      setScope(v)
                    }}
                    style={{ width: 180 }}
                  />
                  <Input.Search
                    placeholder="情侣 ID"
                    allowClear
                    onSearch={(v) => {
                      setDocPage(1)
                      setCoupleId(v)
                    }}
                    style={{ width: 180 }}
                  />
                </Space>
                <Table
                  rowKey="documentId"
                  columns={docColumns}
                  dataSource={documents}
                  loading={loadingDocs}
                  pagination={{
                    current: docPage,
                    pageSize,
                    total: docTotal,
                    onChange: setDocPage,
                  }}
                />
              </>
            ),
          },
          {
            key: 'conversations',
            label: '会话审计',
            children: (
              <Table
                rowKey="conversationId"
                columns={convColumns}
                dataSource={conversations}
                loading={loadingConvs}
                pagination={{
                  current: convPage,
                  pageSize,
                  total: convTotal,
                  onChange: setConvPage,
                }}
              />
            ),
          },
        ]}
      />
    </div>
  )
}
