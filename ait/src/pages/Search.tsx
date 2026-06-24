import { useState } from 'react';
import { Link } from "react-router-dom";
import { formatPrice } from '@/lib/utils';

const CATEGORIES = ['생수', '기저귀', '라면', '세제', '화장지', '커피', '샴푸', '치약', '밀키트', '과자'];

const MOCK_PRODUCTS = [
  {
    id: 'p1',
    name: '삼다수 2L x 12개',
    brand: '삼다수',
    category: '생수',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
    currentPrice: 8900,
    lowestEver: 7900,
    shop: '쿠팡',
    tracking: 1842,
    discount: 11,
    sparkline: [9500, 9200, 9000, 8900, 8800, 8900],
  },
  {
    id: 'p2',
    name: '하기스 매직팬티 여아 4단계 52매',
    brand: '하기스',
    category: '기저귀',
    image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=200',
    currentPrice: 31500,
    lowestEver: 28900,
    shop: '네이버스토어',
    tracking: 3201,
    discount: 9,
    sparkline: [35000, 33500, 32000, 32500, 31800, 31500],
  },
  {
    id: 'p3',
    name: '신라면 120g x 20개',
    brand: '농심',
    category: '라면',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200',
    currentPrice: 13200,
    lowestEver: 11500,
    shop: '쿠팡',
    tracking: 2567,
    discount: 17,
    sparkline: [15000, 14500, 14000, 13500, 13200, 13200],
  },
  {
    id: 'p4',
    name: '피죤 울트라 세탁세제 5L',
    brand: '피죤',
    category: '세제',
    image: 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=200',
    currentPrice: 11500,
    lowestEver: 9800,
    shop: '11번가',
    tracking: 987,
    discount: 17,
    sparkline: [13000, 12500, 12000, 11800, 11500, 11500],
  },
  {
    id: 'p5',
    name: '크리넥스 3겹 화장지 30롤',
    brand: '크리넥스',
    category: '화장지',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=200',
    currentPrice: 21000,
    lowestEver: 18900,
    shop: '이마트몰',
    tracking: 1456,
    discount: 11,
    sparkline: [24000, 23000, 22000, 21500, 21000, 21000],
  },
  {
    id: 'p6',
    name: '맥심 모카골드 커피믹스 100개입',
    brand: '동서식품',
    category: '커피',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200',
    currentPrice: 14800,
    lowestEver: 12500,
    shop: '쿠팡',
    tracking: 2134,
    discount: 18,
    sparkline: [17000, 16500, 15500, 15000, 14800, 14800],
  },
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());

  const filtered = MOCK_PRODUCTS.filter(p => {
    const matchesQuery = !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.brand.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const toggleTrack = (id: string) => {
    setTrackedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/">
            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
          </Link>
          <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
            <input
              type="text"
              placeholder="상품명, 브랜드 검색"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none font-medium"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')}>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>
        {/* Category chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('')}
            className={`flex-none px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              !selectedCategory ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            전체
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
              className={`flex-none px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                cat === selectedCategory ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Results count */}
      <div className="px-4 py-2 bg-white border-b border-slate-100">
        <p className="text-xs text-slate-500 font-medium">
          {filtered.length}개 상품 {query && <span className="text-primary font-bold">&ldquo;{query}&rdquo;</span>}
        </p>
      </div>

      {/* Product list */}
      <div className="bg-white">
        {filtered.map((product) => (
          <div key={product.id} className="flex items-start gap-3 p-4 border-b border-slate-50">
            <Link to={`/product/${product.id}`}>
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{product.brand} · {product.category}</p>
              <Link to={`/product/${product.id}`}>
                <h4 className="text-sm font-semibold text-slate-800 leading-snug mt-0.5 line-clamp-2 hover:text-primary transition-colors">
                  {product.name}
                </h4>
              </Link>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-primary font-extrabold text-base">{formatPrice(product.currentPrice)}</span>
                <span className="text-[11px] text-slate-400 line-through">{formatPrice(product.lowestEver)}</span>
                <span className="text-[11px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">-{product.discount}%</span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[13px]">storefront</span>
                  {product.shop}
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[13px]">visibility</span>
                  {product.tracking.toLocaleString()}명 추적
                </span>
              </div>
            </div>
            <button
              onClick={() => toggleTrack(product.id)}
              className={`shrink-0 mt-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                trackedIds.has(product.id)
                  ? 'border-slate-200 text-slate-400 bg-slate-50'
                  : 'border-primary text-primary bg-primary/5 hover:bg-primary/10'
              }`}
            >
              {trackedIds.has(product.id) ? '추적중' : '추적'}
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <span className="material-symbols-outlined text-6xl mb-3">search_off</span>
            <p className="text-sm font-medium">검색 결과가 없어요</p>
            <p className="text-xs mt-1">다른 키워드로 검색해보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
