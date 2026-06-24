import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('tips')
    .select('*, user:users(id, nickname, level)')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Increment view count
  await supabase.from('tips').update({ view_count: (data.view_count || 0) + 1 }).eq('id', params.id);

  return NextResponse.json({ tip: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { user_id } = await req.json();

  const { error } = await supabase.from('tips').delete()
    .eq('id', params.id).eq('user_id', user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
