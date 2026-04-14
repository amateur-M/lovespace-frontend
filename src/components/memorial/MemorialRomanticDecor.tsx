import type { CSSProperties } from 'react'

/**
 * 纪念日页背景装饰：爱心与星光（SVG，非 emoji），pointer-events: none。
 */

function HeartShape({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 20.5c-.3 0-.6-.1-.8-.3C7.5 17.2 2 12.4 2 7.5 2 4.4 4.5 2 7.5 2c1.7 0 3.3.8 4.5 2.1C13.2 2.8 14.8 2 16.5 2 19.5 2 22 4.4 22 7.5c0 4.9-5.5 9.7-9.2 12.7-.2.2-.5.3-.8.3z" />
    </svg>
  )
}

function StarShape({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.2 6.8H21l-5.5 4 2.1 6.5L12 15.9 6.4 19.3l2.1-6.5L3 8.8h6.8L12 2z" />
    </svg>
  )
}

const HEARTS: { top: string; left: string; size: string; rot: string; delay: string; colorClass: string }[] = [
  { top: '8%', left: '6%', size: 'w-7 h-7 sm:w-9 sm:h-9', rot: '-12deg', delay: '0s', colorClass: 'text-rose-300/90' },
  { top: '18%', left: '88%', size: 'w-5 h-5 sm:w-7 sm:h-7', rot: '8deg', delay: '0.6s', colorClass: 'text-rose-400/75' },
  { top: '42%', left: '4%', size: 'w-6 h-6 sm:w-8 sm:h-8', rot: '6deg', delay: '1.1s', colorClass: 'text-pink-300/85' },
  { top: '68%', left: '92%', size: 'w-8 h-8 sm:w-10 sm:h-10', rot: '-6deg', delay: '0.3s', colorClass: 'text-rose-300/80' },
  { top: '82%', left: '10%', size: 'w-5 h-5 sm:w-6 sm:h-6', rot: '14deg', delay: '0.9s', colorClass: 'text-rose-400/70' },
]

const STARS: { top: string; left: string; size: string; delay: string }[] = [
  { top: '12%', left: '22%', size: 'w-2 h-2 sm:w-2.5 sm:h-2.5', delay: '0s' },
  { top: '26%', left: '72%', size: 'w-1.5 h-1.5 sm:w-2 sm:h-2', delay: '0.4s' },
  { top: '38%', left: '48%', size: 'w-2 h-2 sm:w-2.5 sm:h-2.5', delay: '0.8s' },
  { top: '52%', left: '18%', size: 'w-1.5 h-1.5 sm:w-2 sm:h-2', delay: '1.2s' },
  { top: '58%', left: '84%', size: 'w-2 h-2 sm:w-2.5 sm:h-2.5', delay: '0.2s' },
  { top: '72%', left: '36%', size: 'w-1.5 h-1.5 sm:w-2 sm:h-2', delay: '1s' },
  { top: '20%', left: '52%', size: 'w-1.5 h-1.5 sm:w-2 sm:h-2', delay: '0.6s' },
  { top: '88%', left: '78%', size: 'w-2 h-2 sm:w-2.5 sm:h-2.5', delay: '1.4s' },
]

export default function MemorialRomanticDecor() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(254,205,211,0.45),transparent_55%),radial-gradient(ellipse_at_80%_60%,rgba(251,207,232,0.25),transparent_50%),radial-gradient(ellipse_at_20%_80%,rgba(254,202,202,0.3),transparent_45%)]" />

      {HEARTS.map((h, i) => (
        <div
          key={`heart-${i}`}
          className={`memorial-heart-float absolute ${h.size} ${h.colorClass}`}
          style={{
            top: h.top,
            left: h.left,
            animationDelay: h.delay,
            ...( { ['--memorial-rot']: h.rot } as CSSProperties ),
          }}
        >
          <HeartShape className="h-full w-full drop-shadow-sm" />
        </div>
      ))}

      {STARS.map((s, i) => (
        <div
          key={`star-${i}`}
          className={`memorial-star absolute ${s.size} text-amber-200/95`}
          style={{
            top: s.top,
            left: s.left,
            animationDelay: s.delay,
            animationDuration: `${2.8 + (i % 4) * 0.35}s`,
          }}
        >
          <StarShape className="h-full w-full drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]" />
        </div>
      ))}
    </div>
  )
}
