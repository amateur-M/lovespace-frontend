import {
  CommentOutlined,
  DeleteOutlined,
  HeartFilled,
  HeartOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Empty, Input, Spin, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import type { LoveRecord } from '../services/timeline'
import {
  deleteTimelineComment,
  listTimelineComments,
  postTimelineComment,
  toggleTimelineLike,
  type LoveRecordComment,
} from '../services/timeline'

type TimelineRecordSocialProps = {
  record: LoveRecord
  currentUserId?: string
  /** 点赞/评论变更后刷新列表以同步计数 */
  onMutated?: () => void
}

function initials(name: string) {
  const t = name.trim()
  return t ? t[0]!.toUpperCase() : '?'
}

/** 时间轴单条记录的点赞与评论区（暖色、Ant Design 图标，无 emoji）。 */
export default function TimelineRecordSocial({ record, currentUserId, onMutated }: TimelineRecordSocialProps) {
  const [likeCount, setLikeCount] = useState(record.likeCount ?? 0)
  const [likedByMe, setLikedByMe] = useState(record.likedByMe ?? false)
  const [commentCount, setCommentCount] = useState(record.commentCount ?? 0)
  const [likeLoading, setLikeLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [comments, setComments] = useState<LoveRecordComment[]>([])
  const [commentPage, setCommentPage] = useState(1)
  const [commentTotal, setCommentTotal] = useState(0)
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    setLikeCount(record.likeCount ?? 0)
    setLikedByMe(record.likedByMe ?? false)
    setCommentCount(record.commentCount ?? 0)
  }, [record.id, record.likeCount, record.likedByMe, record.commentCount])

  const loadComments = useCallback(
    async (page: number, append: boolean) => {
      setCommentsLoading(true)
      try {
        const resp = await listTimelineComments(record.id, page, 20)
        if (resp.code !== 0 || !resp.data) {
          throw new Error(resp.message || '加载评论失败')
        }
        const { comments: list, total, page: p } = resp.data
        setCommentTotal(total)
        setCommentPage(Number(p))
        setComments((prev) => (append ? [...prev, ...list] : list))
      } catch (e) {
        message.error(e instanceof Error ? e.message : '加载评论失败')
      } finally {
        setCommentsLoading(false)
      }
    },
    [record.id],
  )

  // 展开时拉取评论；列表刷新后 record.commentCount 等来自服务端更新时也要重拉，避免条数变了内容仍是旧缓存
  useEffect(() => {
    if (!panelOpen) return
    loadComments(1, false).catch(() => undefined)
  }, [panelOpen, record.id, record.commentCount, loadComments])

  const handleLike = async () => {
    if (likeLoading) return
    setLikeLoading(true)
    try {
      const resp = await toggleTimelineLike(record.id)
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '操作失败')
      }
      setLikeCount(resp.data.likeCount)
      setLikedByMe(resp.data.likedByMe)
      onMutated?.()
    } catch (e) {
      message.error(e instanceof Error ? e.message : '操作失败')
    } finally {
      setLikeLoading(false)
    }
  }

  const handlePost = async () => {
    const text = draft.trim()
    if (!text) {
      message.warning('写点什么再发送吧')
      return
    }
    setPosting(true)
    try {
      const resp = await postTimelineComment(record.id, text)
      if (resp.code !== 0 || !resp.data) {
        throw new Error(resp.message || '发送失败')
      }
      setDraft('')
      setComments((prev) => [...prev, resp.data!])
      setCommentCount((c) => c + 1)
      setCommentTotal((t) => t + 1)
      onMutated?.()
      message.success('已发送')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '发送失败')
    } finally {
      setPosting(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    try {
      const resp = await deleteTimelineComment(record.id, commentId)
      if (resp.code !== 0) {
        throw new Error(resp.message || '删除失败')
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setCommentCount((c) => Math.max(0, c - 1))
      setCommentTotal((t) => Math.max(0, t - 1))
      onMutated?.()
      message.success('已删除')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '删除失败')
    }
  }

  const hasMore = comments.length < commentTotal
  const loadMore = () => {
    if (commentsLoading || !hasMore) return
    loadComments(commentPage + 1, true).catch(() => undefined)
  }

  return (
    <div className="mt-3 border-t border-rose-100 pt-3 transition-opacity duration-200 motion-reduce:transition-none">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleLike().catch(() => undefined)}
          disabled={likeLoading}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-rose-900/90 transition-colors duration-200 hover:bg-rose-50 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60"
          aria-pressed={likedByMe}
          aria-label={likedByMe ? '取消点赞' : '点赞'}
        >
          {likedByMe ? (
            <HeartFilled className="text-lg text-rose-500" aria-hidden />
          ) : (
            <HeartOutlined className="text-lg text-rose-400" aria-hidden />
          )}
          <span>{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-rose-900/90 transition-colors duration-200 hover:bg-rose-50 motion-reduce:transition-none"
          aria-expanded={panelOpen}
        >
          <CommentOutlined className="text-lg text-rose-400" aria-hidden />
          <span>评论 {commentCount}</span>
        </button>
      </div>

      {panelOpen ? (
        <div className="mt-3 rounded-lg bg-rose-50/80 p-3 ring-1 ring-rose-100/90">
          {commentsLoading && comments.length === 0 ? (
            <div className="flex justify-center py-6">
              <Spin />
            </div>
          ) : comments.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有评论，来抢沙发吧" className="py-2" />
          ) : (
            <ul className="mb-3 max-h-64 space-y-3 overflow-y-auto pr-1">
              {comments.map((c) => {
                const mine = currentUserId && c.userId === currentUserId
                return (
                  <li key={c.id} className="flex gap-2">
                    <Avatar
                      size={36}
                      className="shrink-0 bg-rose-400 text-white"
                      aria-hidden
                    >
                      {initials(c.authorUsername || c.userId)}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                        <Typography.Text strong className="text-rose-950">
                          {c.authorUsername || '用户'}
                        </Typography.Text>
                        <Typography.Text type="secondary" className="text-xs">
                          {c.createdAt ? dayjs(c.createdAt).format('MM-DD HH:mm') : ''}
                        </Typography.Text>
                        {mine ? (
                          <Button
                            type="link"
                            danger
                            size="small"
                            className="!h-auto !p-0 !text-xs"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteComment(c.id)}
                          >
                            删除
                          </Button>
                        ) : null}
                      </div>
                      <Typography.Paragraph className="!mb-0 mt-0.5 whitespace-pre-wrap text-rose-900/90">
                        {c.content}
                      </Typography.Paragraph>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {hasMore && comments.length > 0 ? (
            <Button type="link" size="small" className="!px-0 !text-rose-700" onClick={loadMore} loading={commentsLoading}>
              加载更多
            </Button>
          ) : null}
          <div className="mt-2 flex gap-2">
            <Input.TextArea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="和对方说点什么…"
              autoSize={{ minRows: 1, maxRows: 4 }}
              maxLength={500}
              showCount
              className="flex-1"
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault()
                  handlePost().catch(() => undefined)
                }
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={posting}
              onClick={() => handlePost().catch(() => undefined)}
              className="self-end shrink-0"
            >
              发送
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
