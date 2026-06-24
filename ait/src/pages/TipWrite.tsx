import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAppStore } from "@/store";
import { containsBannedWords } from "@/lib/moderation";
import { TIP_CATEGORIES, type TipCategory } from "@/types";
import RewardCelebration, { type PioneerReward } from "@/components/ui/RewardCelebration";
import { haptic } from "@/lib/apps-in-toss";

const SELECTABLE = TIP_CATEGORIES.filter((c) => c.id !== "all");

export default function TipWrite() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<TipCategory>("saving");
  const [tagsInput, setTagsInput] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reward, setReward] = useState<PioneerReward | null>(null);

  const canSubmit = title.trim().length >= 5 && body.trim().length >= 20 && !submitting;

  const handleSubmit = async () => {
    setError(null);
    if (!user) {
      setError("토스 계정 연결 중이에요. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (containsBannedWords(title) || containsBannedWords(body)) {
      setError("광고성·금지 단어가 포함되어 있어요");
      return;
    }
    const tags = tagsInput
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean)
      .slice(0, 5);

    setSubmitting(true);
    try {
      const res = await api.post<{ reward: PioneerReward | null }>("/api/tips", {
        title: title.trim(),
        body: body.trim(),
        category,
        tags,
        link_url: linkUrl.trim() || null,
      });
      if (res.reward) {
        haptic("softMedium");
        setReward(res.reward);
      } else {
        navigate("/tips", { replace: true });
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
          <Link to="/tips">
            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
          </Link>
          <h1 className="text-base font-bold text-slate-900">꿀팁 작성</h1>
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

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">카테고리</label>
          <div className="flex flex-wrap gap-2">
            {SELECTABLE.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id as TipCategory)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  category === c.id ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            제목 <span className="text-primary">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="5자 이상, 핵심을 담아주세요"
            maxLength={40}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            내용 <span className="text-primary">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="20자 이상. 직접 해본 절약 경험을 구체적으로 적어주세요."
            maxLength={2000}
            rows={8}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-right text-[10px] text-slate-400">{body.length}/2000</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">태그</label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="쉼표로 구분 (예: 토스뱅크, 파킹통장)"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">참고 링크</label>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            inputMode="url"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <p className="px-1 text-[11px] leading-relaxed text-slate-400">
          작성한 정보는 개인 경험이며, 투자·금융 결정은 본인의 판단과 책임 하에 이루어집니다.
          광고·홍보성 글은 제한될 수 있어요.
        </p>
      </div>

      {reward && (
        <RewardCelebration reward={reward} onClose={() => navigate("/tips", { replace: true })} />
      )}
    </div>
  );
}
