import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest } from 'next/server';

// ─── Session tokens (compact, signed; JWT-like HS256) ─────────────────────────
// Issued by /api/auth/toss after a successful Toss code exchange. The .ait SPA
// stores it and sends it as `Authorization: Bearer <token>` on each request.

const SECRET = process.env.SESSION_SECRET || process.env.CRON_SECRET || 'dev-insecure-secret';
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

export interface SessionPayload {
  uid: string; // internal user id (users.id)
  tid: string; // toss_user_id
  iat: number;
  exp: number;
}

export function signSession(uid: string, tid: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { uid, tid, iat: now, exp: now + TTL_SECONDS };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac('sha256', SECRET).update(body).digest());
  return `${body}.${sig}`;
}

export function verifySession(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = b64url(createHmac('sha256', SECRET).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body).toString('utf8')) as SessionPayload;
    if (!payload.uid || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Extract & verify the authenticated user id from the request, or null. */
export function getAuthUser(req: NextRequest): SessionPayload | null {
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return verifySession(header.slice(7).trim());
}

// ─── Toss code exchange ───────────────────────────────────────────────────────
// Production: exchange the single-use authorizationCode for tokens via the Toss
// partner OAuth endpoint (mTLS), then resolve a stable user key.
// Docs: https://developers-apps-in-toss.toss.im/login/develop.html
//
// mTLS + partner credentials are required in production; when they are not
// configured (local/sandbox dev) we fall back to a deterministic sandbox user
// so the flow is fully testable. NEVER ship to production without the creds.

export interface TossIdentity {
  tossUserId: string;
  nickname?: string;
  profileImageUrl?: string;
}

export function isTossExchangeConfigured(): boolean {
  return Boolean(process.env.TOSS_PARTNER_API_BASE && process.env.TOSS_PARTNER_CLIENT_ID);
}

export async function exchangeTossCode(
  authorizationCode: string,
  referrer?: string,
): Promise<TossIdentity> {
  if (isTossExchangeConfigured()) {
    const base = process.env.TOSS_PARTNER_API_BASE!.replace(/\/$/, '');
    const res = await fetch(`${base}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.TOSS_PARTNER_CLIENT_ID
          ? { 'X-Partner-Client-Id': process.env.TOSS_PARTNER_CLIENT_ID }
          : {}),
      },
      body: JSON.stringify({ authorizationCode, grantType: 'authorization_code', referrer }),
    });
    if (!res.ok) {
      throw new Error(`Toss token exchange failed (${res.status})`);
    }
    const data = (await res.json()) as {
      accessToken?: string;
      userKey?: string;
      userId?: string;
      nickname?: string;
    };
    const tossUserId = data.userKey || data.userId;
    if (!tossUserId) throw new Error('Toss exchange returned no user key');
    return { tossUserId, nickname: data.nickname };
  }

  // Dev/sandbox fallback — deterministic user key, but NO fixed nickname:
  // returning a fixed nickname here would make every new user identical.
  // Leaving it undefined lets /api/auth/toss assign a unique random nickname.
  return {
    tossUserId: 'sandbox-' + authorizationCode.slice(-12),
    nickname: undefined,
  };
}
