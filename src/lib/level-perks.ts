// Level perks — server copy. Keep in sync with ait/src/lib/level-perks.ts.
// The backend only needs the slot bonus for the tracking-limit check.

export function getLevelExtraSlots(level: number): number {
  return level >= 10 ? 20 : level >= 8 ? 12 : level >= 6 ? 7 : level >= 4 ? 3 : level >= 2 ? 1 : 0;
}
