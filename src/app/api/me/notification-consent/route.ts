import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

// POST /api/me/notification-consent — record push opt-in. (CORS via middleware)
// Body: { agreed: boolean }
export async function POST(req: NextRequest) {
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const { agreed } = (await req.json().catch(() => ({}))) as { agreed?: boolean };
  const supabase = createServerClient();

  const { error } = await supabase
    .from('users')
    .update({
      notification_consent: Boolean(agreed),
      notification_consent_at: agreed ? new Date().toISOString() : null,
    })
    .eq('id', session.uid);

  if (error) {
    console.error('notification-consent error:', error.message);
    return NextResponse.json({ error: '저장에 실패했어요' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, agreed: Boolean(agreed) });
}
