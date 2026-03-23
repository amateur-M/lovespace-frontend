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
      className="overflow-hidden"
      cover={
        <div className="relative aspect-[4/3] bg-gradient-to-br from-rose-50 to-violet-100">
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
      <Typography.Text strong className="line-clamp-2 text-base">
        {album.name}
      </Typography.Text>
    </Card>
  )
}
