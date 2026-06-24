'use client';
import { useState } from 'react';
import Link from 'next/link';
import { TIP_CATEGORIES, TipComment } from '@/types';
import { formatDate } from '@/lib/utils';
import { MOCK_USER } from '@/store';
import { share, getTossShareLink } from '@/lib/apps-in-toss';

const MOCK_TIP = {
  id: 'tip1',
  title: '카드사 생활비 캐시백 총정리 (2026년 2월 최신)',
  body: `카드사마다 생활비 캐시백 혜택이 다른데, 직접 비교해봤습니다.

**1. 현대카드 ZERO Edition2**
- 마트/편의점: 2% 적립
- 주유: 2% 적립
- 연회비: 15,000원
- 월 실적 조건: 30만원 이상

**2. KB국민 MY WE:SH**
- 대형마트: 0.7% 할인
- 온라인쇼핑: 0.5% 할인
- 연회비: 국내전용 0원
- 월 실적 조건: 없음

**3. 신한 딥드림 카드**
- 편의점: 10% 할인
- 카페: 5% 할인
- 연회비: 20,000원
- 월 실적 조건: 40만원 이상

결론적으로 한 달 편의점 지출이 많으면 신한 딥드림, 마트 위주면 현대 ZERO, 아무것도 귀찮으면 KB MY WE:SH 추천합니다.

개인적으로 저는 현대 ZERO + 신한 딥드림 조합으로 월 3~4만원 절약 중이에요.`,
  category: 'benefit',
  tags: ['카드', '캐시백', '생활비', '신용카드'],
  link_url: null,
  image_urls: [] as string[],
  upvote_count: 2341,
  downvote_count: 12,
  comment_count: 89,
  scrap_count: 445,
  view_count: 12890,
  is_hot: true,
  created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  user: { ...MOCK_USER, id: 'u1', nickname: '절약고수', level: 8 },
};

const MOCK_COMMENTS: TipComment[] = [
  {
    id: 'c1',
    tip_id: 'tip1',
    user_id: 'u2',
    parent_id: null,
    body: '현대 ZERO 진짜 좋아요. 저도 마트 주로 이용하는데 실적 맞추기도 쉽고 적립도 꽤 되더라고요.',
    upvote_count: 45,
    is_blinded: false,
    report_count: 0,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: { ...MOCK_USER, id: 'u2', nickname: '카드마니아', level: 5 },
    replies: [
      {
        id: 'c1r1',
        tip_id: 'tip1',
        user_id: 'u3',
        parent_id: 'c1',
        body: '저도 현대 ZERO 쓰는데 월 3만원 정도 적립돼요. 진짜 짭짤함ㅋㅋ',
        upvote_count: 12,
        is_blinded: false,
        report_count: 0,
        created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        user: { ...MOCK_USER, id: 'u3', nickname: '짠순이', level: 3 },
      }
    ],
  },
  {
    id: 'c2',
    tip_id: 'tip1',
    user_id: 'u4',
    parent_id: null,
    body: '신한 딥드림은 편의점 10% 할인이 진짜 맞나요?? 조건이 있는 건 아닌지 궁금합니다',
    upvote_count: 18,
    is_blinded: false,
    report_count: 0,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    user: { ...MOCK_USER, id: 'u4', nickname: '궁금한사람', level: 2 },
    replies: [
      {
        id: 'c2r1',
        tip_id: 'tip1',
        user_id: 'u1',
        parent_id: 'c2',
        body: '월 실적 40만원 이상 채우면 가능해요! 실적 미달 시 할인율이 절반으로 줄어들어요.',
        upvote_count: 31,
        is_blinded: false,
        report_count: 0,
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        user: { ...MOCK_USER, id: 'u1', nickname: '절약고수', level: 8 },
      }
    ],
  },
  {
    id: 'c3',
    tip_id: 'tip1',
    user_id: 'u5',
    parent_id: null,
    body: '정리 진짜 깔끔하네요. 따봉합니다 👍',
    upvote_count: 8,
    is_blinded: false,
    report_count: 0,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    user: { ...MOCK_USER, id: 'u5', nickname: '감사한사람', level: 1 },
    replies: [],
  },
];

export default function TipDetailPage({ params }: { params: { id: string } }) {
  const tip = MOCK_TIP;
  const [upvoted, setUpvoted] = useState(false);
  const [scrapped, setScrapped] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(tip.upvote_count);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const category = TIP_CATEGORIES.find(c => c.id === tip.category);

  const handleUpvote = () => {
    setUpvoted(!upvoted);
    setUpvoteCount(c => upvoted ? c - 1 : c + 1);
  };

  const handleScrap = () => setScrapped(!scrapped);

  const handleShare = async () => {
    const url = `${window.location.origin}/tips/${tip.id}`;
    const link = await getTossShareLink(url);
    await share({ message: `[짠내왕 꿀팁] ${tip.title}\n${link}` });
  };

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <Link href="/tips">
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </Link>
        <button className="p-1 hover:bg-slate-100 rounded-full">
          <span className="material-symbols-outlined text-slate-600">more_vert</span>
        </button>
      </header>

      <div className="bg-white mb-3">
        <div className="px-4 pt-5 pb-4">
          {/* Category + Hot badge */}
          <div className="flex items-center gap-2 mb-3">
            {category && (
              <span className="bg-primary/20 text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
                {category.emoji} {category.label}
              </span>
            )}
            {tip.is_hot && (
              <span className="bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">HOT</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-extrabold text-slate-900 leading-snug mb-4">{tip.title}</h1>

          {/* Author info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                {tip.user.nickname[0]}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900">{tip.user.nickname}</span>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Lv.{tip.user.level}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>{formatDate(tip.created_at)}</span>
                  <span>·</span>
                  <span>조회 {tip.view_count.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <button className="px-3 py-1.5 border border-primary text-primary text-xs font-bold rounded-full hover:bg-primary/10 transition-colors">
              팔로우
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 mx-4" />

        {/* Post content */}
        <div className="px-4 py-5">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{tip.body}</p>
        </div>

        {/* Tags */}
        {tip.tags.length > 0 && (
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {tip.tags.map(tag => (
              <span key={tag} className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Reaction bar */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors ${
                upvoted ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${upvoted ? 'fill-icon' : ''}`}>favorite</span>
              <span className="text-xs font-bold">{upvoteCount.toLocaleString()}</span>
            </button>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
              <span className="text-xs font-semibold">{tip.comment_count}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="material-symbols-outlined text-[20px]">visibility</span>
              <span className="text-xs font-semibold">{tip.view_count.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleScrap}
              className={`p-2 rounded-xl transition-colors ${scrapped ? 'text-primary bg-primary/10' : 'text-slate-400 bg-slate-100'}`}
            >
              <span className={`material-symbols-outlined text-[20px] ${scrapped ? 'fill-icon' : ''}`}>bookmark</span>
            </button>
            <button onClick={handleShare} className="p-2 rounded-xl bg-slate-100 text-slate-400">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="bg-white">
        <div className="px-4 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">댓글 {MOCK_COMMENTS.length}개</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {MOCK_COMMENTS.map(comment => (
            <div key={comment.id} className="px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                  {comment.user?.nickname?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900">{comment.user?.nickname}</span>
                    <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">Lv.{comment.user?.level}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{comment.body}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <button className="flex items-center gap-1 text-slate-400">
                      <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                      <span className="text-[11px]">{comment.upvote_count}</span>
                    </button>
                    <button
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                      className="text-[11px] font-bold text-slate-400 hover:text-primary transition-colors"
                    >
                      답글
                    </button>
                    <span className="text-[10px] text-slate-300">{formatDate(comment.created_at)}</span>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="flex items-start gap-2 bg-slate-50 rounded-xl p-3">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-[11px] font-bold shrink-0">
                            {reply.user?.nickname?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-bold text-slate-900">{reply.user?.nickname}</span>
                              <span className="text-[9px] text-primary font-bold">Lv.{reply.user?.level}</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{reply.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  {replyTo === comment.id && (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="답글 달기..."
                        className="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                      />
                      <button className="px-3 py-2 bg-primary text-white text-xs font-bold rounded-xl">
                        등록
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom comment input */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-slate-100 px-4 py-3 pb-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
          {MOCK_USER.nickname[0]}
        </div>
        <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-2xl px-4 py-2.5">
          <input
            type="text"
            placeholder="댓글 달기..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
          />
          {commentText && (
            <button className="text-primary font-bold text-sm shrink-0">
              등록
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
