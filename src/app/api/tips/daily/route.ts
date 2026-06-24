import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/tips/daily — one curated "오늘의 짠돌이 꿀팁", deterministic per day so
// every visitor sees the same pick and there's a reason to come back daily.
export async function GET() {
  const supabase = createServerClient();

  const { data: tips, error } = await supabase
    .from('tips')
    .select('id, title, body, category, upvote_count, user:users(nickname, level)')
    .eq('is_blinded', false)
    .order('upvote_count', { ascending: false })
    .limit(30);

  if (error || !tips || tips.length === 0) {
    return NextResponse.json({ tip: null });
  }

  // Stable index for today (UTC day number).
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const tip = tips[dayIndex % tips.length];
  return NextResponse.json({ tip });
}
