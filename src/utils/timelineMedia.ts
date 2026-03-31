/** 与后端 {@code lovespace.timeline-upload.video-extensions} 一致，用于展示与前端校验 */
const VIDEO_EXT_RE = /\.(mp4|webm|mov)(\?.*)?$/i

/**
 * 根据 URL 路径判断是否为时间轴视频资源（与扩展名约定一致）。
 */
export function isTimelineVideoUrl(url: string): boolean {
  if (!url) return false
  try {
    const path = new URL(url, 'http://local.invalid').pathname
    return VIDEO_EXT_RE.test(path)
  } catch {
    return VIDEO_EXT_RE.test(url)
  }
}

/** 与后端 {@code lovespace.timeline-upload.image-max-size-bytes} 对齐（默认 20MB） */
export const TIMELINE_IMAGE_MAX_MB = 20
export const TIMELINE_VIDEO_MAX_MB = 100

function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp'])
const VIDEO_EXT = new Set(['mp4', 'webm', 'mov'])

/**
 * 上传前校验：扩展名与大小（与后端 {@link TimelineController} 一致）。
 */
export function validateTimelineUploadFile(file: File): string | null {
  const ext = extOf(file.name)
  if (IMAGE_EXT.has(ext)) {
    if (file.size > TIMELINE_IMAGE_MAX_MB * 1024 * 1024) {
      return `单张图片不超过 ${TIMELINE_IMAGE_MAX_MB}MB`
    }
    return null
  }
  if (VIDEO_EXT.has(ext)) {
    if (file.size > TIMELINE_VIDEO_MAX_MB * 1024 * 1024) {
      return `单个视频不超过 ${TIMELINE_VIDEO_MAX_MB}MB`
    }
    return null
  }
  return '请上传 jpg/png/webp 图片或 mp4/webm/mov 视频'
}
