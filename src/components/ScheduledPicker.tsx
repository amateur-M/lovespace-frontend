import { DatePicker, Switch, Typography } from 'antd'
import type { Dayjs } from 'dayjs'

type ScheduledPickerProps = {
  enabled: boolean
  value: Dayjs | null
  onEnabledChange: (enabled: boolean) => void
  onChange: (value: Dayjs | null) => void
}

export default function ScheduledPicker({
  enabled,
  value,
  onEnabledChange,
  onChange,
}: ScheduledPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2">
      <div className="flex items-center gap-2">
        <Switch checked={enabled} onChange={onEnabledChange} />
        <Typography.Text className="text-sm text-rose-900">定时发送</Typography.Text>
      </div>
      <DatePicker
        // 勿单独 showSecond：rc-picker 会把时/分列默认成 false
        showTime={{ showHour: true, showMinute: true, showSecond: true }}
        format="YYYY-MM-DD HH:mm:ss"
        value={value}
        onChange={onChange}
        disabled={!enabled}
        className="min-w-[260px]"
        placeholder="选择发送时间"
      />
    </div>
  )
}
