function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

export type BudgetBreakdown = {
  lodging: number
  transport: number
  dining: number
  other: number
}

type BudgetTrackerProps = {
  total?: number | string | null
  spent?: number | string | null
  /** 有数据时展示四类简要占比（来自 expenseSummary） */
  breakdown?: BudgetBreakdown | null
  className?: string
}

/**
 * 预算已用 / 总额与简易比例条。
 */
function fmtMoney(n: number) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export default function BudgetTracker({ total, spent, breakdown, className = '' }: BudgetTrackerProps) {
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
      {breakdown &&
      (breakdown.lodging > 0 ||
        breakdown.transport > 0 ||
        breakdown.dining > 0 ||
        breakdown.other > 0) ? (
        <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] leading-snug text-rose-800/70">
          {breakdown.lodging > 0 ? <span>住宿 ¥{fmtMoney(breakdown.lodging)}</span> : null}
          {breakdown.transport > 0 ? <span>交通 ¥{fmtMoney(breakdown.transport)}</span> : null}
          {breakdown.dining > 0 ? <span>用餐 ¥{fmtMoney(breakdown.dining)}</span> : null}
          {breakdown.other > 0 ? <span>其他 ¥{fmtMoney(breakdown.other)}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
