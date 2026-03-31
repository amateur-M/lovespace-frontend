import { Button, DatePicker, Form, Input, Modal, Radio, Select, Upload, message } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { MOOD_OPTIONS } from './MoodTag'
import {
  VISIBILITY_COUPLE,
  VISIBILITY_SELF,
  createTimelineRecord,
  updateTimelineRecord,
  type LoveRecord,
} from '../services/timeline'
import { MEDIA_CHUNK_THRESHOLD_BYTES, uploadTimelineMediaAuto } from '../services/mediaChunkUpload'
import { resolveMediaUrl } from '../utils/mediaUrl'
import { isTimelineVideoUrl, validateTimelineUploadFile } from '../utils/timelineMedia'

type TimelineFormValues = {
  recordDate: dayjs.Dayjs
  content: string
  mood: string
  visibility: number
  locationName?: string
  lat?: string | number | null
  lng?: string | number | null
  tags?: string[]
}

type TimelineFormProps = {
  coupleId: string
  open: boolean
  /** 传入则为编辑模式 */
  editingRecord?: LoveRecord | null
  onClose: () => void
  onSuccess: () => void
}

function parseTags(json?: string | null): string[] {
  if (!json?.trim()) return []
  try {
    const arr = JSON.parse(json) as unknown
    if (Array.isArray(arr) && arr.every((x) => typeof x === 'string')) return arr
  } catch {
    /* ignore */
  }
  return []
}

function parseImages(json?: string | null): string[] {
  if (!json?.trim()) return []
  try {
    const arr = JSON.parse(json) as unknown
    if (Array.isArray(arr) && arr.every((x) => typeof x === 'string')) return arr
  } catch {
    /* ignore */
  }
  return []
}

/** 新建 / 编辑时间轴记录表单（弹窗内使用）。默认双方可见。 */
export default function TimelineForm({ coupleId, open, editingRecord, onClose, onSuccess }: TimelineFormProps) {
  const [form] = Form.useForm<TimelineFormValues>()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [preview, setPreview] = useState<{ video: boolean; url: string } | null>(null)
  const isEdit = Boolean(editingRecord)

  useEffect(() => {
    if (!open) return
    if (editingRecord) {
      const tags = parseTags(editingRecord.tagsJson)
      const urls = parseImages(editingRecord.imagesJson)
      let locationName: string | undefined
      let lat: string | undefined
      let lng: string | undefined
      if (editingRecord.locationJson?.trim()) {
        try {
          const o = JSON.parse(editingRecord.locationJson) as Record<string, unknown>
          if (typeof o.name === 'string') locationName = o.name
          if (typeof o.lat === 'number') lat = String(o.lat)
          if (typeof o.lng === 'number') lng = String(o.lng)
        } catch {
          /* ignore */
        }
      }
      form.setFieldsValue({
        recordDate: dayjs(editingRecord.recordDate),
        content: editingRecord.content,
        mood: editingRecord.mood,
        visibility: editingRecord.visibility ?? VISIBILITY_COUPLE,
        tags,
        locationName,
        lat,
        lng,
      })
      setFileList(
        urls.map((url, i) => ({
          uid: `existing-${i}`,
          name: isTimelineVideoUrl(url) ? `视频${i + 1}` : `图${i + 1}`,
          status: 'done' as const,
          url,
        })),
      )
    } else {
      form.setFieldsValue({
        recordDate: dayjs(),
        mood: 'happy',
        visibility: VISIBILITY_COUPLE,
        tags: [],
      })
      setFileList([])
    }
  }, [open, editingRecord, form])

  const toNum = (x: string | number | null | undefined) => {
    if (x === null || x === undefined || x === '') return NaN
    const n = Number(x)
    return Number.isFinite(n) ? n : NaN
  }

  const buildLocationJson = (v: TimelineFormValues): string | null => {
    const name = v.locationName?.trim()
    const latN = toNum(v.lat)
    const lngN = toNum(v.lng)
    const hasCoord = !Number.isNaN(latN) && !Number.isNaN(lngN)
    if (!name && !hasCoord) return null
    return JSON.stringify({
      ...(name ? { name } : {}),
      ...(hasCoord ? { lat: latN, lng: lngN } : {}),
    })
  }

  const collectImageUrls = (): string[] =>
    fileList
      .map((f) => (typeof f.url === 'string' ? f.url : (f.response as string | undefined)))
      .filter((u): u is string => Boolean(u))

  const onFinish = async (values: TimelineFormValues) => {
    setSubmitting(true)
    try {
      const urls = collectImageUrls()
      const tags = values.tags?.filter(Boolean) ?? []
      const locationJson = buildLocationJson(values)
      const tagsJson = tags.length ? JSON.stringify(tags) : null
      const imagesJson = urls.length ? JSON.stringify(urls) : null

      if (isEdit && editingRecord) {
        const body = {
          recordDate: values.recordDate.format('YYYY-MM-DD'),
          content: values.content.trim(),
          mood: values.mood,
          locationJson,
          visibility: values.visibility,
          tagsJson,
          imagesJson,
        }
        const resp = await updateTimelineRecord(editingRecord.id, body)
        if (resp.code !== 0) {
          throw new Error(resp.message || '更新失败')
        }
        message.success('记录已更新')
      } else {
        const body = {
          coupleId,
          recordDate: values.recordDate.format('YYYY-MM-DD'),
          content: values.content.trim(),
          mood: values.mood,
          locationJson,
          visibility: values.visibility,
          tagsJson,
          imagesJson,
        }
        const resp = await createTimelineRecord(body)
        if (resp.code !== 0) {
          throw new Error(resp.message || '创建失败')
        }
        message.success('记录已保存')
      }
      onSuccess()
      onClose()
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        recordDate: dayjs(),
        mood: 'happy',
        visibility: VISIBILITY_COUPLE,
        tags: [],
      }}
    >
      <Form.Item
        label="记录日期"
        name="recordDate"
        rules={[{ required: true, message: '请选择日期' }]}
      >
        <DatePicker className="w-full" />
      </Form.Item>
      <Form.Item
        label="文字内容"
        name="content"
        rules={[{ required: true, message: '请输入内容' }]}
      >
        <Input.TextArea rows={4} placeholder="今天想记下的事…" maxLength={2000} showCount />
      </Form.Item>
      <Form.Item label="心情" name="mood" rules={[{ required: true }]}>
        <Select options={[...MOOD_OPTIONS]} />
      </Form.Item>
      <Form.Item
        label="谁可见"
        name="visibility"
        rules={[{ required: true }]}
        extra="默认双方可见；仅自己可见时对方在时间轴中看不到本条。"
      >
        <Radio.Group
          options={[
            { label: '双方可见', value: VISIBILITY_COUPLE },
            { label: '仅自己可见', value: VISIBILITY_SELF },
          ]}
        />
      </Form.Item>
      <Form.Item label="位置名称（可选）" name="locationName">
        <Input placeholder="如：江滩公园" allowClear />
      </Form.Item>
      <div className="grid grid-cols-2 gap-2">
        <Form.Item label="纬度（可选）" name="lat">
          <Input type="number" step="any" placeholder="可选" />
        </Form.Item>
        <Form.Item label="经度（可选）" name="lng">
          <Input type="number" step="any" placeholder="可选" />
        </Form.Item>
      </div>
      <Form.Item label="标签（可选）" name="tags">
        <Select mode="tags" placeholder="输入后回车，如：约会、旅行" tokenSeparators={[',']} />
      </Form.Item>
      <Form.Item
        label="图片 / 视频（可选）"
        extra="图片单张≤20MB；视频单个≤100MB；大于 4MB 自动分片并支持断点续传。最多 9 个文件。"
      >
        <Upload
          listType="picture-card"
          fileList={fileList}
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.mov"
          beforeUpload={(file) => {
            const err = validateTimelineUploadFile(file)
            if (err) {
              message.error(err)
              return Upload.LIST_IGNORE
            }
            return true
          }}
          onPreview={(file) => {
            const raw = typeof file.url === 'string' ? file.url : (file.response as string | undefined)
            if (!raw) return
            const u = resolveMediaUrl(raw)
            setPreview({ video: isTimelineVideoUrl(u), url: u })
          }}
          customRequest={async ({ file, onSuccess, onError }) => {
            try {
              const url = await uploadTimelineMediaAuto(file as File, MEDIA_CHUNK_THRESHOLD_BYTES)
              onSuccess?.(url, new XMLHttpRequest())
            } catch (err) {
              onError?.(err as Error)
              message.error(err instanceof Error ? err.message : '上传失败')
            }
          }}
          onChange={({ fileList: fl }) => {
            const next = fl.map((f) => {
              if (f.status === 'done' && f.response && !f.url) {
                return { ...f, url: f.response as string }
              }
              return f
            })
            setFileList(next)
          }}
          onRemove={(file) => {
            setFileList((prev) => prev.filter((f) => f.uid !== file.uid))
            return true
          }}
        >
          {fileList.length >= 9 ? null : <div>上传</div>}
        </Upload>
      </Form.Item>
      <Modal
        open={preview != null}
        footer={null}
        onCancel={() => setPreview(null)}
        width={720}
        destroyOnClose
        title={preview?.video ? '视频预览' : '图片预览'}
      >
        {preview?.video ? (
          <video src={preview.url} controls className="max-h-[70vh] w-full rounded bg-black" playsInline />
        ) : preview ? (
          <img src={preview.url} alt="" className="max-h-[70vh] w-full object-contain" />
        ) : null}
      </Modal>
      <Form.Item className="!mb-0">
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            {isEdit ? '保存修改' : '保存'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  )
}
