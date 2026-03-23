import { PictureOutlined } from '@ant-design/icons'
import { Card, Typography } from 'antd'
import type { Album } from '../services/album'
import { resolveMediaUrl } from '../utils/mediaUrl'

type AlbumCardProps = {
  album: Album
  onClick: () => void
}

/** 相册列表卡片：封面、名称。 */
export default function AlbumCard({ album, onClick }: AlbumCardProps) {
  const cover = resolveMediaUrl(album.coverImageUrl ?? undefined)

  return (
    <Card
      hoverable
      className="ls-surface !shadow-sm cursor-pointer overflow-hidden transition-shadow duration-200 hover:!shadow-md"
      cover={
        <div className="relative aspect-[4/3] bg-gradient-to-br from-rose-100 via-orange-50 to-amber-50">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-rose-300">
              <PictureOutlined className="text-5xl" />
            </div>
          )}
        </div>
      }
      onClick={onClick}
    >
      <Typography.Text strong className="line-clamp-2 text-base text-orange-950">
        {album.name}
      </Typography.Text>
    </Card>
  )
}
