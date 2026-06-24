import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Accept both field-naming conventions:
  //   orderId + sku + event   (from useIAP hook / processProductGrant)
  //   orderId + productId + userId + status  (from legacy / direct calls)
  const {
    orderId,
    sku,
    productId: rawProductId,
    userId,
    event,
    status,
  } = body as {
    orderId?: string;
    sku?: string;
    productId?: string;
    userId?: string;
    event?: string;
    status?: string;
  };

  const productId = rawProductId || sku;

  if (!orderId || !productId) {
    return NextResponse.json({ error: 'Missing fields: orderId and sku/productId are required' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Determine order status from either `event` or `status` field
  const orderStatus = status || (event === 'RESUME' ? 'resumed' : 'completed');

  // Upsert the order record (idempotent — safe to retry on RESUME)
  const { error: upsertError } = await supabase.from('iap_orders').upsert({
    order_id: orderId,
    user_id: userId || null,
    product_id: productId,
    status: orderStatus,
  }, { onConflict: 'order_id' });

  if (upsertError) {
    console.error('iap_orders upsert error:', upsertError.message);
    // Don't block the flow — log and continue
  }

  // Update user premium tier (only when userId is known)
  if (userId && (event !== 'RESUME' || orderStatus !== 'resumed')) {
    let premiumTier: string | null = null;
    let expiry: string | null = null;

    if (productId === 'premium_pro_monthly') {
      premiumTier = 'pro';
      expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (productId === 'premium_master_monthly') {
      premiumTier = 'master';
      expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    if (premiumTier) {
      await supabase.from('users').update({
        premium_tier: premiumTier,
        premium_expiry: expiry,
      }).eq('id', userId);
    }
  }

  return NextResponse.json({ ok: true, orderId, productId, status: orderStatus });
}
