import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAppStore } from "@/store";

interface Props {
  open: boolean;
  onClose: () => void;
  /** true → first-time setup (소개 문구 노출, 닫기 버튼 약하게) */
  firstTime?: boolean;
}

export default function NicknameModal({ open, onClose, firstTime }: Props) {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const [value, setValue] = useState(firstTime ? "" : (user?.nickname ?? ""));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const save = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ nickname: string }>("/api/me/nickname", { nickname: value });
      if (user) setUser({ ...user, nickname: res.nickname, nickname_set: true });
      onClose();
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("닉네임 변경에 실패했어요");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-app animate-slide-up rounded-t-2xl bg-white p-6 pb-10">
        <h3 className="mb-1 text-lg font-bold">{firstTime ? "닉네임을 정해주세요" : "닉네임 변경"}</h3>
        <p className="mb-4 text-xs text-slate-400">
          {firstTime
            ? "커뮤니티와 랭킹에 표시될 이름이에요. 2~12자로 정해주세요."
            : "2~12자, 광고성·금지 단어는 사용할 수 없어요."}
        </p>
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </div>
        )}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="예: 절약왕민수"
          maxLength={12}
          autoFocus
          className="mb-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-bold outline-none focus:border-primary"
        />
        <p className="mb-4 text-right text-[10px] text-slate-400">{value.trim().length}/12</p>
        <div className="flex gap-2">
          {!firstTime && (
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600"
            >
              취소
            </button>
          )}
          <button
            onClick={save}
            disabled={submitting || value.trim().length < 2}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-slate-900 disabled:opacity-40"
          >
            {submitting ? "저장 중..." : firstTime ? "이 이름으로 시작하기" : "저장"}
          </button>
        </div>
        {firstTime && (
          <button onClick={onClose} className="mt-3 w-full py-1 text-xs font-medium text-slate-400">
            나중에 할게요
          </button>
        )}
      </div>
    </div>
  );
}
