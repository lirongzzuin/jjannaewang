import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('tip_comments')
    .select('*, user:users(id, nickname, level)')
    .eq('tip_id', params.id)
    .is('parent_id', null)
    .eq('is_blinded', false)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch replies for each comment
  const commentsWithReplies = await Promise.all(
    (data || []).map(async (comment) => {
      const { data: replies } = await supabase
        .from('tip_comments')
        .select('*, user:users(id, nickname, level)')
        .eq('parent_id', comment.id)
        .eq('is_blinded', false)
        .order('created_at', { ascending: true });
      return { ...comment, replies: replies || [] };
    })
  );

  return NextResponse.json({ comments: commentsWithReplies });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { user_id, body, parent_id } = await req.json();

  if (!user_id || !body) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  if (body.length > 500) return NextResponse.json({ error: 'Comment too long' }, { status: 400 });

  const { data, error } = await supabase.from('tip_comments').insert({
    tip_id: params.id,
    user_id,
    body,
    parent_id: parent_id || null,
  }).select('*, user:users(id, nickname, level)').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Increment comment count
  await supabase.rpc('increment_comment_count', { tip_id: params.id });

  return NextResponse.json({ comment: data });
}
