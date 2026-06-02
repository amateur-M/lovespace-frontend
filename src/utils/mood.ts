export const MOOD_OPTIONS = [
  { value: 'happy', label: '开心' },
  { value: 'sad', label: '难过' },
  { value: 'excited', label: '兴奋' },
  { value: 'calm', label: '平静' },
  { value: 'loved', label: '被爱' },
  { value: 'missed', label: '想念' },
] as const

const MOOD_META: Record<string, { label: string }> = {
  happy: { label: '开心' },
  sad: { label: '难过' },
  excited: { label: '兴奋' },
  calm: { label: '平静' },
  loved: { label: '被爱' },
  missed: { label: '想念' },
}

export function moodLabel(mood: string) {
  return MOOD_META[mood]?.label ?? mood
}
