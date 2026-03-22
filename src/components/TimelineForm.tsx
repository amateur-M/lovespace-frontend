import { Button, DatePicker, Form, Input, Select, Upload, message } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { MOOD_OPTIONS } from './MoodTag'
import { createTimelineRecord, uploadTimelineImage } from '../services/timeline'

type TimelineFormValues = {
  recordDate: dayjs.Dayjs
  content: string
  mood: string
  locationName?: string
  lat?: string | number | null
  lng?: string | number | null
  tags?: string[]
}

const MAX_IMAGE_MB = 2
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type TimelineFormProps = {
  coupleId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

/** 新建时间轴记录表单（弹窗内使用）。 */
export default function TimelineForm({ coupleId, open, onClose, onSuccess }: TimelineFormProps) {
  const [form] = Form.useForm<TimelineFormValues>()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        recordDate: dayjs(),
        mood: 'happy',
        tags: [],
      })
      setFileList([])
    }
  }, [open, form])

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
      const body = {
        coupleId,
        recordDate: values.recordDate.format('YYYY-MM-DD'),
        content: values.content.trim(),
        mood: values.mood,
        locationJson: buildLocationJson(values),
        visibility: 2,
        tagsJson: tags.length ? JSON.stringify(tags) : null,
        imagesJson: urls.length ? JSON.stringify(urls) : null,
      }
      const resp = await createTimelineRecord(body)
      if (resp.code !== 0) {
        throw new Error(resp.message || '创建失败')
      }
      message.success('记录已保存')
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
      <Form.Item label="图片（可选）">
        <Upload
          listType="picture-card"
          fileList={fileList}
          multiple
          beforeUpload={(file) => {
            if (!ALLOWED_TYPES.includes(file.type)) {
              message.error('仅支持 jpg/png/webp')
              return Upload.LIST_IGNORE
            }
            if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
              message.error(`单张不超过 ${MAX_IMAGE_MB}MB`)
              return Upload.LIST_IGNORE
            }
            return true
          }}
          customRequest={async ({ file, onSuccess, onError }) => {
            try {
              const resp = await uploadTimelineImage(file as File)
              if (resp.code !== 0 || !resp.data) {
                throw new Error(resp.message || '上传失败')
              }
              onSuccess?.(resp.data, new XMLHttpRequest())
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
      <Form.Item className="!mb-0">
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            保存
          </Button>
        </div>
      </Form.Item>
    </Form>
  )
}
