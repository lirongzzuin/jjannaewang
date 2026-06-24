import Link from 'next/link';
import { Product } from '@/types';
import { formatPrice, getDiscountRate } from '@/lib/utils';
import MiniSparkline from '@/components/charts/MiniSparkline';

interface ProductCardProps {
  product: Product;
  sparklineData?: number[];
  priceChange?: number;
  showTrackButton?: boolean;
  onTrack?: (productId: string) => void;
  isTracked?: boolean;
}

export default function ProductCard({
  product,
  sparklineData,
  priceChange,
  showTrackButton,
  onTrack,
  isTracked,
}: ProductCardProps) {
  const discount = product.lowest_price_ever && product.current_lowest_price
    ? getDiscountRate(product.lowest_price_ever, product.current_lowest_price)
    : null;

  return (
    <div className="flex items-start gap-4 p-4 border-b border-slate-50">
      <div className="size-20 rounded-lg overflow-hidden shrink-0 bg-slate-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <span className="material-symbols-outlined text-slate-300 text-3xl">image</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium mb-1">{product.brand || product.category}</p>
        <Link href={`/product/${product.id}`}>
          <h4 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h4>
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-primary font-bold text-lg">
            {product.current_lowest_price ? formatPrice(product.current_lowest_price) : '가격 확인 중'}
          </span>
          {product.lowest_price_ever && product.current_lowest_price && (
            <>
              <span className="text-xs text-slate-400 line-through">{formatPrice(product.lowest_price_ever)}</span>
              {discount && discount > 0 && (
                <span className="text-xs font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">-{discount}%</span>
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
          <span className={`text-xs font-bold ${priceChange <= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {priceChange <= 0 ? '▼' : '▲'} {Math.abs(priceChange).toLocaleString()}원
          </span>
        </div>
      )}
      {showTrackButton && onTrack && (
        <button
          onClick={() => onTrack(product.id)}
          className={`shrink-0 border px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            isTracked
              ? 'border-slate-300 text-slate-400 bg-slate-50'
              : 'border-primary text-primary hover:bg-primary/10'
          }`}
        >
          {isTracked ? '추적중' : '추적'}
        </button>
      )}
    </div>
  );
}
