import { useEffect, useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAppStore } from "@/store";
import { getLevelInfo } from "@/lib/utils";
import { getLevelPerks, PERK_MILESTONES } from "@/lib/level-perks";
import type { User } from "@/types";

const LAST_LEVEL_KEY = "jjannaewang-last-level";

interface MeResponse {
  user: User;
}

/**
 * Watches the authenticated user's level (shares the /api/me SWR cache with
 * Home/Profile) and shows a celebration when it increases — the EXP payoff.
 */
export default function LevelUpWatcher() {
  const storeUser = useAppStore((s) => s.user);
  const { data } = useSWR(storeUser ? "/api/me" : null, () => api.get<MeResponse>("/api/me"));
  const [levelUp, setLevelUp] = useState<{ from: number; to: number } | null>(null);

  const level = data?.user.level;

  useEffect(() => {
    if (level == null) return;
    let prev: number | null = null;
    try {
      const raw = localStorage.getItem(LAST_LEVEL_KEY);
      prev = raw == null ? null : Number(raw);
    } catch {
      prev = null;
    }
    if (prev != null && level > prev) setLevelUp({ from: prev, to: level });
    try {
      localStorage.setItem(LAST_LEVEL_KEY, String(level));
    } catch {
      /* ignore */
    }
  }, [level]);

  if (!levelUp) return null;

  const info = getLevelInfo(levelUp.to);
  // Perks newly unlocked between the old and new level.
  const newlyUnlocked = PERK_MILESTONES.filter(
    (m) => m.level > levelUp.from && m.level <= levelUp.to,
  );
  const perks = getLevelPerks(levelUp.to);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setLevelUp(null)} />
      <div className="relative w-full max-w-[320px] animate-slide-up rounded-3xl bg-white p-7 text-center shadow-2xl">
        <p className="text-xs font-bold text-primary">LEVEL UP!</p>
        <div className="mx-auto my-3 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-yellow-300 text-5xl">
          {info.icon}
        </div>
        <p className="text-xl font-extrabold text-slate-900">
          Lv.{levelUp.to} {info.title}
        </p>
        <p className="mt-1 text-sm text-slate-500">레벨이 올랐어요! 축하해요 🎉</p>

        <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-3 text-left">
          {newlyUnlocked.length > 0 ? (
            newlyUnlocked.map((m) => (
              <div key={m.level} className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">lock_open</span>
                <p className="text-xs font-semibold text-slate-700">{m.label}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">
              현재 혜택: 추적 슬롯 +{perks.extraTrackingSlots}
              {perks.freeAiAnalysis ? " · AI 분석 무료" : ""}
            </p>
          )}
        </div>

        <button
          onClick={() => setLevelUp(null)}
          className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-bold text-slate-900"
        >
          확인
        </button>
      </div>
    </div>
  );
}
