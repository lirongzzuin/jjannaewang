// Level perks — the functional payoff for earning EXP. Keep this file in sync
// with the backend copy at src/lib/level-perks.ts.

export interface LevelPerks {
  /** Extra free tracking slots granted by level (added to the tier base). */
  extraTrackingSlots: number;
  /** AI price analysis is free (no rewarded ad needed). */
  freeAiAnalysis: boolean;
  /** Interstitial ad cadence; Infinity = no interstitials. */
  interstitialEvery: number;
}

export function getLevelPerks(level: number): LevelPerks {
  const extraTrackingSlots =
    level >= 10 ? 20 : level >= 8 ? 12 : level >= 6 ? 7 : level >= 4 ? 3 : level >= 2 ? 1 : 0;
  return {
    extraTrackingSlots,
    freeAiAnalysis: level >= 5,
    interstitialEvery: level >= 10 ? Infinity : level >= 8 ? 8 : 4,
  };
}

// Human-readable perk milestones (for the profile "레벨 혜택" section).
export const PERK_MILESTONES = [
  { level: 2, label: '추적 슬롯 +1' },
  { level: 4, label: '추적 슬롯 +3' },
  { level: 5, label: '가격 분석 무료 (광고 없이)' },
  { level: 6, label: '추적 슬롯 +7' },
  { level: 8, label: '추적 슬롯 +12 · 전면광고 절반' },
  { level: 10, label: '추적 슬롯 +20 · 전면광고 없음' },
] as const;
