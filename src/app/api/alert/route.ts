import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const supabase = createServerClient();
  const { tracking_id, alert_enabled } = await req.json();

  if (!tracking_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { error } = await supabase
    .from('user_trackings')
    .update({ alert_enabled })
    .eq('id', tracking_id)
    .eq('user_id', session.uid);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
