import { PriceHistory } from '@/types';

export interface PriceAnalysis {
  currentPercentile: number; // 0-100, lower is cheaper
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  trend: 'up' | 'down' | 'stable';
  trendDays: number;
  recommendation: string;
  confidence: number;
  bestMonthToBuy?: string;
}

export function analyzePriceHistory(history: PriceHistory[]): PriceAnalysis {
  if (history.length === 0) {
    return {
      currentPercentile: 50,
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      trend: 'stable',
      trendDays: 0,
      recommendation: '데이터 수집 중...',
      confidence: 0,
    };
  }

  const prices = history.map(h => h.price);
  const currentPrice = prices[prices.length - 1];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  // Percentile (lower = cheaper = better deal)
  const sorted = [...prices].sort((a, b) => a - b);
  const rank = sorted.indexOf(currentPrice);
  const currentPercentile = Math.round((rank / sorted.length) * 100);

  // Trend detection
  const recentPrices = prices.slice(-7);
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendDays = 0;
  if (recentPrices.length >= 3) {
    const last = recentPrices[recentPrices.length - 1];
    const first = recentPrices[0];
    const change = ((last - first) / first) * 100;
    if (change < -3) { trend = 'down'; trendDays = recentPrices.length; }
    else if (change > 3) { trend = 'up'; trendDays = recentPrices.length; }
  }

  // Recommendation
  let recommendation = '';
  let confidence = 70;
  if (currentPercentile <= 10) {
    recommendation = '역대 최저가 근처입니다! 지금 사세요 🔥';
    confidence = 92;
  } else if (currentPercentile <= 25) {
    recommendation = '지금은 꽤 저렴한 편이에요 👍';
    confidence = 85;
  } else if (trend === 'down') {
    recommendation = '가격이 계속 하락 중이에요. 조금만 더 기다려봐요 ⏳';
    confidence = 78;
  } else if (currentPercentile >= 75) {
    recommendation = '현재 가격은 비싼 편이에요. 기다리는 게 좋을 것 같아요 💭';
    confidence = 80;
  } else {
    recommendation = '평균 가격대입니다. 급하지 않다면 조금 더 기다려봐요 🤔';
    confidence = 72;
  }

  // Best month analysis
  const monthlyAvg: Record<string, number[]> = {};
  history.forEach(h => {
    const month = new Date(h.recorded_at).getMonth() + 1;
    const key = String(month);
    if (!monthlyAvg[key]) monthlyAvg[key] = [];
    monthlyAvg[key].push(h.price);
  });

  let bestMonth: string | undefined;
  if (Object.keys(monthlyAvg).length >= 3) {
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    let minAvg = Infinity;
    let minMonthIdx = 0;
    Object.entries(monthlyAvg).forEach(([month, priceArr]) => {
      const avg = priceArr.reduce((a, b) => a + b, 0) / priceArr.length;
      if (avg < minAvg) { minAvg = avg; minMonthIdx = parseInt(month) - 1; }
    });
    bestMonth = monthNames[minMonthIdx];
  }

  return {
    currentPercentile,
    avgPrice,
    minPrice,
    maxPrice,
    trend,
    trendDays,
    recommendation,
    confidence,
    bestMonthToBuy: bestMonth,
  };
}
