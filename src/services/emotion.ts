import type { ApiResponse } from '../types/api'
import { http } from './http'

export type OverallMood = 'positive' | 'neutral' | 'negative'

/** GET /api/v1/ai/emotion 返回的 data */
export type EmotionAnalysisReport = {
  overallMood: OverallMood
  moodScore: number
  emotionDistribution: Record<string, number>
  trendData: Array<{ date: string; moodScore: number; dominantMood: string }>
  insights: string
}

/**
 * 情感分析报告（含通义千问解读，可能较慢）。
 */
export async function getEmotionReport(
  coupleId: string,
  startDate?: string | null,
  endDate?: string | null,
  signal?: AbortSignal,
) {
  const { data } = await http.get<ApiResponse<EmotionAnalysisReport>>('/api/v1/ai/emotion', {
    params: {
      coupleId,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    },
    timeout: 120_000,
    signal,
  })
  return data
}
