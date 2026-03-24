import { Button, Input, Space } from 'antd'
import { useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import ScheduledPicker from './ScheduledPicker'

type MessageInputProps = {
  sending?: boolean
  onSend: (payload: { content: string; scheduledTime: Dayjs | null }) => Promise<void> | void
}

export default function MessageInput({ sending = false, onSend }: MessageInputProps) {
  const [text, setText] = useState('')
  const [scheduledEnabled, setScheduledEnabled] = useState(false)
  const [scheduledTime, setScheduledTime] = useState<Dayjs | null>(null)

  const canSubmit = useMemo(() => {
    if (!text.trim() || sending) return false
    if (!scheduledEnabled) return true
    return !!scheduledTime
  }, [scheduledEnabled, scheduledTime, sending, text])

  const submit = async () => {
    if (!canSubmit) return
    await onSend({
      content: text.trim(),
      scheduledTime: scheduledEnabled ? scheduledTime : null,
    })
    setText('')
    setScheduledEnabled(false)
    setScheduledTime(null)
  }

  return (
    <div className="space-y-3">
      <ScheduledPicker
        enabled={scheduledEnabled}
        value={scheduledTime}
        onEnabledChange={setScheduledEnabled}
        onChange={setScheduledTime}
      />
      <Space.Compact className="w-full">
        <Input.TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="写下想说的话..."
          autoSize={{ minRows: 2, maxRows: 5 }}
          maxLength={5000}
          showCount
        />
      </Space.Compact>
      <div className="flex justify-end">
        <Button type="primary" onClick={submit} loading={sending} disabled={!canSubmit}>
          发送
        </Button>
      </div>
    </div>
  )
}
