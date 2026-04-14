import { Image, Spin } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAlbumPhotos, listAlbums, type AlbumPhoto } from '../../services/album'
import { resolveMediaUrl } from '../../utils/mediaUrl'

const MAX_ALBUMS = 4
const MAX_PHOTOS = 16
const PLACEHOLDER_COUNT = 6

type RingSlot = {
  left: number
  top: number
  rot: number
  z: number
  scale: number
}

/** 双环 + 轻微错位，形成环绕、错落、不呆板的排布 */
function memorialRingSlots(count: number): RingSlot[] {
  if (count <= 0) return []
  if (count === 1) {
    return [{ left: 50, top: 46, rot: -5, z: 12, scale: 0.98 }]
  }

  const slots: RingSlot[] = []

  if (count <= 8) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2 + (i % 2) * 0.05
      const r = 39 + (i % 3) * 1.8 + ((i * 7) % 5) * 0.2
      slots.push({
        left: 50 + r * Math.cos(angle),
        top: 50 + r * Math.sin(angle),
        rot: -11 + (i * 19) % 23,
        z: 6 + (i % 7),
        scale: 0.9 + (i % 4) * 0.028,
      })
    }
    return slots
  }

  const outerCount = count - 8
  for (let i = 0; i < outerCount; i++) {
    const angle = (i / outerCount) * 2 * Math.PI - Math.PI / 2 + 0.12
    const r = 44 + (i % 4) * 1.8 + ((i * 11) % 5) * 0.25
    slots.push({
      left: 50 + r * Math.cos(angle),
      top: 50 + r * Math.sin(angle),
      rot: -10 + (i * 13) % 21,
      z: 4 + (i % 6),
      scale: 0.86 + (i % 4) * 0.022,
    })
  }
  for (let j = 0; j < 8; j++) {
    const angle = (j / 8) * 2 * Math.PI - Math.PI / 2 + 0.38
    const r = 26 + (j % 3) * 1.2 + ((j * 5) % 4) * 0.3
    const idx = outerCount + j
    slots.push({
      left: 50 + r * Math.cos(angle),
      top: 50 + r * Math.sin(angle),
      rot: 8 - (idx * 11) % 20,
      z: 8 + (j % 7),
      scale: 0.92 + (j % 3) * 0.024,
    })
  }
  return slots
}

function HeartGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 20.5c-.3 0-.6-.1-.8-.3C7.5 17.2 2 12.4 2 7.5 2 4.4 4.5 2 7.5 2c1.7 0 3.3.8 4.5 2.1C13.2 2.8 14.8 2 16.5 2 19.5 2 22 4.4 22 7.5c0 4.9-5.5 9.7-9.2 12.7-.2.2-.5.3-.8.3z" />
    </svg>
  )
}

function PlaceholderPolaroid({
  slot,
}: {
  slot: RingSlot
}) {
  const g =
    'from-rose-100/90 via-pink-50 to-amber-50/90'
  return (
    <div
      className="memorial-polaroid pointer-events-none absolute flex w-[min(30vw,7.75rem)] flex-col flex-shrink-0 sm:w-[min(28vw,8.75rem)]"
      style={{
        left: `${slot.left}%`,
        top: `${slot.top}%`,
        transform: `translate(-50%, -50%) rotate(${slot.rot}deg) scale(${slot.scale})`,
        zIndex: slot.z,
      }}
    >
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-sm bg-gradient-to-br ${g} ring-1 ring-rose-100/60`}
      >
        <div className="absolute inset-0 flex items-center justify-center text-rose-300/75">
          <HeartGlyph className="h-9 w-9 sm:h-11 sm:w-11" />
        </div>
      </div>
      <div className="mt-2 h-3 w-full rounded-sm bg-gradient-to-r from-transparent via-rose-100/50 to-transparent" />
    </div>
  )
}

type Props = {
  coupleId: string
}

/**
 * 从情侣相册拉取近期照片，环绕式错落「拍立得」墙；无照片时占位亦按环排布。
 */
export default function MemorialPhotoWall({ coupleId }: Props) {
  const [photos, setPhotos] = useState<AlbumPhoto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const albumsResp = await listAlbums(coupleId)
        if (albumsResp.code !== 0 || !albumsResp.data?.length) {
          if (!cancelled) setPhotos([])
          return
        }
        const albums = albumsResp.data.slice(0, MAX_ALBUMS)
        const merged: AlbumPhoto[] = []
        const seen = new Set<string>()
        for (const a of albums) {
          const page = await listAlbumPhotos(a.id, 1, 24)
          if (page.code !== 0 || !page.data) continue
          for (const ph of page.data.photos) {
            if (seen.has(ph.id)) continue
            seen.add(ph.id)
            merged.push(ph)
            if (merged.length >= MAX_PHOTOS) break
          }
          if (merged.length >= MAX_PHOTOS) break
        }
        if (!cancelled) setPhotos(merged)
      } catch {
        if (!cancelled) setPhotos([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [coupleId])

  const count = photos.length > 0 ? photos.length : PLACEHOLDER_COUNT
  const slots = useMemo(() => memorialRingSlots(count), [count])

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-rose-200/80 bg-white/60 py-16">
        <Spin tip="加载回忆相册…" />
      </div>
    )
  }

  const showPlaceholders = photos.length === 0

  return (
    <div className="relative w-full">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="memorial-display text-xl text-stone-900 sm:text-2xl">我们的照片墙</h2>
          <p className="mt-1 text-sm text-stone-600">
            回忆轻轻围成一圈。
          </p>
        </div>
        <Link to="/album" className="ls-link cursor-pointer text-sm">
          去相册上传
        </Link>
      </div>

      <div className="relative mx-auto w-full overflow-visible px-2 py-6 sm:px-6 sm:py-10">
        {/* 中心柔光，强化「环绕」视觉 */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[min(52vw,14rem)] w-[min(52vw,14rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-rose-100/50 via-white/30 to-amber-50/35 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 text-center"
          aria-hidden
        >
          <HeartGlyph className="mx-auto h-10 w-10 text-rose-200/70 sm:h-12 sm:w-12" />
          <p className="memorial-accent mt-1 text-lg text-rose-700/50 sm:text-xl">Our moments</p>
        </div>

        <div
          className="relative z-[2] mx-auto min-h-[min(88vw,26rem)] w-full max-w-3xl sm:min-h-[28rem] md:min-h-[30rem]"
        >
          {showPlaceholders
            ? slots.map((slot, index) => (
                <PlaceholderPolaroid key={`ph-${index}`} slot={slot} />
              ))
            : photos.map((ph, index) => {
                const slot = slots[index] ?? slots[slots.length - 1]
                const thumbSrc = resolveMediaUrl(ph.thumbnailUrl || ph.imageUrl)
                const fullSrc = resolveMediaUrl(ph.imageUrl || ph.thumbnailUrl)
                const alt = ph.description?.trim() ? ph.description : '相册照片'
                return (
                  <div
                    key={ph.id}
                    className="memorial-polaroid absolute w-[min(30vw,7.75rem)] flex-shrink-0 transition-transform duration-200 hover:z-[40] hover:scale-[1.02] sm:w-[min(28vw,8.75rem)]"
                    style={{
                      left: `${slot.left}%`,
                      top: `${slot.top}%`,
                      transform: `translate(-50%, -50%) rotate(${slot.rot}deg) scale(${slot.scale})`,
                      zIndex: slot.z,
                    }}
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-rose-50 ring-1 ring-rose-100/70 [&_.ant-image]:!h-full [&_.ant-image]:!w-full [&_.ant-image-img]:!h-full [&_.ant-image-img]:!w-full [&_.ant-image-img]:object-cover">
                      {thumbSrc ? (
                        <Image
                          src={thumbSrc}
                          alt={alt}
                          loading="lazy"
                          preview={
                            fullSrc
                              ? {
                                  src: fullSrc,
                                  mask: '查看',
                                }
                              : true
                          }
                          className="cursor-pointer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-rose-50 text-rose-200">
                          <HeartGlyph className="h-9 w-9" />
                        </div>
                      )}
                    </div>
                    <div className="mt-1 line-clamp-2 min-h-[2rem] text-center text-[10px] leading-tight text-stone-500 sm:text-xs">
                      {ph.description?.trim() ? ph.description : '\u00a0'}
                    </div>
                  </div>
                )
              })}
        </div>
      </div>

      {showPlaceholders ? (
        <p className="mt-2 text-center text-sm text-stone-500">
          还没有相册照片？先去{' '}
          <Link to="/album" className="ls-link cursor-pointer font-medium">
            情侣相册
          </Link>{' '}
          上传几张，这里会自动围成一圈。
        </p>
      ) : null}
    </div>
  )
}
