import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendMessage, TEMPLATES } from '@/lib/smart-message';

export const maxDuration = 300;

const APP_LINK = process.env.NEXT_PUBLIC_APP_URL ?? 'https://service.tossmini.com';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Daily savings nudge: tell consenting users how much they've saved this month
// + how many of their tracked items hit target. Functional/transactional content.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createServerClient();
  const month = currentMonth();

  // This month's savings per user.
  const { data: savings, error } = await supabase
    .from('savings')
    .select('user_id, saved_amount')
    .eq('month', month);
  if (error) {
    console.error('daily-report savings error:', error.message);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  const byUser = new Map<string, number>();
  for (const s of savings ?? []) {
    byUser.set(s.user_id, (byUser.get(s.user_id) ?? 0) + (s.saved_amount ?? 0));
  }
  if (byUser.size === 0) return NextResponse.json({ ok: true, sent: 0 });

  const { data: users } = await supabase
    .from('users')
    .select('id, toss_user_id, notification_consent')
    .in('id', Array.from(byUser.keys()))
    .eq('notification_consent', true);

  let sent = 0;
  for (const u of users ?? []) {
    const total = byUser.get(u.id) ?? 0;
    if (total <= 0 || !u.toss_user_id) continue;
    const ok = await sendMessage({
      userKey: u.toss_user_id,
      templateCode: TEMPLATES.dailyReport,
      title: '💰 이번 달 절약 리포트',
      body: `이번 달 벌써 ${total.toLocaleString()}원 아꼈어요! 짠내왕에서 더 아껴봐요 👑`,
      linkUrl: `${APP_LINK}/profile`,
      variables: { savedAmount: String(total), month },
    });
    if (ok) sent += 1;
  }

  return NextResponse.json({ ok: true, eligible: byUser.size, sent });
}
