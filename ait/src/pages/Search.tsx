import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import useSWR from "swr";
import { api, ApiError } from "@/lib/api";
import { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import EmptyState from "@/components/ui/EmptyState";

// 인기 검색어 — 누르면 그 키워드로 바로 검색합니다(클라이언트 필터 아님).
const KEYWORDS = ['생수', '기저귀', '라면', '세제', '화장지', '커피', '샴푸', '치약', '밀키트', '과자'];

export default function Search() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const trimmed = query.trim();

  const { data, isLoading } = useSWR(
    trimmed ? `/api/search?q=${encodeURIComponent(trimmed)}` : null,
    (path) => api.get<{ products: Product[]; total: number }>(path),
  );

  const products = data?.products ?? [];

  // Persist a Naver search result into our DB and return the internal product.
  const resolveProduct = async (p: Product): Promise<Product> => {
    const res = await api.post<{ product: Product }>("/api/products/resolve", {
      naver_product_id: p.naver_product_id ?? p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      image_url: p.image_url,
      price: p.current_lowest_price,
      shop: p.current_lowest_shop,
    });
    return res.product;
  };

  const openProduct = async (p: Product) => {
    setBusyId(p.id);
    try {
      const internal = await resolveProduct(p);
      navigate(`/product/${internal.id}`);
    } catch {
      navigate(`/product/${p.id}`);
    } finally {
      setBusyId(null);
    }
  };

  const toggleTrack = async (naverId: string) => {
    const product = products.find((p) => p.id === naverId);
    if (!product) return;
    const wasTracked = trackedIds.has(naverId);
    setTrackedIds((prev) => {
      const next = new Set(prev);
      if (wasTracked) next.delete(naverId);
      else next.add(naverId);
      return next;
    });
    try {
      const internal = await resolveProduct(product);
      if (wasTracked) await api.del("/api/tracking", { product_id: internal.id });
      else await api.post("/api/tracking", { product_id: internal.id });
    } catch (err) {
      setTrackedIds((prev) => {
        const next = new Set(prev);
        if (wasTracked) next.add(naverId);
        else next.delete(naverId);
        return next;
      });
      if (err instanceof ApiError && err.status === 401)
        alert("토스 계정 연결 중이에요. 잠시 후 다시 시도해주세요.");
      else if (err instanceof ApiError && err.status === 429)
        alert("추적 슬롯이 가득 찼어요. 광고를 보거나 레벨을 올려 늘려보세요!");
    }
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
              onChange={(e) => setQuery(e.target.value)}
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
        {/* 인기 검색어 — 누르면 해당 키워드로 검색 */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {KEYWORDS.map((kw) => (
            <button
              key={kw}
              onClick={() => setQuery(kw)}
              className={`flex-none px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                trimmed === kw ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {kw}
            </button>
          ))}
        </div>
      </header>

      {!trimmed ? (
        <EmptyState
          icon="search"
          title="무엇을 찾고 있나요?"
          description="상품명이나 브랜드로 검색해 최저가를 추적해보세요"
        />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl text-slate-300">progress_activity</span>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon="search_off"
          title="검색 결과가 없어요"
          description="다른 키워드로 검색해보세요"
        />
      ) : (
        <>
          {/* Results count */}
          <div className="px-4 py-2 bg-white border-b border-slate-100">
            <p className="text-xs text-slate-500 font-medium">
              {products.length}개 상품 <span className="text-primary font-bold">&ldquo;{trimmed}&rdquo;</span>
            </p>
          </div>

          {/* Product list */}
          <div className="bg-white">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showTrackButton
                onTrack={toggleTrack}
                isTracked={trackedIds.has(product.id)}
                onOpen={() => openProduct(product)}
              />
            ))}
            {busyId && (
              <p className="py-3 text-center text-xs text-slate-400">상품 정보를 불러오는 중...</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
