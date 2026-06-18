import { Card, Col, Row, Statistic, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { fetchDashboardStats, type AdminDashboardStats } from '../../services/admin/dashboard'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetchDashboardStats()
      if (resp.code !== 0) throw new Error(resp.message)
      setStats(resp.data)
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载统计失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const items = [
    { title: '用户', value: stats?.userCount },
    { title: '情侣绑定', value: stats?.coupleCount },
    { title: '时间轴', value: stats?.timelineRecordCount },
    { title: '相册', value: stats?.albumCount },
    { title: '照片', value: stats?.photoCount },
    { title: '私信', value: stats?.messageCount },
    { title: '计划', value: stats?.planCount },
    { title: '纪念日', value: stats?.memorialDayCount },
    { title: '问答文档', value: stats?.loveQaDocumentCount },
    { title: '问答会话', value: stats?.loveQaConversationCount },
  ]

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-stone-800">仪表盘</h1>
      <Row gutter={[16, 16]}>
        {items.map((item) => (
          <Col xs={12} sm={8} md={6} lg={4} key={item.title}>
            <Card loading={loading}>
              <Statistic title={item.title} value={item.value ?? 0} />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
