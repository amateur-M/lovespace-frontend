import { UploadOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import type { ChangeEvent, ReactNode } from 'react'
import { useRef } from 'react'

type UploadButtonProps = {
  /** 选择文件后回调（可多选时依次触发或由父组件批量处理） */
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  loading?: boolean
  disabled?: boolean
  children?: ReactNode
}

/** 隐藏 file input + 按钮，统一样式。 */
export default function UploadButton({
  onFiles,
  accept = 'image/jpeg,image/png,image/webp',
  multiple = true,
  loading = false,
  disabled = false,
  children,
}: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const openPicker = () => {
    inputRef.current?.click()
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    if (!list?.length) return
    onFiles(Array.from(list))
    e.target.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={onChange}
      />
      <Button
        type="primary"
        icon={<UploadOutlined />}
        loading={loading}
        disabled={disabled}
        onClick={openPicker}
      >
        {children ?? '上传照片'}
      </Button>
    </>
  )
}
