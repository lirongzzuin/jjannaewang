import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAppStore } from "@/store";
import { formatDate } from "@/lib/utils";
import { TIP_CATEGORIES, type Tip, type TipComment } from "@/types";
import DisclaimerBanner from "@/components/ui/DisclaimerBanner";

export default function TipDetail() {
  const { id } = useParams();
  const user = useAppStore((s) => s.user);

  const [tip, setTip] = useState<Tip | null>(null);
  const [comments, setComments] = useState<TipComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [scrapped, setScrapped] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [t, c] = await Promise.all([
        api.get<{ tip: Tip }>(`/api/tips/${id}`),
        api.get<{ comments: TipComment[] }>(`/api/tips/${id}/comments`),
      ]);
      setTip(t.tip);
      setComments(c.comments ?? []);
      setUpvoted(t.tip?.my_reaction === "upvote");
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오지 못했어요");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const react = async (type: "upvote" | "scrap" | "report") => {
    if (!user || !id) return;
    // optimistic
    if (type === "upvote") setUpvoted((v) => !v);
    if (type === "scrap") setScrapped((v) => !v);
    try {
      await api.post(`/api/tips/${id}/react`, { user_id: user.id, type });
      if (type === "report") alert("신고가 접수됐어요");
    } catch {
      if (type === "upvote") setUpvoted((v) => !v);
      if (type === "scrap") setScrapped((v) => !v);
    }
  };

  const postComment = async () => {
    if (!user || !id || commentBody.trim().length === 0) return;
    setPosting(true);
    try {
      await api.post(`/api/tips/${id}/comments`, {
        user_id: user.id,
        body: commentBody.trim(),
      });
      setCommentBody("");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "댓글 등록 실패");
    } finally {
      setPosting(false);
    }
  };

  const category = tip ? TIP_CATEGORIES.find((c) => c.id === tip.category) : null;

  return (
    <div className="min-h-screen bg-background-light pb-28">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md">
        <Link to="/tips">
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </Link>
        <h1 className="text-base font-bold text-slate-900">꿀팁</h1>
      </header>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-300">
          <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <span className="material-symbols-outlined mb-2 text-4xl">error_outline</span>
          <p className="text-sm">{error}</p>
          <button onClick={load} className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-slate-900">
            다시 시도
          </button>
        </div>
      )}

      {tip && !loading && (
        <>
          <article className="bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
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
            <h2 className="text-xl font-extrabold leading-snug text-slate-900">{tip.title}</h2>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                {tip.user?.nickname?.[0] || "U"}
              </div>
              <span>
                {tip.user?.nickname || "유저"} · Lv.{tip.user?.level || 1}
              </span>
              <span>·</span>
              <span>{formatDate(tip.created_at)}</span>
              <span>·</span>
              <span>조회 {tip.view_count.toLocaleString()}</span>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
              {tip.body}
            </p>

            {tip.tags?.length > 0 && (
              <div className="mt-4 text-xs font-medium text-primary">
                {tip.tags.map((t) => `#${t}`).join(" ")}
              </div>
            )}

            {tip.link_url && (
              <a
                href={tip.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600"
              >
                <span className="material-symbols-outlined text-[18px]">link</span>
                <span className="truncate">{tip.link_url}</span>
              </a>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => react("upvote")}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                  upvoted
                    ? "border-red-200 bg-red-50 text-red-500"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${upvoted ? "fill-icon" : ""}`}>
                  favorite
                </span>
                {(tip.upvote_count + (upvoted && tip.my_reaction !== "upvote" ? 1 : 0)).toLocaleString()}
              </button>
              <button
                onClick={() => react("scrap")}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                  scrapped
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${scrapped ? "fill-icon" : ""}`}>
                  bookmark
                </span>
                스크랩
              </button>
              <button
                onClick={() => react("report")}
                className="ml-auto flex items-center gap-1 text-xs font-medium text-slate-400"
              >
                <span className="material-symbols-outlined text-[16px]">flag</span>
                신고
              </button>
            </div>
          </article>

          <div className="mt-2 bg-white">
            <DisclaimerBanner />
          </div>

          <section className="mt-2 bg-white p-4">
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              댓글 {comments.length.toLocaleString()}
            </h3>
            <div className="space-y-4">
              {comments.map((c) => (
                <CommentItem key={c.id} comment={c} />
              ))}
              {comments.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">
                  첫 댓글을 남겨보세요
                </p>
              )}
            </div>
          </section>
        </>
      )}

      {/* Comment composer */}
      {tip && !loading && (
        <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-app -translate-x-1/2 border-t border-slate-100 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="댓글을 입력하세요"
              disabled={!user}
              maxLength={500}
              className="flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-sm outline-none disabled:opacity-60"
            />
            <button
              onClick={postComment}
              disabled={!user || posting || commentBody.trim().length === 0}
              className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-40"
            >
              등록
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment }: { comment: TipComment }) {
  return (
    <div>
      <div className="flex items-start gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
          {comment.user?.nickname?.[0] || "U"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800">
              {comment.user?.nickname || "유저"}
            </span>
            <span className="text-[10px] text-slate-400">{formatDate(comment.created_at)}</span>
          </div>
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{comment.body}</p>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-9 mt-3 space-y-3 border-l-2 border-slate-100 pl-3">
          {comment.replies.map((r) => (
            <div key={r.id} className="flex items-start gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                {r.user?.nickname?.[0] || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    {r.user?.nickname || "유저"}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatDate(r.created_at)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
