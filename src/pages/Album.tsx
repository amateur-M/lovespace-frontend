import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Modal, Space, Spin, Typography, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AlbumCard from '../components/AlbumCard'
import PhotoGrid from '../components/PhotoGrid'
import PhotoViewer from '../components/PhotoViewer'
import UploadButton from '../components/UploadButton'
import type { Album, AlbumPhoto } from '../services/album'
import {
  createAlbum,
  listAlbumPhotos,
  listAlbums,
  setAlbumPhotoFavorite,
  uploadAlbumPhoto,
} from '../services/album'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'

export default function AlbumPage() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const fetchCoupleInfo = useCoupleStore((s) => s.fetchCoupleInfo)
  const coupleLoading = useCoupleStore((s) => s.loading)
  const coupleInfo = useCoupleStore((s) => s.info)

  const coupleId = coupleInfo?.bindingId ?? null

  const [albums, setAlbums] = useState<Album[]>([])
  const [albumsLoading, setAlbumsLoading] = useState(false)
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<AlbumPhoto[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [creating, setCreating] = useState(false)

  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const selectedAlbum = useMemo(
    () => albums.find((a) => a.id === selectedAlbumId) ?? null,
    [albums, selectedAlbumId],
  )

  useEffect(() => {
    if (!isAuthed) return
    fetchCoupleInfo().catch(() => undefined)
  }, [isAuthed, fetchCoupleInfo])

  const loadAlbums = useCallback(async () => {
    if (!coupleId) return
    setAlbumsLoading(true)
    try {
      const resp = await listAlbums(coupleId)
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '加载相册失败')
      }
      setAlbums(resp.data)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载相册失败')
    } finally {
      setAlbumsLoading(false)
    }
  }, [coupleId])

  useEffect(() => {
    if (!coupleId) {
      setAlbums([])
      setSelectedAlbumId(null)
      return
    }
    loadAlbums()
  }, [coupleId, loadAlbums])

  const loadPhotos = useCallback(async (albumId: string) => {
    setPhotosLoading(true)
    try {
      const resp = await listAlbumPhotos(albumId)
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '加载照片失败')
      }
      setPhotos(resp.data)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载照片失败')
    } finally {
      setPhotosLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedAlbumId) {
      setPhotos([])
      return
    }
    loadPhotos(selectedAlbumId)
  }, [selectedAlbumId, loadPhotos])

  const openViewer = (index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  const patchPhotoFavorite = useCallback((photoId: string, isFavorite: boolean) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, isFavorite: isFavorite ? 1 : 0 } : p)),
    )
  }, [])

  const handleToggleFavorite = useCallback(
    async (photo: AlbumPhoto, next: boolean) => {
      if (!selectedAlbumId) return
      const prev = photo.isFavorite === 1
      patchPhotoFavorite(photo.id, next)
      try {
        const resp = await setAlbumPhotoFavorite(selectedAlbumId, photo.id, next)
        if (resp.code !== 0) {
          throw new Error(resp.message || '操作失败')
        }
      } catch (e) {
        patchPhotoFavorite(photo.id, prev)
        message.error(e instanceof Error ? e.message : '操作失败')
      }
    },
    [selectedAlbumId, patchPhotoFavorite],
  )

  const handleUploadFiles = async (files: File[]) => {
    if (!selectedAlbumId || files.length === 0) return
    setUploading(true)
    try {
      for (const file of files) {
        const resp = await uploadAlbumPhoto(selectedAlbumId, file)
        if (resp.code !== 0 || !resp.data) {
          throw new Error(resp.message || '上传失败')
        }
        setPhotos((p) => [resp.data!, ...p])
      }
      message.success(`已上传 ${files.length} 张`)
      await loadAlbums()
    } catch (e) {
      message.error(e instanceof Error ? e.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const submitCreateAlbum = async () => {
    const name = newAlbumName.trim()
    if (!coupleId) return
    if (!name) {
      message.warning('请输入相册名称')
      return
    }
    setCreating(true)
    try {
      const resp = await createAlbum({ coupleId, name })
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '创建失败')
      }
      setAlbums((list) => [resp.data!, ...list])
      message.success('相册已创建')
      setCreateOpen(false)
      setNewAlbumName('')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  if (coupleLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spin />
      </div>
    )
  }

  if (!coupleId) {
    return (
      <Empty description="请先完成情侣绑定后再使用相册">
        <Link to="/couple">
          <Button type="primary">去情侣首页</Button>
        </Link>
      </Empty>
    )
  }

  if (selectedAlbumId && selectedAlbum) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => setSelectedAlbumId(null)}>
              返回相册
            </Button>
            <Typography.Title level={4} className="!mb-0">
              {selectedAlbum.name}
            </Typography.Title>
          </Space>
          <UploadButton onFiles={handleUploadFiles} loading={uploading} disabled={uploading} />
        </div>

        {photosLoading ? (
          <div className="flex justify-center py-16">
            <Spin />
          </div>
        ) : (
          <PhotoGrid photos={photos} onPhotoClick={openViewer} onToggleFavorite={handleToggleFavorite} />
        )}

        <PhotoViewer
          open={viewerOpen}
          photos={photos}
          index={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onIndexChange={setViewerIndex}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography.Title level={4} className="!mb-0">
          情侣相册
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          新建相册
        </Button>
      </div>

      {albumsLoading ? (
        <div className="flex justify-center py-24">
          <Spin />
        </div>
      ) : albums.length === 0 ? (
        <Empty description="还没有相册">
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            创建第一个相册
          </Button>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} onClick={() => setSelectedAlbumId(album.id)} />
          ))}
        </div>
      )}

      <Modal
        title="新建相册"
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false)
          setNewAlbumName('')
        }}
        onOk={submitCreateAlbum}
        confirmLoading={creating}
        okText="创建"
      >
        <Input
          placeholder="相册名称"
          value={newAlbumName}
          onChange={(e) => setNewAlbumName(e.target.value)}
          onPressEnter={submitCreateAlbum}
          maxLength={128}
          showCount
        />
      </Modal>
    </div>
  )
}
