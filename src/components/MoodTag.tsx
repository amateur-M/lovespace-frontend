import { moodLabel } from '../utils/mood'

type MoodTagProps = {
  mood: string
  className?: string
}

/** 心情标签展示（与后端 LoveMood 一致）。 */
export default function MoodTag({ mood, className }: MoodTagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-800/85 ${className ?? ''}`}
    >
      {moodLabel(mood)}
    </span>
  )
}
