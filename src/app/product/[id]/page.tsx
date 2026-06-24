'use client';
import { useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { analyzePriceHistory } from '@/lib/price-analyzer';
import { PriceHistory } from '@/types';
import { share, getTossShareLink } from '@/lib/apps-in-toss';

const PRODUCT_DATA: Record<string, {
  id: string; name: string; brand: string; category: string;
  image: string; currentPrice: number; lowestEver: number;
  tracking: number; shop: string;
}> = {
  p1: { id: 'p1', name: '삼다수 2L x 12개', brand: '삼다수', category: '생수', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', currentPrice: 8900, lowestEver: 7900, tracking: 1842, shop: '쿠팡' },
  p2: { id: 'p2', name: '하기스 매직팬티 여아 4단계', brand: '하기스', category: '기저귀', image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400', currentPrice: 31500, lowestEver: 28900, tracking: 3201, shop: '네이버스토어' },
  'a1b2c3d4-0000-0000-0000-000000000001': { id: 'a1b2c3d4-0000-0000-0000-000000000001', name: '삼다수 2L x 12개', brand: '삼다수', category: '생수', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', currentPrice: 8900, lowestEver: 7900, tracking: 1842, shop: '쿠팡' },
};

const DEFAULT_PRODUCT = { id: 'demo', name: '삼다수 2L x 12개', brand: '삼다수', category: '생수', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', currentPrice: 8900, lowestEver: 7900, tracking: 1842, shop: '쿠팡' };

const PRICE_DATA: Record<string, Record<string, number[]>> = {
  '1w': {
    coupang: [9200, 9100, 9000, 8950, 8900, 8900, 8900],
    naver: [9500, 9400, 9200, 9100, 9050, 8950, 8980],
    gmarket: [9800, 9800, 9600, 9500, 9300, 9200, 9100],
  },
  '1m': {
    coupang: [10200, 10000, 9800, 9600, 9400, 9200, 9100, 9000, 8900, 8900, 8900, 8900, 8900, 8900, 8900, 8900, 8850, 8900, 8900, 8900, 8900, 8900, 8900, 8900, 8900, 8900, 8900, 8900, 8900, 8900],
    naver: [10500, 10200, 10000, 9800, 9600, 9400, 9300, 9200, 9100, 9050, 9000, 8980, 8960, 8950, 8950, 8940, 8940, 8940, 8960, 8970, 8980, 8980, 8980, 8980, 8980, 8980, 8980, 8980, 8980, 8980],
    gmarket: [11000, 10800, 10600, 10400, 10200, 10000, 9900, 9800, 9700, 9600, 9500, 9400, 9300, 9250, 9200, 9200, 9200, 9150, 9100, 9100, 9100, 9100, 9100, 9100, 9100, 9100, 9100, 9100, 9100, 9100],
  },
};

const SHOP_PRICES = [
  { name: '쿠팡', price: 8900, shipping: '무료', badge: '최저가', url: '#' },
  { name: '네이버스토어', price: 8980, shipping: '무료', badge: '', url: '#' },
  { name: 'G마켓', price: 9100, shipping: '2500원', badge: '', url: '#' },
  { name: '11번가', price: 9200, shipping: '무료', badge: '', url: '#' },
  { name: '이마트몰', price: 9500, shipping: '무료', badge: '', url: '#' },
];

function PriceChart({ data, period }: { data: Record<string, number[]>; period: string }) {
  const allPrices = Object.values(data).flat();
  const min = Math.min(...allPrices) * 0.99;
  const max = Math.max(...allPrices) * 1.01;
  const range = max - min;
  const width = 340;
  const height = 140;
  const padding = { top: 10, bottom: 20, left: 48, right: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const colors = { coupang: '#ffb700', naver: '#03c75a', gmarket: '#ee2c00' };
  const labels = { coupang: '쿠팡', naver: '네이버', gmarket: 'G마켓' };

  const getPath = (prices: number[]) => {
    return prices.map((p, i) => {
      const x = padding.left + (i / (prices.length - 1)) * chartW;
      const y = padding.top + chartH - ((p - min) / range) * chartH;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  };

  const yLabels = [min, min + range * 0.5, max].map(v => Math.round(v));

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        {/* Y-axis labels */}
        {yLabels.map((label, i) => (
          <text
            key={i}
            x={padding.left - 6}
            y={padding.top + chartH - (i / 2) * chartH + 4}
            textAnchor="end"
            className="fill-slate-400"
            fontSize="9"
          >
            {(label / 1000).toFixed(1)}k
          </text>
        ))}
        {/* Grid lines */}
        {[0, 0.5, 1].map((t, i) => (
          <line
            key={i}
            x1={padding.left}
            x2={padding.left + chartW}
            y1={padding.top + chartH - t * chartH}
            y2={padding.top + chartH - t * chartH}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
        ))}
        {/* Price lines */}
        {Object.entries(data).map(([key, prices]) => (
          <path
            key={key}
            d={getPath(prices)}
            fill="none"
            stroke={colors[key as keyof typeof colors]}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-1 pl-12">
        {Object.entries(labels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: colors[key as keyof typeof colors] }} />
            <span className="text-[10px] text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

async function handleShare(productName: string, productId: string, currentPrice: number) {
  const url = `${window.location.origin}/product/${productId}`;
  const link = await getTossShareLink(url);
  await share({
    message: `[짠내왕] ${productName} 지금 ${formatPrice(currentPrice)}! 최저가 같이 추적해요 👑\n${link}`,
  });
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = PRODUCT_DATA[params.id] || DEFAULT_PRODUCT;
  const [period, setPeriod] = useState<'1w' | '1m' | '3m' | '6m' | '1y'>('1m');
  const [isTracked, setIsTracked] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');

  const chartData = PRICE_DATA[period] || PRICE_DATA['1m'];

  // Mock price history for analysis
  const mockHistory: PriceHistory[] = (PRICE_DATA['1m'].coupang || []).map((price, i) => ({
    id: String(i),
    product_id: product.id,
    shop_name: '쿠팡',
    price,
    affiliate_url: null,
    recorded_at: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
  }));

  const analysis = analyzePriceHistory(mockHistory);
  const isPro = false; // Mock: free user

  const periodLabels = ['1w', '1m', '3m', '6m', '1y'];

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/search">
            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
          </Link>
          <h1 className="text-base font-bold text-slate-900 line-clamp-1">{product.name}</h1>
        </div>
        <button
          onClick={() => handleShare(product.name, product.id, product.currentPrice)}
          className="p-2 hover:bg-slate-100 rounded-full"
        >
          <span className="material-symbols-outlined text-slate-600">share</span>
        </button>
      </header>

      <div className="bg-white">
        {/* Product image + basic info */}
        <div className="flex gap-4 p-4">
          <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{product.brand} · {product.category}</p>
            <h2 className="text-base font-bold text-slate-900 mt-1 leading-snug">{product.name}</h2>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-primary">{formatPrice(product.currentPrice)}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                역대 최저 <span className="font-bold text-green-600">{formatPrice(product.lowestEver)}</span>
              </p>
            </div>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-400">
              <span className="material-symbols-outlined text-[13px]">visibility</span>
              {product.tracking.toLocaleString()}명 추적
            </div>
          </div>
        </div>

        {/* CTA button */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => { setIsTracked(!isTracked); setShowTargetModal(!isTracked); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-base transition-all active:scale-95 ${
              isTracked
                ? 'bg-slate-100 text-slate-600'
                : 'bg-primary text-white shadow-lg shadow-primary/30'
            }`}
          >
            <span className="material-symbols-outlined">
              {isTracked ? 'notifications_active' : 'notifications_none'}
            </span>
            {isTracked ? '감시 중 👁️' : '감시 시작 👁️'}
          </button>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            구매
          </a>
        </div>

        {/* Period tabs */}
        <div className="flex gap-1 px-4 pb-3">
          {periodLabels.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p as typeof period)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                period === p ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Price chart */}
        <div className="px-4 pb-4">
          <PriceChart data={chartData} period={period} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-slate-400 mb-1">최저가</p>
            <p className="text-sm font-bold text-green-600">{formatPrice(analysis.minPrice || product.lowestEver)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-slate-400 mb-1">평균가</p>
            <p className="text-sm font-bold text-slate-700">{formatPrice(analysis.avgPrice || product.currentPrice)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-slate-400 mb-1">최고가</p>
            <p className="text-sm font-bold text-red-500">{formatPrice(analysis.maxPrice || product.currentPrice + 3000)}</p>
          </div>
        </div>
      </div>

      {/* AI Analysis card */}
      <div className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-base">🤖</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">AI 가격 분석</p>
              <p className="text-[10px] text-slate-400">신뢰도 {analysis.confidence}%</p>
            </div>
          </div>
          {!isPro && (
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">lock</span>
              PRO
            </span>
          )}
        </div>
        <div className={!isPro ? 'blur-sm select-none pointer-events-none' : ''}>
          {/* Price percentile indicator */}
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>역대 최저</span>
              <span>현재 위치</span>
              <span>역대 최고</span>
            </div>
            <div className="h-2.5 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full relative">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md transition-all"
                style={{ left: `calc(${analysis.currentPercentile}% - 8px)` }}
              />
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 mb-2">
            <p className="text-sm font-bold text-slate-800">{analysis.recommendation}</p>
          </div>
          {analysis.bestMonthToBuy && (
            <p className="text-xs text-slate-500">
              통계적으로 <span className="font-bold text-primary">{analysis.bestMonthToBuy}</span>에 가장 저렴해요
            </p>
          )}
        </div>
        {!isPro && (
          <Link href="/premium">
            <button className="mt-3 w-full py-2.5 rounded-xl bg-primary text-sm font-bold text-white">
              PRO로 업그레이드하고 분석 보기
            </button>
          </Link>
        )}
      </div>

      {/* Price comparison table */}
      <div className="mx-4 mt-3 mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">쇼핑몰별 가격 비교</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {SHOP_PRICES.map((shop, i) => (
            <a key={i} href={shop.url} target="_blank" rel="noopener noreferrer">
              <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-500 text-[16px]">storefront</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{shop.name}</p>
                    <p className="text-[10px] text-slate-400">배송비 {shop.shipping}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {shop.badge && (
                    <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded">{shop.badge}</span>
                  )}
                  <p className="text-sm font-bold text-slate-900">{formatPrice(shop.price)}</p>
                  <span className="material-symbols-outlined text-slate-300 text-[18px]">chevron_right</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Target price modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTargetModal(false)} />
          <div className="relative w-full max-w-[430px] bg-white rounded-t-2xl p-6 pb-10 animate-slide-up">
            <h3 className="text-lg font-bold mb-1">목표 가격 설정</h3>
            <p className="text-xs text-slate-400 mb-4">이 가격 이하로 내려가면 알려드릴게요</p>
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-3 mb-4">
              <span className="text-slate-500 font-bold">₩</span>
              <input
                type="number"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                placeholder={String(product.lowestEver)}
                className="flex-1 bg-transparent text-lg font-bold text-slate-900 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowTargetModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600">
                건너뛰기
              </button>
              <button
                onClick={() => setShowTargetModal(false)}
                className="flex-1 py-3 rounded-xl bg-primary text-sm font-bold text-white"
              >
                설정 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
