import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

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
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const supabase = createServerClient();

  const { error } = await supabase.from('tips').delete()
    .eq('id', params.id).eq('user_id', session.uid);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
