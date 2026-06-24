import { SupabaseClient } from '@supabase/supabase-js';

// "개척자(Pioneer)" reward — given to the FIRST person to contribute a piece of
// data (first deal report for a product, first tip in a category). This seeds an
// empty catalog by rewarding the discoverers.

export interface PioneerReward {
  exp: number;
  badge: string;
  badgeName: string;
  badgeEmoji: string;
  message: string;
}

const REWARDS = {
  deal: {
    exp: 50,
    badge: 'pioneer_deal',
    badgeName: '첫 제보자',
    badgeEmoji: '🚩',
    message: '이 상품의 첫 제보자예요! +50 EXP & 🚩 첫 제보자 배지 획득',
  },
  tip: {
    exp: 30,
    badge: 'pioneer_tip',
    badgeName: '첫 꿀팁러',
    badgeEmoji: '🍯',
    message: '이 분야의 첫 꿀팁이에요! +30 EXP & 🍯 첫 꿀팁러 배지 획득',
  },
} as const;

/**
 * Grant a pioneer reward: adds EXP and a (one-time) badge. Idempotent on the
 * badge. Best-effort — returns the reward to surface in the UI, or null on
 * failure so the primary action still succeeds.
 */
export async function awardPioneer(
  supabase: SupabaseClient,
  userId: string,
  kind: 'deal' | 'tip',
): Promise<PioneerReward | null> {
  const r = REWARDS[kind];
  try {
    await supabase.rpc('add_user_exp', { p_user_id: userId, p_exp: r.exp });
    await supabase
      .from('user_badges')
      .upsert({ user_id: userId, badge_code: r.badge }, { onConflict: 'user_id,badge_code' });
    return {
      exp: r.exp,
      badge: r.badge,
      badgeName: r.badgeName,
      badgeEmoji: r.badgeEmoji,
      message: r.message,
    };
  } catch (e) {
    console.error('awardPioneer error:', e);
    return null;
  }
}
