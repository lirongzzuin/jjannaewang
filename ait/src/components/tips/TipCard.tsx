import { Link } from "react-router-dom";
import { Tip, TIP_CATEGORIES } from "@/types";
import { formatDate } from "@/lib/utils";

interface TipCardProps {
  tip: Tip;
}

export default function TipCard({ tip }: TipCardProps) {
  const category = TIP_CATEGORIES.find((c) => c.id === tip.category);

  return (
    <article className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {category && (
            <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-800">
              {category.emoji} {category.label}
            </span>
          )}
          {tip.is_hot && (
            <span className="rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              HOT
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
            {tip.user?.nickname?.[0] || "U"}
          </div>
          <span className="text-[11px] text-slate-500">
            {tip.user?.nickname || "유저"} · Lv.{tip.user?.level || 1}
          </span>
        </div>
      </div>
      <Link to={`/tips/${tip.id}`}>
        <h3 className="mb-1 text-base font-bold leading-snug text-slate-900 transition-colors hover:text-primary">
          {tip.title}
        </h3>
        <p className="mb-2 line-clamp-2 text-sm text-slate-500">{tip.body}</p>
      </Link>
      {tip.tags.length > 0 && (
        <div className="mb-3 text-xs font-medium text-primary">
          {tip.tags.map((t) => `#${t}`).join(" ")}
        </div>
      )}
      <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-slate-400">
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
