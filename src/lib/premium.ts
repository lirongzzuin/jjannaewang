// Effective premium tier — considers expiry so a lapsed subscription downgrades
// to free automatically (read-time enforcement; no downgrade cron needed).

export type Tier = 'free' | 'pro' | 'master';

export function activeTier(
  premiumTier: string | null | undefined,
  premiumExpiry: string | null | undefined,
): Tier {
  if (!premiumTier) return 'free';
  if (premiumExpiry && new Date(premiumExpiry).getTime() < Date.now()) return 'free';
  return premiumTier === 'master' ? 'master' : premiumTier === 'pro' ? 'pro' : 'free';
}

// Free is generous (everything usable); premium adds more as a minor perk.
export const TIER_TRACKING_BASE: Record<Tier, number> = {
  free: 20,
  pro: 100,
  master: Number.POSITIVE_INFINITY,
};
