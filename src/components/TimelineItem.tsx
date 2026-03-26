import { EditOutlined, EnvironmentOutlined, MoreOutlined } from '@ant-design/icons'
import { Dropdown, Image, Modal, Space, Typography } from 'antd'
import MoodTag from './MoodTag'
import { VISIBILITY_COUPLE, type LoveRecord } from '../services/timeline'

function parseLocation(json?: string | null): { name?: string; lat?: number; lng?: number } | null {
  if (!json?.trim()) return null
  try {
    const o = JSON.parse(json) as Record<string, unknown>
    return {
      name: typeof o.name === 'string' ? o.name : undefined,
      lat: typeof o.lat === 'number' ? o.lat : undefined,
      lng: typeof o.lng === 'number' ? o.lng : undefined,
    }
  } catch {
    return null
  }
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

function parseImages(json?: string | null): string[] {
  if (!json?.trim()) return []
  try {
    const arr = JSON.parse(json) as unknown
    if (Array.isArray(arr) && arr.every((x) => typeof x === 'string')) return arr
  } catch {
    /* ignore */
  }
  return []
}

type TimelineItemProps = {
  record: LoveRecord
  currentUserId?: string
  onEdit?: (record: LoveRecord) => void
  onDelete?: (record: LoveRecord) => void
}

/** 单条恋爱时间轴记录：日期、内容、心情、位置、图片；作者可编辑/删除。 */
export default function TimelineItem({ record, currentUserId, onEdit, onDelete }: TimelineItemProps) {
  const loc = parseLocation(record.locationJson)
  const tags = parseTags(record.tagsJson)
  const images = parseImages(record.imagesJson)

  const locText =
    loc?.name ||
    (loc?.lat != null && loc?.lng != null ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : null)

  const isAuthor = currentUserId && record.authorId === currentUserId
  const canManage = isAuthor && onEdit && onDelete

  return (
    <div className="relative rounded-xl border border-rose-200/90 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      {canManage ? (
        <div className="absolute right-2 top-2">
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'edit',
                  label: '编辑',
                  icon: <EditOutlined />,
                  onClick: () => onEdit(record),
                },
                {
                  key: 'delete',
                  danger: true,
                  label: '删除',
                  onClick: () => {
                    Modal.confirm({
                      title: '删除这条记录？',
                      content: '删除后无法恢复。',
                      okText: '删除',
                      okType: 'danger',
                      cancelText: '取消',
                      onOk: () => onDelete(record),
                    })
                  },
                },
              ],
            }}
          >
            <button
              type="button"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-rose-700/80 transition-colors hover:bg-rose-50 hover:text-rose-900"
              aria-label="更多操作"
            >
              <MoreOutlined />
            </button>
          </Dropdown>
        </div>
      ) : null}

      <div className="mb-2 flex flex-wrap items-center gap-2 pr-8">
        <Typography.Text strong className="text-base">
          {record.recordDate}
        </Typography.Text>
        <MoodTag mood={record.mood} />
        {record.visibility != null && record.visibility !== VISIBILITY_COUPLE ? (
          <Typography.Text type="secondary" className="text-xs">
            仅自己可见
          </Typography.Text>
        ) : null}
        {tags.length > 0 &&
          tags.map((t) => (
            <Typography.Text key={t} type="secondary" className="text-xs">
              #{t}
            </Typography.Text>
          ))}
      </div>
      <Typography.Paragraph className="!mb-2 whitespace-pre-wrap">{record.content}</Typography.Paragraph>
      {locText ? (
        <Typography.Text type="secondary" className="mb-2 flex items-center gap-1.5 text-sm text-rose-800/70">
          <EnvironmentOutlined className="text-rose-400" aria-hidden />
          {locText}
        </Typography.Text>
      ) : null}
      {images.length > 0 ? (
        <Image.PreviewGroup>
          <Space wrap size={8} className="mt-2">
            {images.map((src) => (
              <Image key={src} src={src} alt="" width={96} height={96} className="rounded object-cover" />
            ))}
          </Space>
        </Image.PreviewGroup>
      ) : null}
    </div>
  )
}
