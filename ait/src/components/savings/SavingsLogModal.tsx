import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { haptic } from "@/lib/apps-in-toss";

interface Props {
  open: boolean;
  onClose: () => void;
  productId?: string;
  productName?: string;
  defaultOriginal?: number;
  defaultPurchased?: number;
  source?: "manual" | "tracking";
  onLogged?: (saved: number) => void;
}

interface SavingsResult {
  saved: number;
  totalSaved: number;
  expEarned: number;
}

/**
 * Records how much the user saved on a purchase. Manual stand-in for payment
 * integration — feeds cumulative savings, peer comparison, ranking, and EXP.
 */
export default function SavingsLogModal({
  open,
  onClose,
  productId,
  productName,
  defaultOriginal,
  defaultPurchased,
  source = "manual",
  onLogged,
}: Props) {
  const [original, setOriginal] = useState(defaultOriginal ? String(defaultOriginal) : "");
  const [purchased, setPurchased] = useState(defaultPurchased ? String(defaultPurchased) : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SavingsResult | null>(null);

  if (!open) return null;

  const preview = Math.max(0, (Number(original) || 0) - (Number(purchased) || 0));

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<SavingsResult>("/api/savings", {
        original_price: Number(original),
        purchased_price: Number(purchased),
        product_id: productId ?? null,
        source,
      });
      haptic("softMedium");
      setResult(res);
      onLogged?.(res.saved);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setError("로그인이 필요해요");
      else setError(e instanceof Error ? e.message : "기록에 실패했어요");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-app animate-slide-up rounded-t-2xl bg-white p-6 pb-10">
        {result ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-4xl">
              💸
            </div>
            <p className="text-lg font-extrabold text-slate-900">
              {formatPrice(result.saved)} 절약 기록 완료!
            </p>
            <p className="mt-1 text-sm text-slate-500">
              누적 절약 {formatPrice(result.totalSaved)} · +{result.expEarned} EXP
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-slate-900"
            >
              좋아요!
            </button>
          </div>
        ) : (
          <>
            <h3 className="mb-1 text-lg font-bold">절약 기록하기</h3>
            <p className="mb-4 text-xs text-slate-400">
              {productName ? `'${productName}' ` : ""}정가보다 얼마나 싸게 샀는지 기록하면 누적 절약과
              랭킹에 반영돼요.
            </p>
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {error}
              </div>
            )}
            <label className="mb-1 block text-xs font-bold text-slate-600">정가</label>
            <div className="mb-3 flex items-center gap-1 rounded-xl bg-slate-100 px-4 py-3">
              <span className="font-bold text-slate-500">₩</span>
              <input
                type="number"
                inputMode="numeric"
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                placeholder="12000"
                className="w-full bg-transparent text-base font-bold outline-none"
              />
            </div>
            <label className="mb-1 block text-xs font-bold text-slate-600">실제 구매가</label>
            <div className="mb-3 flex items-center gap-1 rounded-xl bg-slate-100 px-4 py-3">
              <span className="font-bold text-slate-500">₩</span>
              <input
                type="number"
                inputMode="numeric"
                value={purchased}
                onChange={(e) => setPurchased(e.target.value)}
                placeholder="7900"
                className="w-full bg-transparent text-base font-bold outline-none"
              />
            </div>
            {preview > 0 && (
              <p className="mb-4 text-center text-sm font-bold text-green-600">
                {formatPrice(preview)} 절약! 👏
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600"
              >
                취소
              </button>
              <button
                onClick={submit}
                disabled={submitting || preview <= 0}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-slate-900 disabled:opacity-40"
              >
                {submitting ? "기록 중..." : "기록하기"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
