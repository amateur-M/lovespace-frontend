import { Button, Input, Modal, Space, Table, Tabs, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import {
  deleteAdminAlbum,
  deleteAdminPhoto,
  fetchAdminAlbums,
  fetchAdminPhotos,
  type AdminAlbum,
  type AdminPhoto,
} from '../../services/admin/albums'

export default function AdminAlbums() {
  const [coupleId, setCoupleId] = useState('')
  const [albumId, setAlbumId] = useState('')
  const [albumPage, setAlbumPage] = useState(1)
  const [photoPage, setPhotoPage] = useState(1)
  const [pageSize] = useState(10)
  const [albumTotal, setAlbumTotal] = useState(0)
  const [photoTotal, setPhotoTotal] = useState(0)
  const [albums, setAlbums] = useState<AdminAlbum[]>([])
  const [photos, setPhotos] = useState<AdminPhoto[]>([])
  const [loadingAlbums, setLoadingAlbums] = useState(false)
  const [loadingPhotos, setLoadingPhotos] = useState(false)

  const loadAlbums = useCallback(async () => {
    setLoadingAlbums(true)
    try {
      const resp = await fetchAdminAlbums({
        coupleId: coupleId || undefined,
        page: albumPage,
        pageSize,
      })
      if (resp.code !== 0) throw new Error(resp.message)
      setAlbums(resp.data.records)
      setAlbumTotal(resp.data.total)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载相册失败')
    } finally {
      setLoadingAlbums(false)
    }
  }, [coupleId, albumPage, pageSize])

  const loadPhotos = useCallback(async () => {
    setLoadingPhotos(true)
    try {
      const resp = await fetchAdminPhotos({
        albumId: albumId || undefined,
        page: photoPage,
        pageSize,
      })
      if (resp.code !== 0) throw new Error(resp.message)
      setPhotos(resp.data.records)
      setPhotoTotal(resp.data.total)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载照片失败')
    } finally {
      setLoadingPhotos(false)
    }
  }, [albumId, photoPage, pageSize])

  useEffect(() => {
    void loadAlbums()
  }, [loadAlbums])

  useEffect(() => {
    void loadPhotos()
  }, [loadPhotos])

  const albumColumns: ColumnsType<AdminAlbum> = [
    { title: '名称', dataIndex: 'name' },
    { title: '情侣 ID', dataIndex: 'coupleId', ellipsis: true },
    { title: '创建时间', dataIndex: 'createdAt', width: 170 },
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
              title: '删除相册',
              content: '将同时删除相册内所有照片，确定继续？',
              okType: 'danger',
              onOk: async () => {
                const resp = await deleteAdminAlbum(record.id)
                if (resp.code !== 0) {
                  message.error(resp.message)
                  return
                }
                message.success('已删除')
                void loadAlbums()
              },
            })
          }
        >
          删除
        </Button>
      ),
    },
  ]

  const photoColumns: ColumnsType<AdminPhoto> = [
    { title: '相册 ID', dataIndex: 'albumId', ellipsis: true },
    { title: '上传者', dataIndex: 'uploaderId', ellipsis: true },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '创建时间', dataIndex: 'createdAt', width: 170 },
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
              title: '删除照片',
              okType: 'danger',
              onOk: async () => {
                const resp = await deleteAdminPhoto(record.id)
                if (resp.code !== 0) {
                  message.error(resp.message)
                  return
                }
                message.success('已删除')
                void loadPhotos()
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
      <h1 className="mb-4 text-xl font-semibold text-stone-800">相册管理</h1>
      <Tabs
        items={[
          {
            key: 'albums',
            label: '相册',
            children: (
              <>
                <Space className="mb-3">
                  <Input.Search
                    placeholder="情侣 ID"
                    allowClear
                    onSearch={(v) => {
                      setAlbumPage(1)
                      setCoupleId(v)
                    }}
                    style={{ width: 200 }}
                  />
                </Space>
                <Table
                  rowKey="id"
                  columns={albumColumns}
                  dataSource={albums}
                  loading={loadingAlbums}
                  pagination={{
                    current: albumPage,
                    pageSize,
                    total: albumTotal,
                    onChange: setAlbumPage,
                  }}
                />
              </>
            ),
          },
          {
            key: 'photos',
            label: '照片',
            children: (
              <>
                <Space className="mb-3">
                  <Input.Search
                    placeholder="相册 ID"
                    allowClear
                    onSearch={(v) => {
                      setPhotoPage(1)
                      setAlbumId(v)
                    }}
                    style={{ width: 200 }}
                  />
                </Space>
                <Table
                  rowKey="id"
                  columns={photoColumns}
                  dataSource={photos}
                  loading={loadingPhotos}
                  pagination={{
                    current: photoPage,
                    pageSize,
                    total: photoTotal,
                    onChange: setPhotoPage,
                  }}
                />
              </>
            ),
          },
        ]}
      />
    </div>
  )
}
