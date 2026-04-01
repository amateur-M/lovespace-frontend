import {
  CloseOutlined,
  EditOutlined,
  HeartFilled,
  HeartOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { Button, DatePicker, Drawer, Form, Input, Select, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import type { AlbumPhoto } from '../services/album'
import { updateAlbumPhoto } from '../services/album'
import { resolveMediaUrl } from '../utils/mediaUrl'

type PhotoViewerProps = {
  open: boolean
  /** 编辑照片信息时需要 */
  albumId?: string | null
  photos: AlbumPhoto[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
  onToggleFavorite: (photo: AlbumPhoto, next: boolean) => void
  onPhotoMetaSaved?: (photo: AlbumPhoto) => void
}

type PhotoMetaValues = {
  description?: string
  takenDate?: dayjs.Dayjs | null
  locationName?: string
  lat?: string
  lng?: string
  tags?: string[]
}

function isFav(p: AlbumPhoto) {
  return p.isFavorite === 1
}

function parseTags(json?: string | null): string[] {
  if (!json?.trim()) return []
  try {
    const arr = JSON.parse(json) as unknown
    if (Array.isArray(arr) && arr.every((x) => typeof x === 'string')) return arr
  } catch {
    /* ignore */
  }
  return []
}

function toNum(x: string | number | null | undefined) {
  if (x === null || x === undefined || x === '') return NaN
  const n = Number(x)
  return Number.isFinite(n) ? n : NaN
}

function buildLocationJson(v: PhotoMetaValues): string | null {
  const name = v.locationName?.trim()
  const lat = toNum(v.lat)
  const lng = toNum(v.lng)
  if (!name && !Number.isFinite(lat) && !Number.isFinite(lng)) return null
  const o: Record<string, unknown> = {}
  if (name) o.name = name
  if (Number.isFinite(lat)) o.lat = lat
  if (Number.isFinite(lng)) o.lng = lng
  return JSON.stringify(o)
}

/** 全屏灯箱：大图、左右切换、收藏、编辑描述/拍摄日/地点/标签。 */
export default function PhotoViewer({
  open,
  albumId,
  photos,
  index,
  onClose,
  onIndexChange,
  onToggleFavorite,
  onPhotoMetaSaved,
}: PhotoViewerProps) {
  const current = photos[index]
  const src = current ? resolveMediaUrl(current.imageUrl) : ''

  const [metaOpen, setMetaOpen] = useState(false)
  const [form] = Form.useForm<PhotoMetaValues>()
  const [saving, setSaving] = useState(false)

  const goPrev = useCallback(() => {
    if (index <= 0) return
    onIndexChange(index - 1)
  }, [index, onIndexChange])

  const goNext = useCallback(() => {
    if (index >= photos.length - 1) return
    onIndexChange(index + 1)
  }, [index, onIndexChange, photos.length])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, goPrev, goNext])

  useEffect(() => {
    if (!metaOpen || !current) return
    const tags = parseTags(current.tagsJson)
    let locationName: string | undefined
    let lat: string | undefined
    let lng: string | undefined
    if (current.locationJson?.trim()) {
      try {
        const o = JSON.parse(current.locationJson) as Record<string, unknown>
        if (typeof o.name === 'string') locationName = o.name
        if (typeof o.lat === 'number') lat = String(o.lat)
        if (typeof o.lng === 'number') lng = String(o.lng)
      } catch {
        /* ignore */
      }
    }
    form.setFieldsValue({
      description: current.description ?? '',
      takenDate: current.takenDate ? dayjs(current.takenDate) : undefined,
      locationName,
      lat,
      lng,
      tags,
    })
  }, [metaOpen, current, form])

  const handleSaveMeta = async () => {
    if (!albumId || !current) return
    try {
      const v = await form.validateFields()
      setSaving(true)
      const resp = await updateAlbumPhoto(albumId, current.id, {
        description: v.description?.trim() ? v.description.trim() : null,
        locationJson: buildLocationJson(v),
        takenDate: v.takenDate ? v.takenDate.format('YYYY-MM-DD') : null,
        tagsJson: v.tags?.length ? JSON.stringify(v.tags) : null,
      })
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '保存失败')
      }
      onPhotoMetaSaved?.(resp.data)
      message.success('照片信息已更新')
      setMetaOpen(false)
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (!open || !current) return null

  const fav = isFav(current)

  return (
    <>
      <div
        className="fixed inset-0 z-[1000] flex flex-col bg-black/90"
        role="dialog"
        aria-modal="true"
        aria-label="照片预览"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 text-white">
          <Typography.Text className="!line-clamp-2 !text-sm !text-white/90">
            {index + 1} / {photos.length}
            {current.description ? ` · ${current.description}` : ''}
          </Typography.Text>
          <div className="flex shrink-0 items-center gap-1">
            {albumId ? (
              <Button
                type="text"
                className="!text-white hover:!bg-white/10"
                icon={<EditOutlined />}
                onClick={() => setMetaOpen(true)}
              >
                编辑信息
              </Button>
            ) : null}
            <Button
              type="text"
              className="!text-white hover:!bg-white/10"
              icon={
                fav ? <HeartFilled className="!text-rose-400" /> : <HeartOutlined className="!text-white/70" />
              }
              onClick={() => onToggleFavorite(current, !fav)}
            />
            <Button
              type="text"
              className="!text-white hover:!bg-white/10"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-12 py-4">
          {index > 0 ? (
            <Button
              type="text"
              shape="circle"
              size="large"
              className="!absolute left-2 top-1/2 z-10 -translate-y-1/2 !text-white hover:!bg-white/10"
              icon={<LeftOutlined className="text-xl" />}
              onClick={goPrev}
            />
          ) : null}
          <img src={src} alt="" className="max-h-full max-w-full object-contain" />
          {index < photos.length - 1 ? (
            <Button
              type="text"
              shape="circle"
              size="large"
              className="!absolute right-2 top-1/2 z-10 -translate-y-1/2 !text-white hover:!bg-white/10"
              icon={<RightOutlined className="text-xl" />}
              onClick={goNext}
            />
          ) : null}
        </div>
      </div>

      <Drawer
        title="编辑照片信息"
        placement="right"
        width={400}
        open={metaOpen}
        onClose={() => setMetaOpen(false)}
        destroyOnClose
        rootStyle={{ zIndex: 1101 }}
        styles={{ body: { paddingBottom: 80 } }}
        extra={
          <Button type="primary" loading={saving} onClick={() => handleSaveMeta().catch(() => undefined)}>
            保存
          </Button>
        }
      >
        <Form form={form} layout="vertical" className="text-rose-950">
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} maxLength={500} showCount placeholder="写一段说明…" />
          </Form.Item>
          <Form.Item name="takenDate" label="拍摄日期">
            <DatePicker className="w-full" allowClear />
          </Form.Item>
          <Form.Item name="locationName" label="地点名称">
            <Input placeholder="例如：海边栈道" allowClear />
          </Form.Item>
          <div className="grid grid-cols-2 gap-2">
            <Form.Item name="lat" label="纬度（可选）">
              <Input placeholder="如 31.23" allowClear />
            </Form.Item>
            <Form.Item name="lng" label="经度（可选）">
              <Input placeholder="如 121.47" allowClear />
            </Form.Item>
          </div>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入后回车添加" tokenSeparators={[',']} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  )
}
