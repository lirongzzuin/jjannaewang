import { useState } from "react";
import { DealPost } from "@/types";
import { formatDate, formatPrice, getDiscountRate } from "@/lib/utils";

interface DealCardProps {
  deal: DealPost;
  onFire?: (dealId: string) => void;
  onBought?: (dealId: string) => void;
  onShare?: (deal: DealPost) => void;
}

export default function DealCard({ deal, onFire, onBought, onShare }: DealCardProps) {
  const [fired, setFired] = useState(deal.my_reaction === "fire");
  const [fireCount, setFireCount] = useState(deal.fire_count);
  const discount = deal.original_price
    ? getDiscountRate(deal.original_price, deal.deal_price)
    : null;

  const handleFire = () => {
    setFired(!fired);
    setFireCount((c) => (fired ? c - 1 : c + 1));
    onFire?.(deal.id);
  };

  return (
    <div
      className={`rounded-xl border border-slate-100 bg-white p-4 shadow-sm ${deal.is_expired ? "opacity-60" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
            {deal.user?.nickname?.[0] || "U"}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold">{deal.user?.nickname || "유저"}</span>
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-slate-800">
                Lv.{deal.user?.level || 1}
              </span>
            </div>
            <span className="text-xs text-slate-400">{formatDate(deal.created_at)}</span>
          </div>
        </div>
        {deal.is_expired && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400">
            만료됨
          </span>
        )}
      </div>

      {deal.description && (
        <p className="mb-4 text-sm leading-relaxed text-slate-800">{deal.description}</p>
      )}

      <div className="mb-4 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
        {deal.product?.image_url && (
          <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-slate-200">
            <img
              src={deal.product.image_url}
              alt={deal.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">
            {deal.shop_name}
          </p>
          <p className="mb-1 truncate text-sm font-bold text-slate-900">{deal.title}</p>
          <div className="flex items-center gap-2">
            {discount && discount > 0 && (
              <span className="text-sm font-bold text-red-500">-{discount}%</span>
            )}
            <span className="text-lg font-bold text-primary">{formatPrice(deal.deal_price)}</span>
            {deal.original_price && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(deal.original_price)}
              </span>
            )}
          </div>
        </div>
        {deal.shop_url && (
          <a href={deal.affiliate_url || deal.shop_url} target="_blank" rel="noopener noreferrer">
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </a>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-50 pt-3">
        <div className="flex items-center gap-4">
          <button onClick={handleFire} className="flex items-center gap-1 text-slate-600">
            <span
              className={`material-symbols-outlined text-[20px] ${fired ? "fill-icon text-orange-500" : ""}`}
            >
              local_fire_department
            </span>
            <span className="text-xs font-semibold">{fireCount}</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onBought?.(deal.id)}
            className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
          >
            <span className="material-symbols-outlined text-sm">check_circle</span>
            나도 샀다
          </button>
          <button onClick={() => onShare?.(deal)}>
            <span className="material-symbols-outlined text-[20px] text-slate-400">share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
