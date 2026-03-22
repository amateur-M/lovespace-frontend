import { Image, Space, Typography } from 'antd'
import MoodTag from './MoodTag'
import type { LoveRecord } from '../services/timeline'

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
}

/** 单条恋爱时间轴记录：日期、内容、心情、位置、图片。 */
export default function TimelineItem({ record }: TimelineItemProps) {
  const loc = parseLocation(record.locationJson)
  const tags = parseTags(record.tagsJson)
  const images = parseImages(record.imagesJson)

  const locText =
    loc?.name ||
    (loc?.lat != null && loc?.lng != null ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : null)

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Typography.Text strong className="text-base">
          {record.recordDate}
        </Typography.Text>
        <MoodTag mood={record.mood} />
        {tags.length > 0 &&
          tags.map((t) => (
            <Typography.Text key={t} type="secondary" className="text-xs">
              #{t}
            </Typography.Text>
          ))}
      </div>
      <Typography.Paragraph className="!mb-2 whitespace-pre-wrap">{record.content}</Typography.Paragraph>
      {locText ? (
        <Typography.Text type="secondary" className="mb-2 block text-sm">
          📍 {locText}
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
