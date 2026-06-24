import { Link } from "react-router-dom";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAppStore } from "@/store";
import { formatPriceShort } from "@/lib/utils";
import { TIP_CATEGORIES } from "@/types";

interface Insights {
  savedThisMonth: number;
  streakDays: number;
  peerAverage: number;
  peerCount: number;
  topPercent: number | null;
  vsPeer: number;
  trackedDropCount: number;
}

interface DailyTip {
  tip: {
    id: string;
    title: string;
    category: string;
    user?: { nickname?: string; level?: number };
  } | null;
}

/**
 * "오늘의 짠내 브리핑" — the daily reason to open the app:
 * attendance streak, peer comparison, tracked price-drop count, and the
 * curated 오늘의 짠돌이 꿀팁.
 */
export default function DailyBriefing() {
  const user = useAppStore((s) => s.user);
  const { data: insights } = useSWR(
    user ? "/api/me/insights" : null,
    () => api.get<Insights>("/api/me/insights"),
  );
  const { data: daily } = useSWR("/api/tips/daily", () => api.get<DailyTip>("/api/tips/daily"));

  const tip = daily?.tip;
  const tipCat = tip ? TIP_CATEGORIES.find((c) => c.id === tip.category) : null;

  return (
    <div className="mx-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">☀️</span>
        <h2 className="text-sm font-extrabold text-slate-900">오늘의 짠내 브리핑</h2>
      </div>

      {user ? (
        <div className="space-y-2">
          {/* Attendance */}
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
            <span className="text-base">🔥</span>
            <p className="text-xs font-semibold text-amber-800">
              {insights ? `${insights.streakDays}일 연속 접속 중` : "출석 확인 중..."} · 오늘 출석 완료
              (+10 EXP)
            </p>
          </div>

          {/* Peer comparison */}
          {insights && insights.topPercent != null ? (
            <Link to="/ranking" className="block">
              <div className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2.5">
                <p className="text-xs font-semibold text-slate-700">
                  이번 달 <span className="font-extrabold text-primary">상위 {insights.topPercent}%</span>{" "}
                  절약왕!
                  {insights.vsPeer > 0
                    ? ` 또래보다 ${formatPriceShort(insights.vsPeer)} 더 아꼈어요`
                    : ""}
                </p>
                <span className="material-symbols-outlined text-[18px] text-primary">
                  chevron_right
                </span>
              </div>
            </Link>
          ) : (
            <div className="rounded-xl bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-semibold text-slate-600">
                이번 달 절약 기록을 시작하고 또래와 비교해보세요!{" "}
                {insights && insights.peerCount > 0
                  ? `또래 평균 ${formatPriceShort(insights.peerAverage)}`
                  : ""}
              </p>
            </div>
          )}

          {/* Tracked drops */}
          {insights && insights.trackedDropCount > 0 && (
            <Link to="/tracking" className="block">
              <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2.5">
                <p className="text-xs font-semibold text-green-700">
                  👀 추적 상품 {insights.trackedDropCount}개가 목표가에 도달했어요!
                </p>
                <span className="material-symbols-outlined text-[18px] text-green-600">
                  chevron_right
                </span>
              </div>
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-slate-600">
            토스 계정을 연결하면 또래와 절약 순위를 비교해드려요
          </p>
        </div>
      )}

      {/* Daily frugal tip */}
      {tip && (
        <Link to={`/tips/${tip.id}`} className="mt-2 block">
          <div className="flex items-start gap-2 rounded-xl border border-slate-100 px-3 py-2.5">
            <span className="text-base">{tipCat?.emoji ?? "💡"}</span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-primary">오늘의 짠돌이 꿀팁</p>
              <p className="truncate text-xs font-semibold text-slate-800">{tip.title}</p>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
