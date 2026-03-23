/** 将后端返回的图片路径转为浏览器可请求的 URL（支持相对路径 + 可选 API 基址）。 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/')) {
    const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''
    return base ? `${base}${url}` : url
  }
  return url
}
