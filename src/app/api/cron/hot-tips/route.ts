import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getRedis, KEYS } from '@/lib/upstash';

export const maxDuration = 120;

const WINDOW_HOURS = 48;
const TOP_N = 20;

// Rank recent tips by a hotness score and cache the top list in Redis.
// Also flips `is_hot` on the winners (and off for stale ones).
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createServerClient();
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const { data: tips, error } = await supabase
    .from('tips')
    .select('id, title, category, upvote_count, comment_count, view_count, scrap_count, created_at, user:users(nickname, level)')
    .eq('is_blinded', false)
    .gte('created_at', since)
    .limit(300);

  if (error) {
    console.error('hot-tips query error:', error.message);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  const scored = (tips ?? [])
    .map((t) => {
      const ageHours = (Date.now() - new Date(t.created_at).getTime()) / 3_600_000;
      const recency = Math.max(0, 1 - ageHours / WINDOW_HOURS);
      const score =
        (t.upvote_count ?? 0) * 3 +
        (t.comment_count ?? 0) * 4 +
        (t.scrap_count ?? 0) * 2 +
        (t.view_count ?? 0) * 0.1 +
        recency * 20;
      return { ...t, score };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, TOP_N);
  const topIds = top.map((t) => t.id);

  // Cache for the home screen (1h TTL).
  try {
    const redis = getRedis();
    await redis.set(KEYS.hotTips, JSON.stringify(top), { ex: 3600 });
  } catch (e) {
    console.error('hot-tips redis error', e);
  }

  // Sync is_hot flags.
  if (topIds.length) {
    await supabase.from('tips').update({ is_hot: true }).in('id', topIds);
    await supabase.from('tips').update({ is_hot: false }).eq('is_hot', true).not('id', 'in', `(${topIds.join(',')})`);
  }

  return NextResponse.json({ ok: true, ranked: scored.length, hot: top.length });
}
