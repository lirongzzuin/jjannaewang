import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { user_id, type } = await req.json();

  if (!user_id || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Toggle reaction
  const { data: existing } = await supabase
    .from('tip_reactions')
    .select('id')
    .eq('user_id', user_id)
    .eq('tip_id', params.id)
    .eq('type', type)
    .single();

  if (existing) {
    await supabase.from('tip_reactions').delete().eq('id', existing.id);
    if (type === 'upvote') {
      await supabase.rpc('decrement_upvote', { tip_id: params.id });
    } else if (type === 'scrap') {
      await supabase.rpc('decrement_scrap', { tip_id: params.id });
    }
    return NextResponse.json({ action: 'removed' });
  } else {
    await supabase.from('tip_reactions').insert({ user_id, tip_id: params.id, type });
    if (type === 'upvote') {
      await supabase.rpc('increment_upvote', { tip_id: params.id });
    } else if (type === 'scrap') {
      await supabase.rpc('increment_scrap', { tip_id: params.id });
    } else if (type === 'report') {
      const { data: tip } = await supabase.from('tips').select('report_count').eq('id', params.id).single();
      const newCount = (tip?.report_count || 0) + 1;
      await supabase.from('tips').update({
        report_count: newCount,
        is_blinded: newCount >= 5,
      }).eq('id', params.id);
    }
    return NextResponse.json({ action: 'added' });
  }
}
