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

/** 瀑布流布局（多列 + break-inside-avoid），点击图片打开灯箱。 */
export default function PhotoGrid({ photos, onPhotoClick, onToggleFavorite }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 py-16 text-center">
        <Typography.Text type="secondary">还没有照片，点击「上传照片」添加</Typography.Text>
      </div>
    )
  }

  return (
    <div className="columns-2 gap-3 sm:columns-3 md:columns-4">
      {photos.map((photo, index) => {
        const src = resolveMediaUrl(photo.thumbnailUrl || photo.imageUrl)
        const fav = isFav(photo)
        return (
          <div
            key={photo.id}
            className="mb-3 break-inside-avoid rounded-lg bg-white shadow-sm ring-1 ring-gray-100"
          >
            <button
              type="button"
              className="relative block w-full cursor-zoom-in overflow-hidden rounded-t-lg text-left"
              onClick={() => onPhotoClick(index)}
            >
              <img src={src} alt="" className="w-full object-cover" loading="lazy" />
            </button>
            <div className="flex items-center justify-end gap-1 px-2 py-1.5">
              <Button
                type="text"
                size="small"
                aria-label={fav ? '取消收藏' : '收藏'}
                icon={fav ? <HeartFilled className="!text-rose-500" /> : <HeartOutlined />}
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
