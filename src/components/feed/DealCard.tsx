'use client';
import { useState } from 'react';
import { DealPost } from '@/types';
import { formatDate, formatPrice, getDiscountRate } from '@/lib/utils';

interface DealCardProps {
  deal: DealPost;
  onFire?: (dealId: string) => void;
  onBought?: (dealId: string) => void;
  onShare?: (deal: DealPost) => void;
}

export default function DealCard({ deal, onFire, onBought, onShare }: DealCardProps) {
  const [fired, setFired] = useState(deal.my_reaction === 'fire');
  const [fireCount, setFireCount] = useState(deal.fire_count);
  const discount = deal.original_price
    ? getDiscountRate(deal.original_price, deal.deal_price)
    : null;

  const handleFire = () => {
    setFired(!fired);
    setFireCount(c => fired ? c - 1 : c + 1);
    onFire?.(deal.id);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-4 ${deal.is_expired ? 'opacity-60' : ''}`}>
      {/* User info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
            {deal.user?.nickname?.[0] || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm">{deal.user?.nickname || '유저'}</span>
              <span className="bg-primary/20 text-slate-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                Lv.{deal.user?.level || 1}
              </span>
            </div>
            <span className="text-slate-400 text-xs">{formatDate(deal.created_at)}</span>
          </div>
        </div>
        {deal.is_expired && (
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">만료됨</span>
        )}
      </div>

      {/* Post text */}
      {deal.description && (
        <p className="text-slate-800 text-sm leading-relaxed mb-4">{deal.description}</p>
      )}

      {/* Product card */}
      <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-100 mb-4">
        {deal.product?.image_url && (
          <div className="size-16 bg-slate-200 rounded-lg overflow-hidden shrink-0">
            <img src={deal.product.image_url} alt={deal.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold truncate">{deal.shop_name}</p>
          <p className="text-sm font-bold text-slate-900 truncate mb-1">{deal.title}</p>
          <div className="flex items-center gap-2">
            {discount && discount > 0 && <span className="text-red-500 font-bold text-sm">-{discount}%</span>}
            <span className="text-lg font-bold text-primary">{formatPrice(deal.deal_price)}</span>
            {deal.original_price && (
              <span className="text-xs text-slate-400 line-through">{formatPrice(deal.original_price)}</span>
            )}
          </div>
        </div>
        {deal.shop_url && (
          <a href={deal.affiliate_url || deal.shop_url} target="_blank" rel="noopener noreferrer">
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </a>
        )}
      </div>

      {/* Reactions */}
      <div className="flex items-center justify-between border-t border-slate-50 pt-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleFire}
            className="flex items-center gap-1 text-slate-600"
          >
            <span className={`material-symbols-outlined text-[20px] ${fired ? 'text-orange-500 fill-icon' : ''}`}>
              local_fire_department
            </span>
            <span className="text-xs font-semibold">{fireCount}</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onBought?.(deal.id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700"
          >
            <span className="material-symbols-outlined text-sm">check_circle</span>
            나도 샀다
          </button>
          <button onClick={() => onShare?.(deal)}>
            <span className="material-symbols-outlined text-slate-400 text-[20px]">share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
