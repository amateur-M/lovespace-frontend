import { HeartFilled, HeartOutlined } from '@ant-design/icons'
import { Button, Typography } from 'antd'
import type { AlbumPhoto } from '../services/album'
import { resolveMediaUrl } from '../utils/mediaUrl'

type PhotoGridProps = {
  photos: AlbumPhoto[]
  onPhotoClick: (index: number) => void
  onToggleFavorite: (photo: AlbumPhoto, next: boolean) => void
}

function isFav(p: AlbumPhoto) {
  return p.isFavorite === 1
}

/**
 * 等尺寸网格：每格固定 1:1，图片 object-cover 裁切，避免瀑布流导致缩略图高矮不一。
 */
export default function PhotoGrid({ photos, onPhotoClick, onToggleFavorite }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/80 py-16 text-center">
        <Typography.Text className="text-rose-800/70">还没有照片，点击「上传照片」添加</Typography.Text>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo, index) => {
        const src = resolveMediaUrl(photo.thumbnailUrl || photo.imageUrl)
        const fav = isFav(photo)
        return (
          <div
            key={photo.id}
            className="flex flex-col overflow-hidden rounded-xl border border-rose-200/90 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <button
              type="button"
              className="relative aspect-square w-full cursor-zoom-in overflow-hidden text-left outline-none ring-rose-400/0 transition-[box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-rose-400/50"
              onClick={() => onPhotoClick(index)}
            >
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
            <div className="flex min-h-[40px] items-center justify-end gap-1 border-t border-rose-100/90 px-1.5 py-1">
              <Button
                type="text"
                size="small"
                aria-label={fav ? '取消收藏' : '收藏'}
                icon={
                  fav ? (
                    <HeartFilled className="!text-rose-600" />
                  ) : (
                    <HeartOutlined className="text-rose-400" />
                  )
                }
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite(photo, !fav)
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
