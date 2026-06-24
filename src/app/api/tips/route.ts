import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getRedis, KEYS } from '@/lib/upstash';
import { containsBannedWords } from '@/lib/moderation';
import { getAuthUser } from '@/lib/auth';
import { awardPioneer } from '@/lib/rewards';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const category = req.nextUrl.searchParams.get('category') || 'all';
  const sort = req.nextUrl.searchParams.get('sort') || 'popular';
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'));
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('tips')
    .select('*, user:users(id, nickname, level)', { count: 'exact' })
    .eq('is_blinded', false)
    .range(offset, offset + limit - 1);

  if (category !== 'all') {
    query = query.eq('category', category);
  }

  if (sort === 'popular') {
    query = query.order('upvote_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tips: data || [], total: count || 0, page, limit });
}

export async function POST(req: NextRequest) {
  const session = getAuthUser(req);
  if (!session) return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 });

  const supabase = createServerClient();
  const body = await req.json();
  const { title, body: postBody, category, tags, link_url, image_urls } = body as {
    title?: string;
    body?: string;
    category?: string;
    tags?: string[];
    link_url?: string;
    image_urls?: string[];
  };

  // Required field check
  if (!title || !postBody || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Content length validation
  const trimmedTitle = title.trim();
  const trimmedBody = postBody.trim();
  if (trimmedTitle.length < 5) {
    return NextResponse.json({ error: '제목은 5자 이상이어야 합니다' }, { status: 400 });
  }
  if (trimmedTitle.length > 40) {
    return NextResponse.json({ error: '제목은 40자 이하여야 합니다' }, { status: 400 });
  }
  if (trimmedBody.length < 20) {
    return NextResponse.json({ error: '내용은 20자 이상이어야 합니다' }, { status: 400 });
  }
  if (trimmedBody.length > 2000) {
    return NextResponse.json({ error: '내용은 2000자 이하여야 합니다' }, { status: 400 });
  }

  // Validate URL if provided
  if (link_url) {
    try { new URL(link_url); } catch {
      return NextResponse.json({ error: '유효하지 않은 링크 주소입니다' }, { status: 400 });
    }
  }

  // Banned word check
  if (containsBannedWords(trimmedTitle) || containsBannedWords(trimmedBody)) {
    return NextResponse.json({ error: '사용할 수 없는 단어가 포함되어 있습니다' }, { status: 400 });
  }

  // Rate limiting: 5 tips per user per hour (atomic INCR — no race condition)
  try {
    const redis = getRedis();
    const rateLimitKey = KEYS.rateLimitTip(session.uid);
    const count = await redis.incr(rateLimitKey);
    if (count === 1) {
      // First request in this window — set 1-hour TTL
      await redis.expire(rateLimitKey, 3600);
    }
    if (count > 5) {
      return NextResponse.json({ error: '1시간에 최대 5개까지 작성할 수 있어요' }, { status: 429 });
    }
  } catch (redisErr) {
    // Rate limiting failure is non-fatal — allow through and log
    console.warn('Redis rate limit check failed:', redisErr);
  }

  const { data, error } = await supabase.from('tips').insert({
    user_id: session.uid,
    title: trimmedTitle,
    body: trimmedBody,
    category,
    tags: tags?.slice(0, 5).map(t => t.trim()).filter(Boolean) ?? [],
    link_url: link_url?.trim() || null,
    image_urls: image_urls?.slice(0, 3) ?? [],
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Pioneer reward — first tip in this category.
  let reward = null;
  const { count } = await supabase
    .from('tips')
    .select('*', { count: 'exact', head: true })
    .eq('category', category);
  if ((count ?? 0) <= 1) reward = await awardPioneer(supabase, session.uid, 'tip');

  return NextResponse.json({ tip: data, reward }, { status: 201 });
}
