import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendMessage, TEMPLATES } from '@/lib/smart-message';

export const maxDuration = 300;

const RE_ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // don't re-notify within 24h
const APP_LINK = process.env.NEXT_PUBLIC_APP_URL ?? 'https://service.tossmini.com';

// Check tracked items against latest prices; push a price-drop alert when the
// current lowest price reaches the user's target (consent + cooldown enforced).
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createServerClient();

  // Only consider alert-enabled trackings with a target whose cooldown has
  // elapsed (or never alerted), and cap the batch so one run never loads the
  // entire table into memory. Consenting users only (others can't be notified).
  const cooldownCutoff = new Date(Date.now() - RE_ALERT_COOLDOWN_MS).toISOString();
  const { data: trackings, error } = await supabase
    .from('user_trackings')
    .select(
      'id, target_price, last_alerted_at, ' +
        'user:users!inner(id, toss_user_id, notification_consent), ' +
        'product:products!inner(id, name, current_lowest_price, current_lowest_shop)',
    )
    .eq('alert_enabled', true)
    .eq('user.notification_consent', true)
    .not('target_price', 'is', null)
    .or(`last_alerted_at.is.null,last_alerted_at.lt.${cooldownCutoff}`)
    .order('last_alerted_at', { ascending: true, nullsFirst: true })
    .limit(500);

  if (error) {
    console.error('check-alerts query error:', error.message);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  const now = Date.now();
  let sent = 0;

  for (const t of (trackings ?? []) as unknown as Array<{
    id: string;
    target_price: number | null;
    last_alerted_at: string | null;
    user: { id: string; toss_user_id: string; notification_consent: boolean };
    product: { id: string; name: string; current_lowest_price: number | null; current_lowest_shop: string | null };
  }>) {
    const price = t.product?.current_lowest_price;
    const target = t.target_price;
    if (price == null || target == null || price > target) continue;
    if (t.last_alerted_at && now - new Date(t.last_alerted_at).getTime() < RE_ALERT_COOLDOWN_MS) {
      continue;
    }

    if (t.user?.notification_consent && t.user.toss_user_id) {
      const ok = await sendMessage({
        userKey: t.user.toss_user_id,
        templateCode: TEMPLATES.priceDrop,
        title: '🎯 목표가 도달!',
        body: `${t.product.name} 지금 ${price.toLocaleString()}원! 목표가 ${target.toLocaleString()}원 아래로 내려갔어요.`,
        linkUrl: `${APP_LINK}/product/${t.product.id}`,
        variables: {
          productName: t.product.name,
          price: String(price),
          shop: t.product.current_lowest_shop ?? '',
        },
      });
      if (ok) sent += 1;
    }

    // Mark as alerted regardless of delivery success to respect the cooldown.
    await supabase
      .from('user_trackings')
      .update({ last_alerted_at: new Date().toISOString() })
      .eq('id', t.id);
  }

  return NextResponse.json({ ok: true, candidates: trackings?.length ?? 0, sent });
}
