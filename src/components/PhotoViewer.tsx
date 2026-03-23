import { CloseOutlined, HeartFilled, HeartOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Typography } from 'antd'
import { useCallback, useEffect } from 'react'
import type { AlbumPhoto } from '../services/album'
import { resolveMediaUrl } from '../utils/mediaUrl'

type PhotoViewerProps = {
  open: boolean
  photos: AlbumPhoto[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
  onToggleFavorite: (photo: AlbumPhoto, next: boolean) => void
}

function isFav(p: AlbumPhoto) {
  return p.isFavorite === 1
}

/** 全屏灯箱：大图、左右切换、收藏。 */
export default function PhotoViewer({
  open,
  photos,
  index,
  onClose,
  onIndexChange,
  onToggleFavorite,
}: PhotoViewerProps) {
  const current = photos[index]
  const src = current ? resolveMediaUrl(current.imageUrl) : ''

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

  if (!open || !current) return null

  const fav = isFav(current)

  return (
    <div
      className="fixed inset-0 z-[1000] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="照片预览"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 text-white">
        <Typography.Text className="!text-white/90 !text-sm">
          {index + 1} / {photos.length}
          {current.description ? ` · ${current.description}` : ''}
        </Typography.Text>
        <div className="flex items-center gap-1">
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
  )
}
