import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Empty,
  FloatButton,
  Input,
  Modal,
  Pagination,
  Spin,
  Typography,
  message,
} from 'antd'
import type { ChangeEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AlbumCard from '../components/AlbumCard'
import PhotoGrid from '../components/PhotoGrid'
import PhotoViewer from '../components/PhotoViewer'
import type { Album, AlbumPhoto } from '../services/album'
import {
  createAlbum,
  listAlbumPhotos,
  listAlbums,
  setAlbumPhotoFavorite,
  updateAlbum,
  uploadAlbumPhotoAuto,
} from '../services/album'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'

const PHOTO_PAGE_SIZE = 12

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
  const [photoPage, setPhotoPage] = useState(1)
  const [photoTotal, setPhotoTotal] = useState(0)
  const [photosLoading, setPhotosLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [creating, setCreating] = useState(false)

  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const uploadInputRef = useRef<HTMLInputElement>(null)

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

  const loadPhotos = useCallback(async (albumId: string, page: number) => {
    setPhotosLoading(true)
    try {
      const resp = await listAlbumPhotos(albumId, page, PHOTO_PAGE_SIZE)
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '加载照片失败')
      }
      const { photos: list, total, page: p } = resp.data
      setPhotos(list)
      setPhotoTotal(total)
      setPhotoPage(Number(p))
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载照片失败')
    } finally {
      setPhotosLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedAlbumId) {
      setPhotos([])
      setPhotoTotal(0)
      setPhotoPage(1)
      return
    }
    loadPhotos(selectedAlbumId, 1)
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

  const patchPhotoMeta = useCallback((updated: AlbumPhoto) => {
    setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }, [])

  const saveAlbumName = useCallback(async (id: string, name: string) => {
    const resp = await updateAlbum(id, { name })
    if (resp.code !== 0 || !resp.data) {
      throw new Error(resp.message || '更新失败')
    }
    setAlbums((list) => list.map((a) => (a.id === id ? resp.data! : a)))
    message.success('相册名称已更新')
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
        const resp = await uploadAlbumPhotoAuto(selectedAlbumId, file)
        if (resp.code !== 0 || !resp.data) {
          throw new Error(resp.message || '上传失败')
        }
      }
      message.success(`已上传 ${files.length} 张`)
      await loadAlbums()
      if (selectedAlbumId) {
        await loadPhotos(selectedAlbumId, 1)
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const onUploadInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    if (list?.length) {
      void handleUploadFiles(Array.from(list))
    }
    e.target.value = ''
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
      <div className="ls-surface py-16">
        <Empty
          description={<span className="text-rose-800/70">请先完成情侣绑定后再使用相册</span>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Link to="/couple">
            <Button type="primary">去情侣首页</Button>
          </Link>
        </Empty>
      </div>
    )
  }

  if (selectedAlbumId && selectedAlbum) {
    return (
      <div className="relative space-y-6 pb-24">
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={onUploadInputChange}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button icon={<ArrowLeftOutlined />} onClick={() => setSelectedAlbumId(null)}>
            返回相册
          </Button>
          <Typography.Title level={4} className="!mb-0 !font-semibold !text-orange-950">
            {selectedAlbum.name}
          </Typography.Title>
        </div>

        {photosLoading ? (
          <div className="flex justify-center py-16">
            <Spin />
          </div>
        ) : (
          <PhotoGrid photos={photos} onPhotoClick={openViewer} onToggleFavorite={handleToggleFavorite} />
        )}

        {photoTotal > 0 ? (
          <div className="flex justify-center pt-2">
            <Pagination
              current={photoPage}
              pageSize={PHOTO_PAGE_SIZE}
              total={photoTotal}
              onChange={(p) => {
                if (!selectedAlbumId) return
                loadPhotos(selectedAlbumId, p).catch(() => undefined)
              }}
              showSizeChanger={false}
              showTotal={(t) => `共 ${t} 张`}
            />
          </div>
        ) : null}

        <PhotoViewer
          open={viewerOpen}
          albumId={selectedAlbumId}
          photos={photos}
          index={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onIndexChange={setViewerIndex}
          onToggleFavorite={handleToggleFavorite}
          onPhotoMetaSaved={patchPhotoMeta}
        />

        <FloatButton
          icon={<PlusOutlined />}
          type="primary"
          tooltip={uploading ? '上传中…' : '上传照片'}
          disabled={uploading}
          onClick={() => uploadInputRef.current?.click()}
        />
      </div>
    )
  }

  return (
    <div className="relative pb-24">
      {albumsLoading ? (
        <div className="flex justify-center py-24">
          <Spin />
        </div>
      ) : albums.length === 0 ? (
        <div className="ls-surface py-16">
          <Empty
            description={
              <span className="text-rose-800/70">还没有相册，点击右下角加号创建</span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onOpen={() => setSelectedAlbumId(album.id)}
              onSaveName={saveAlbumName}
            />
          ))}
        </div>
      )}

      <FloatButton
        icon={<PlusOutlined />}
        type="primary"
        tooltip="新建相册"
        onClick={() => setCreateOpen(true)}
      />

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
