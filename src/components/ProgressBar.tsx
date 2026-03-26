type ProgressBarProps = {
  /** 0–100 */
  percent: number
  className?: string
  'aria-label'?: string
}

/**
 * 水平进度条，用于计划完成度展示。
 */
export default function ProgressBar({ percent, className = '', 'aria-label': ariaLabel }: ProgressBarProps) {
  const p = Math.min(100, Math.max(0, Number.isFinite(percent) ? percent : 0))
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-rose-100/90 ${className}`}
      role="progressbar"
      aria-valuenow={p}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel ?? '进度'}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600 transition-[width] duration-300 ease-out motion-reduce:transition-none"
        style={{ width: `${p}%` }}
      />
    </div>
  )
}
