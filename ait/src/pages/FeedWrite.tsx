import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAppStore } from "@/store";
import { containsBannedWords } from "@/lib/moderation";
import RewardCelebration, { type PioneerReward } from "@/components/ui/RewardCelebration";
import { haptic } from "@/lib/apps-in-toss";

export default function FeedWrite() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopUrl, setShopUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reward, setReward] = useState<PioneerReward | null>(null);

  const canSubmit =
    title.trim().length >= 3 && dealPrice.trim() !== "" && shopName.trim() !== "" && !submitting;

  const handleSubmit = async () => {
    setError(null);
    if (!user) {
      setError("로그인이 필요해요");
      return;
    }
    if (containsBannedWords(title) || containsBannedWords(description)) {
      setError("광고성·금지 단어가 포함되어 있어요");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<{ reward: PioneerReward | null }>("/api/feed", {
        title: title.trim(),
        description: description.trim() || null,
        deal_price: Number(dealPrice),
        original_price: originalPrice ? Number(originalPrice) : null,
        shop_name: shopName.trim(),
        shop_url: shopUrl.trim() || null,
      });
      if (res.reward) {
        haptic("softMedium");
        setReward(res.reward); // celebrate, then navigate on close
      } else {
        navigate("/feed", { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "등록에 실패했어요");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link to="/feed">
            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
          </Link>
          <h1 className="text-base font-bold text-slate-900">특가 제보</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-bold text-slate-900 disabled:opacity-40"
        >
          {submitting ? "등록 중" : "등록"}
        </button>
      </header>

      <div className="space-y-4 p-4">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
            {error}
          </div>
        )}

        <Field label="상품명" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 삼다수 2L x 12개"
            maxLength={100}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </Field>

        <Field label="한줄 설명">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="어디서, 어떻게 싸게 샀는지 알려주세요"
            maxLength={500}
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="특가" required>
            <PriceInput value={dealPrice} onChange={setDealPrice} placeholder="7900" />
          </Field>
          <Field label="정상가">
            <PriceInput value={originalPrice} onChange={setOriginalPrice} placeholder="12000" />
          </Field>
        </div>

        <Field label="쇼핑몰" required>
          <input
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="예: 쿠팡"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </Field>

        <Field label="상품 링크">
          <input
            value={shopUrl}
            onChange={(e) => setShopUrl(e.target.value)}
            placeholder="https://..."
            inputMode="url"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </Field>

        <p className="px-1 text-[11px] leading-relaxed text-slate-400">
          허위·과장 정보나 광고성 게시물은 신고 5회 시 자동으로 가려집니다.
        </p>
      </div>

      {reward && (
        <RewardCelebration reward={reward} onClose={() => navigate("/feed", { replace: true })} />
      )}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </label>
      {children}
    </div>
  );
}

function PriceInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-3 focus-within:border-primary">
      <span className="text-sm font-bold text-slate-400">₩</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none"
      />
    </div>
  );
}
