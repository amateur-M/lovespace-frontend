function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

type BudgetTrackerProps = {
  total?: number | string | null
  spent?: number | string | null
  className?: string
}

/**
 * 预算已用 / 总额与简易比例条。
 */
export default function BudgetTracker({ total, spent, className = '' }: BudgetTrackerProps) {
  const t = toNumber(total)
  const s = toNumber(spent)
  if (t === null && s === null) {
    return (
      <div className={`text-xs text-rose-800/55 ${className}`} aria-label="未设置预算">
        未设置预算
      </div>
    )
  }
  const safeTotal = t ?? 0
  const safeSpent = s ?? 0
  const ratio = safeTotal > 0 ? Math.min(100, Math.round((safeSpent / safeTotal) * 100)) : 0

  return (
    <div className={className}>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-xs text-rose-900/80">
        <span className="font-medium">预算</span>
        <span className="tabular-nums text-rose-800/90">
          ¥{safeSpent.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} / ¥
          {safeTotal.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </span>
      </div>
      {safeTotal > 0 ? (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-amber-100/90"
          role="progressbar"
          aria-valuenow={ratio}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="预算使用比例"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none ${
              ratio > 100 ? 'bg-red-500' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, ratio)}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}
