'use client';
import Link from 'next/link';
import { Tip, TIP_CATEGORIES } from '@/types';
import { formatDate } from '@/lib/utils';

interface TipCardProps {
  tip: Tip;
}

export default function TipCard({ tip }: TipCardProps) {
  const category = TIP_CATEGORIES.find(c => c.id === tip.category);

  return (
    <article className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {category && (
            <span className="bg-primary/20 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              {category.emoji} {category.label}
            </span>
          )}
          {tip.is_hot && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">HOT</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-[10px] font-bold overflow-hidden">
            {tip.user?.nickname?.[0] || 'U'}
          </div>
          <span className="text-[11px] text-slate-500">{tip.user?.nickname || '유저'} · Lv.{tip.user?.level || 1}</span>
        </div>
      </div>
      <Link href={`/tips/${tip.id}`}>
        <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug hover:text-primary transition-colors">
          {tip.title}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-2">{tip.body}</p>
      </Link>
      {tip.tags.length > 0 && (
        <div className="text-xs font-medium text-primary mb-3">
          {tip.tags.map(t => `#${t}`).join(' ')}
        </div>
      )}
      <div className="flex items-center justify-between text-slate-400 border-t border-slate-50 pt-3">
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">favorite</span>
            <span className="text-xs">{tip.upvote_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
            <span className="text-xs">{tip.comment_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span className="text-xs">{tip.view_count.toLocaleString()}</span>
          </div>
        </div>
        <span className="text-[10px]">{formatDate(tip.created_at)}</span>
      </div>
    </article>
  );
}
