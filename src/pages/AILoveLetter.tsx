import { CopyOutlined, EditOutlined, HeartOutlined, SendOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Select,
  Spin,
  Typography,
  message,
} from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  generateLoveLetter,
  type LoveLetterLength,
  type LoveLetterStyle,
} from '../services/loveLetter'
import { useAuthStore } from '../stores/authStore'
import { useCoupleStore } from '../stores/coupleStore'

const { Title, Paragraph, Text } = Typography

const STYLE_OPTIONS: { value: LoveLetterStyle; label: string }[] = [
  { value: 'romantic', label: '浪漫（romantic）' },
  { value: 'humorous', label: '幽默（humorous）' },
  { value: 'sincere', label: '真挚（sincere）' },
]

const LENGTH_OPTIONS: { value: LoveLetterLength; label: string }[] = [
  { value: 'short', label: '短篇（约200字）' },
  { value: 'medium', label: '中篇（约400字）' },
  { value: 'long', label: '长篇（约800字）' },
]

type FormValues = {
  style: LoveLetterStyle
  length: LoveLetterLength
  memories?: string
}

export default function AILoveLetterPage() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const fetchCoupleInfo = useCoupleStore((s) => s.fetchCoupleInfo)
  const coupleLoading = useCoupleStore((s) => s.loading)
  const coupleInfo = useCoupleStore((s) => s.info)
  const coupleId = coupleInfo?.bindingId ?? null
  const partnerName = coupleInfo?.partner?.username
  const days = coupleInfo?.relationshipDays

  const [form] = Form.useForm<FormValues>()
  const [letter, setLetter] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthed) return
    fetchCoupleInfo().catch(() => undefined)
  }, [isAuthed, fetchCoupleInfo])

  useEffect(() => {
    form.setFieldsValue({
      style: 'romantic',
      length: 'medium',
      memories: undefined,
    })
  }, [form])

  const onFinish = useCallback(
    async (values: FormValues) => {
      if (!coupleId) return
      setSubmitting(true)
      setLetter(null)
      try {
        const resp = await generateLoveLetter({
          coupleId,
          style: values.style,
          length: values.length,
          memories: values.memories?.trim() || undefined,
        })
        if (resp.code !== 0 || resp.data == null) {
          throw new Error(resp.message || '生成失败')
        }
        setLetter(resp.data.content)
        message.success('情书已生成')
      } catch (e) {
        message.error(e instanceof Error ? e.message : '生成失败')
      } finally {
        setSubmitting(false)
      }
    },
    [coupleId],
  )

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <section
        className="relative overflow-hidden rounded-3xl border border-rose-200/85 bg-gradient-to-br from-white via-rose-50/90 to-fuchsia-50/30 px-5 py-8 shadow-sm sm:px-8 sm:py-10"
        aria-labelledby="love-letter-hero-title"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-rose-300/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-fuchsia-200/30 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/90 bg-white/80 px-3 py-1 text-xs font-medium text-rose-900/80 shadow-sm backdrop-blur-sm">
              <EditOutlined className="text-rose-600" aria-hidden />
              AI 情书
            </div>
            <Title
              level={2}
              id="love-letter-hero-title"
              className="!mb-0 !text-2xl !font-semibold !tracking-tight !text-stone-900 sm:!text-3xl"
            >
              把心里话写成一封信
            </Title>
            <Paragraph className="!mb-0 ls-page-intro !text-[15px]">
              使用双方昵称、恋爱天数与共同回忆（可补充文字；留空则自动摘取近一年时间轴记录），由通义千问按所选风格与篇幅生成情书正文。
            </Paragraph>
          </div>
          {coupleId && partnerName != null && (
            <div className="rounded-2xl border border-rose-200/80 bg-white/90 px-4 py-3 text-sm text-stone-700 shadow-sm">
              <span className="text-stone-500">致 </span>
              <Text strong className="text-rose-900">
                {partnerName}
              </Text>
              {days != null ? (
                <span className="text-stone-600"> · 已相恋 {days} 天</span>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {coupleLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spin size="large" tip="加载情侣信息…" />
        </div>
      ) : !coupleId ? (
        <Card className="ls-surface !border-dashed !border-rose-300/80 !bg-white/90">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="请先完成情侣绑定后再生成情书"
          >
            <Link
              to="/couple"
              className="ls-link inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 font-medium"
            >
              <HeartOutlined aria-hidden />
              前往情侣首页
            </Link>
          </Empty>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <Card
            className="ls-surface lg:col-span-5"
            title={<span className="font-medium text-stone-900">生成设置</span>}
          >
            <Form<FormValues>
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              className="max-w-md"
            >
              <Form.Item
                label="风格"
                name="style"
                rules={[{ required: true, message: '请选择风格' }]}
              >
                <Select
                  options={STYLE_OPTIONS}
                  className="!rounded-xl"
                  placeholder="选择文风"
                />
              </Form.Item>
              <Form.Item
                label="篇幅"
                name="length"
                rules={[{ required: true, message: '请选择篇幅' }]}
              >
                <Select
                  options={LENGTH_OPTIONS}
                  className="!rounded-xl"
                  placeholder="选择字数规模"
                />
              </Form.Item>
              <Form.Item label="共同回忆（可选）" name="memories">
                <Input.TextArea
                  rows={5}
                  maxLength={8000}
                  showCount
                  placeholder="写下你们的故事、纪念日、小默契…留空则自动从恋爱时间轴摘取近期记录摘要"
                  className="!rounded-xl"
                />
              </Form.Item>
              <Form.Item className="!mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  icon={<SendOutlined />}
                  className="!h-11 !rounded-xl !border-rose-300/90 !bg-rose-600 !px-6 shadow-sm hover:!bg-rose-700"
                >
                  生成情书
                </Button>
              </Form.Item>
            </Form>
            <Alert
              type="info"
              showIcon
              className="mt-4 !rounded-xl !border-rose-200/80 !bg-rose-50/80"
              message="提示"
              description="生成可能需要数十秒；发送方、接收方姓名与恋爱天数由服务端根据当前登录用户与情侣资料自动填充。"
            />
          </Card>

          <Card
            className="ls-surface relative min-h-[320px] overflow-hidden lg:col-span-7"
            title={<span className="font-medium text-stone-900">情书正文</span>}
            extra={
              letter ? (
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(letter)
                      message.success('已复制到剪贴板')
                    } catch {
                      message.error('复制失败')
                    }
                  }}
                  className="cursor-pointer text-rose-800"
                >
                  复制全文
                </Button>
              ) : null
            }
          >
            {submitting && !letter ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 py-12">
                <Spin size="large" />
                <Text className="text-rose-900/75">正在执笔，请稍候…</Text>
              </div>
            ) : letter ? (
              <Typography>
                <Paragraph className="!mb-0 whitespace-pre-wrap text-[15px] leading-[1.85] text-stone-800">
                  {letter}
                </Paragraph>
              </Typography>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="填写左侧选项后点击「生成情书」"
                className="py-12"
              />
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
