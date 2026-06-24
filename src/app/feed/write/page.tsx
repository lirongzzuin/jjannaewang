'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FeedWritePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopUrl, setShopUrl] = useState('');
  const [dealPrice, setDealPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = title.trim().length >= 3 && shopName.trim() && dealPrice;

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'mock-user-001',
          title: title.trim(),
          description: description.trim() || undefined,
          shop_name: shopName.trim(),
          shop_url: shopUrl.trim() || undefined,
          deal_price: Number(dealPrice),
          original_price: originalPrice ? Number(originalPrice) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || '등록에 실패했어요. 다시 시도해주세요.');
        return;
      }
      router.push('/feed');
    } catch {
      alert('네트워크 오류가 발생했어요. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()}>
          <span className="material-symbols-outlined text-slate-600">close</span>
        </button>
        <h1 className="text-base font-extrabold text-slate-900">특가 제보</h1>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
            canSubmit && !isSubmitting
              ? 'bg-primary text-white active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? '등록 중...' : '등록'}
        </button>
      </header>

      <div className="p-4 space-y-5">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-700">제목 <span className="text-red-500">*</span></p>
            <span className="text-xs text-slate-400">{title.length}/100</span>
          </div>
          <input
            type="text"
            value={title}
            onChange={e => { if (e.target.value.length <= 100) setTitle(e.target.value); }}
            placeholder="예: 삼다수 2L x 12개 역대 최저가!"
            className="w-full bg-slate-50 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-800 placeholder-slate-300 outline-none border border-slate-200 focus:border-primary transition-colors"
          />
        </div>

        {/* Shop name + URL */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">쇼핑몰 <span className="text-red-500">*</span></p>
            <input
              type="text"
              value={shopName}
              onChange={e => setShopName(e.target.value)}
              placeholder="쿠팡, 네이버..."
              className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 outline-none border border-slate-200 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">특가 링크</p>
            <input
              type="url"
              value={shopUrl}
              onChange={e => setShopUrl(e.target.value)}
              placeholder="https://"
              className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 outline-none border border-slate-200 focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">특가 <span className="text-red-500">*</span></p>
            <div className="flex items-center gap-1 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 focus-within:border-primary transition-colors">
              <span className="text-slate-400 text-sm font-bold">₩</span>
              <input
                type="number"
                value={dealPrice}
                onChange={e => setDealPrice(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">정가 (선택)</p>
            <div className="flex items-center gap-1 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 focus-within:border-primary transition-colors">
              <span className="text-slate-400 text-sm font-bold">₩</span>
              <input
                type="number"
                value={originalPrice}
                onChange={e => setOriginalPrice(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-700">한마디 (선택)</p>
            <span className="text-xs text-slate-400">{description.length}/500</span>
          </div>
          <textarea
            value={description}
            onChange={e => { if (e.target.value.length <= 500) setDescription(e.target.value); }}
            placeholder="특가 정보를 간략하게 설명해주세요"
            rows={4}
            className="w-full bg-slate-50 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-300 outline-none border border-slate-200 focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-500 text-[16px] mt-0.5 shrink-0">info</span>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              허위 특가 제보 시 커뮤니티 이용이 제한될 수 있어요. 이미 종료된 특가는 제보 전 확인해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
