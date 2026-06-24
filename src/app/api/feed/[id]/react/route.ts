import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

// POST /api/feed/[id]/react  Body: { type: 'fire' | 'bought' | 'report' }
// fire = toggle; bought/report = add-once. Keeps deal_posts counters in sync.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const { type } = (await req.json().catch(() => ({}))) as { type?: string };
  if (!type || !['fire', 'bought', 'report'].includes(type)) {
    return NextResponse.json({ error: '잘못된 요청이에요' }, { status: 400 });
  }

  const supabase = createServerClient();
  const dealId = params.id;

  const { data: existing } = await supabase
    .from('deal_reactions')
    .select('id')
    .eq('user_id', session.uid)
    .eq('deal_id', dealId)
    .eq('type', type)
    .maybeSingle();

  const { data: deal } = await supabase
    .from('deal_posts')
    .select('fire_count, bought_count, report_count')
    .eq('id', dealId)
    .single();
  if (!deal) return NextResponse.json({ error: '딜을 찾을 수 없어요' }, { status: 404 });

  // fire is a toggle; bought/report are add-once.
  if (existing && type === 'fire') {
    await supabase.from('deal_reactions').delete().eq('id', existing.id);
    await supabase
      .from('deal_posts')
      .update({ fire_count: Math.max(0, (deal.fire_count ?? 0) - 1) })
      .eq('id', dealId);
    return NextResponse.json({ action: 'removed', type });
  }
  if (existing) {
    return NextResponse.json({ action: 'noop', type }); // already counted
  }

  await supabase.from('deal_reactions').insert({ user_id: session.uid, deal_id: dealId, type });

  if (type === 'fire') {
    await supabase.from('deal_posts').update({ fire_count: (deal.fire_count ?? 0) + 1 }).eq('id', dealId);
  } else if (type === 'bought') {
    await supabase.from('deal_posts').update({ bought_count: (deal.bought_count ?? 0) + 1 }).eq('id', dealId);
  } else if (type === 'report') {
    const newCount = (deal.report_count ?? 0) + 1;
    await supabase
      .from('deal_posts')
      .update({ report_count: newCount, is_expired: newCount >= 5 })
      .eq('id', dealId);
  }
  return NextResponse.json({ action: 'added', type });
}
