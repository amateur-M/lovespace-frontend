import { PictureOutlined } from '@ant-design/icons'
import { Card, Input, Typography, message } from 'antd'
import type { InputRef } from 'antd/es/input'
import { useEffect, useRef, useState } from 'react'
import type { Album } from '../services/album'
import { resolveMediaUrl } from '../utils/mediaUrl'

type AlbumCardProps = {
  album: Album
  /** 点击封面进入相册 */
  onOpen: () => void
  /** 回车保存时调用；成功由父组件更新列表 */
  onSaveName: (albumId: string, name: string) => Promise<void>
}

/** 相册列表卡片：点击封面进入；双击名称内联编辑，回车保存，Esc 取消。 */
export default function AlbumCard({ album, onOpen, onSaveName }: AlbumCardProps) {
  const cover = resolveMediaUrl(album.coverImageUrl ?? undefined)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(album.name)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<InputRef>(null)

  useEffect(() => {
    if (!editing) {
      setDraft(album.name)
    }
  }, [album.name, album.id, editing])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const cancelEdit = () => {
    setEditing(false)
    setDraft(album.name)
  }

  const commit = async () => {
    const name = draft.trim()
    if (!name) {
      message.warning('请输入相册名称')
      return
    }
    if (name === album.name) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSaveName(album.id, name)
      setEditing(false)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '更新失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      hoverable
      className="ls-surface !shadow-sm overflow-hidden transition-shadow duration-200 hover:!shadow-md"
      cover={
        <div
          className="relative aspect-[4/3] cursor-pointer bg-gradient-to-br from-rose-100 via-orange-50 to-amber-50 transition-opacity duration-200 hover:opacity-95"
          onClick={onOpen}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen()
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`打开相册 ${album.name}`}
        >
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-rose-300">
              <PictureOutlined className="text-5xl" />
            </div>
          )}
        </div>
      }
    >
      {editing ? (
        <Input
          ref={inputRef}
          size="small"
          className="!text-base font-semibold text-orange-950"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={128}
          disabled={saving}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void commit()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              cancelEdit()
            }
          }}
        />
      ) : (
        <Typography.Text
          strong
          title="双击编辑名称"
          className="line-clamp-2 block cursor-text select-none text-base text-orange-950"
          onDoubleClick={(e) => {
            e.stopPropagation()
            setEditing(true)
            setDraft(album.name)
          }}
        >
          {album.name}
        </Typography.Text>
      )}
    </Card>
  )
}
