import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser, isTossExchangeConfigured } from '@/lib/auth';

// CORS + OPTIONS are handled centrally in src/middleware.ts.

// SKU → entitlement mapping. Keep in sync with the SPA premium page + console.
const SKU_TIERS: Record<string, { tier: string; days: number }> = {
  premium_pro_monthly: { tier: 'pro', days: 30 },
  premium_master_monthly: { tier: 'master', days: 30 },
};

/** Verify an order with Toss before granting (production only). */
async function verifyTossOrder(orderId: string, userKey?: string): Promise<boolean> {
  if (!isTossExchangeConfigured()) return true; // sandbox: trust SDK grant flow
  try {
    const base = process.env.TOSS_PARTNER_API_BASE!.replace(/\/$/, '');
    const res = await fetch(`${base}/api-partner/v1/apps-in-toss/order/get-order-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userKey ? { 'x-toss-user-key': userKey } : {}),
      },
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string };
    return data.status === 'COMPLETED';
  } catch (e) {
    console.error('verifyTossOrder error:', e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    orderId?: string;
    sku?: string;
    productId?: string;
    event?: string;
  };

  const orderId = body.orderId;
  const productId = body.productId || body.sku;
  if (!orderId || !productId) {
    return NextResponse.json({ error: 'orderId and sku are required' }, { status: 400 });
  }

  // Trust the authenticated session for the user id — never the request body.
  const session = getAuthUser(req);
  const userId = session?.uid ?? null;

  const supabase = createServerClient();
  const isResume = body.event === 'RESUME';
  const orderStatus = isResume ? 'resumed' : 'completed';

  // Idempotent order record.
  const { error: upsertError } = await supabase.from('iap_orders').upsert(
    { order_id: orderId, user_id: userId, product_id: productId, status: orderStatus },
    { onConflict: 'order_id' },
  );
  if (upsertError) console.error('iap_orders upsert error:', upsertError.message);

  // Grant entitlement only for a known SKU, a known user, and a verified order.
  const mapping = SKU_TIERS[productId];
  if (userId && mapping && !isResume) {
    const ok = await verifyTossOrder(orderId, session?.tid);
    if (!ok) {
      return NextResponse.json({ error: '주문 검증에 실패했어요' }, { status: 402 });
    }
    const expiry = new Date(Date.now() + mapping.days * 24 * 60 * 60 * 1000).toISOString();
    const { error: updErr } = await supabase
      .from('users')
      .update({ premium_tier: mapping.tier, premium_expiry: expiry })
      .eq('id', userId);
    if (updErr) {
      console.error('premium grant error:', updErr.message);
      return NextResponse.json({ error: '권한 부여에 실패했어요' }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, orderId, productId, status: orderStatus });
}
