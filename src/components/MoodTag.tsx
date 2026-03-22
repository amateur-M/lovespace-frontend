import { Tag } from 'antd'

export const MOOD_OPTIONS = [
  { value: 'happy', label: '开心' },
  { value: 'sad', label: '难过' },
  { value: 'excited', label: '兴奋' },
  { value: 'calm', label: '平静' },
  { value: 'loved', label: '被爱' },
  { value: 'missed', label: '想念' },
] as const

const MOOD_META: Record<string, { label: string; color: string }> = {
  happy: { label: '开心', color: 'gold' },
  sad: { label: '难过', color: 'blue' },
  excited: { label: '兴奋', color: 'magenta' },
  calm: { label: '平静', color: 'cyan' },
  loved: { label: '被爱', color: 'red' },
  missed: { label: '想念', color: 'purple' },
}

export function moodLabel(mood: string) {
  return MOOD_META[mood]?.label ?? mood
}

type MoodTagProps = {
  mood: string
  className?: string
}

/** 心情标签展示（与后端 LoveMood 一致）。 */
export default function MoodTag({ mood, className }: MoodTagProps) {
  const meta = MOOD_META[mood] ?? { label: mood, color: 'default' }
  return (
    <Tag color={meta.color as string} className={className}>
      {meta.label}
    </Tag>
  )
}
