import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

// GET /api/ranking?type=savings|deals|tips&month=YYYY-MM
// Live monthly leaderboard, computed from source tables (no precompute needed).
export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const type = (req.nextUrl.searchParams.get('type') || 'savings') as 'savings' | 'deals' | 'tips';
  const now = new Date();
  const month =
    req.nextUrl.searchParams.get('month') ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthStart = new Date(`${month}-01T00:00:00Z`).toISOString();

  const scores = new Map<string, number>();

  if (type === 'savings') {
    const { data } = await supabase.from('savings').select('user_id, saved_amount').eq('month', month);
    for (const r of data ?? []) {
      scores.set(r.user_id, (scores.get(r.user_id) ?? 0) + (r.saved_amount ?? 0));
    }
  } else if (type === 'deals') {
    const { data } = await supabase
      .from('deal_posts')
      .select('user_id, created_at')
      .gte('created_at', monthStart);
    for (const r of data ?? []) {
      scores.set(r.user_id, (scores.get(r.user_id) ?? 0) + 1);
    }
  } else {
    const { data } = await supabase
      .from('tips')
      .select('user_id, upvote_count, created_at')
      .gte('created_at', monthStart);
    for (const r of data ?? []) {
      scores.set(r.user_id, (scores.get(r.user_id) ?? 0) + (r.upvote_count ?? 0));
    }
  }

  const sorted = Array.from(scores.entries())
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100);

  const userIds = sorted.map(([id]) => id);
  const userMap = new Map<string, { id: string; nickname: string; level: number }>();
  if (userIds.length) {
    const { data: users } = await supabase
      .from('users')
      .select('id, nickname, level')
      .in('id', userIds);
    for (const u of users ?? []) userMap.set(u.id, u);
  }

  const session = getAuthUser(req);
  const meId = session?.uid;

  const rankings = sorted.map(([id, score], i) => ({
    rank: i + 1,
    user: userMap.get(id) ?? { id, nickname: '유저', level: 1 },
    score,
    isMe: id === meId,
  }));

  const me = rankings.find((r) => r.isMe) ?? null;
  return NextResponse.json({ type, month, rankings, me });
}
