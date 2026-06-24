import { Link } from "react-router-dom";
import { Product } from "@/types";
import { formatPrice, getDiscountRate } from "@/lib/utils";
import MiniSparkline from "@/components/charts/MiniSparkline";

interface ProductCardProps {
  product: Product;
  sparklineData?: number[];
  priceChange?: number;
  showTrackButton?: boolean;
  onTrack?: (productId: string) => void;
  isTracked?: boolean;
  /** When set, the title/image open via this handler instead of a router Link
   *  (used for Naver search results that must be resolved to a DB product first). */
  onOpen?: () => void;
}

export default function ProductCard({
  product,
  sparklineData,
  priceChange,
  showTrackButton,
  onTrack,
  isTracked,
  onOpen,
}: ProductCardProps) {
  const discount =
    product.lowest_price_ever && product.current_lowest_price
      ? getDiscountRate(product.lowest_price_ever, product.current_lowest_price)
      : null;

  return (
    <div className="flex items-start gap-4 border-b border-slate-50 p-4">
      <div
        className="size-20 shrink-0 overflow-hidden rounded-lg bg-slate-100"
        onClick={onOpen}
        role={onOpen ? "button" : undefined}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100">
            <span className="material-symbols-outlined text-3xl text-slate-300">image</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-medium text-slate-400">
          {product.brand || product.category}
        </p>
        {onOpen ? (
          <button onClick={onOpen} className="block text-left">
            <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 transition-colors hover:text-primary">
              {product.name}
            </h4>
          </button>
        ) : (
          <Link to={`/product/${product.id}`}>
            <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 transition-colors hover:text-primary">
              {product.name}
            </h4>
          </Link>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">
            {product.current_lowest_price
              ? formatPrice(product.current_lowest_price)
              : "가격 확인 중"}
          </span>
          {product.lowest_price_ever && product.current_lowest_price && (
            <>
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(product.lowest_price_ever)}
              </span>
              {discount && discount > 0 && (
                <span className="rounded bg-orange-50 px-1.5 py-0.5 text-xs font-bold text-orange-500">
                  -{discount}%
                </span>
              )}
            </>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
          <span className="material-symbols-outlined text-[14px]">trending_down</span>
          <span>{product.tracking_count.toLocaleString()}명 추적 중</span>
        </div>
      </div>
      {sparklineData && priceChange !== undefined && (
        <div className="flex flex-col items-end gap-1">
          <MiniSparkline data={sparklineData} />
          <span
            className={`text-xs font-bold ${priceChange <= 0 ? "text-green-600" : "text-red-500"}`}
          >
            {priceChange <= 0 ? "▼" : "▲"} {Math.abs(priceChange).toLocaleString()}원
          </span>
        </div>
      )}
      {showTrackButton && onTrack && (
        <button
          onClick={() => onTrack(product.id)}
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
            isTracked
              ? "border-slate-300 bg-slate-50 text-slate-400"
              : "border-primary text-primary hover:bg-primary/10"
          }`}
        >
          {isTracked ? "추적중" : "추적"}
        </button>
      )}
    </div>
  );
}
