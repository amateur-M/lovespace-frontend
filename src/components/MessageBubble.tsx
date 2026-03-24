import { Typography } from 'antd'
import dayjs from 'dayjs'

export type ChatMessage = {
  id: string
  senderId: string
  receiverId: string
  content: string
  messageType: 'text' | 'image' | 'voice' | 'letter'
  isRead: number
  readTime: string | null
  isRetracted: number
  createdAt: string
  isScheduled: number
  scheduledTime: string | null
}

type MessageBubbleProps = {
  message: ChatMessage
  isMine: boolean
}

export default function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const bubbleClass = isMine
    ? 'bg-rose-500 text-white border-rose-400'
    : 'bg-white text-rose-950 border-rose-200'

  const readLabel = isMine ? (message.isRead === 1 ? '已读' : '未读') : ''

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl border px-3 py-2 shadow-sm sm:max-w-[70%] ${bubbleClass}`}>
        <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
          <span>{message.messageType}</span>
          {message.isScheduled === 1 && message.scheduledTime ? (
            <span>定时 {dayjs(message.scheduledTime).format('MM-DD HH:mm')}</span>
          ) : null}
        </div>

        <Typography.Paragraph
          className={`!mb-2 !whitespace-pre-wrap !break-words ${isMine ? '!text-white' : '!text-rose-950'}`}
        >
          {message.isRetracted === 1 ? '此消息已撤回' : message.content}
        </Typography.Paragraph>

        <div className="flex items-center justify-end gap-2 text-[11px] opacity-80">
          <span>{dayjs(message.createdAt).format('MM-DD HH:mm')}</span>
          {readLabel ? <span>{readLabel}</span> : null}
        </div>
      </div>
    </div>
  )
}
