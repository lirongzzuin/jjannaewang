export interface PioneerReward {
  exp: number;
  badge: string;
  badgeName: string;
  badgeEmoji: string;
  message: string;
}

/**
 * Celebration modal shown when a user earns a pioneer reward (first to
 * contribute a deal/tip). Rendered after a successful first post.
 */
export default function RewardCelebration({
  reward,
  onClose,
}: {
  reward: PioneerReward;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-8">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[320px] animate-slide-up rounded-3xl bg-white p-7 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-5xl">
          {reward.badgeEmoji}
        </div>
        <p className="text-lg font-extrabold text-slate-900">개척자 보상 획득!</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">{reward.message}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-bold text-primary">
            +{reward.exp} EXP
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">
            {reward.badgeEmoji} {reward.badgeName}
          </span>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-bold text-slate-900"
        >
          좋아요!
        </button>
      </div>
    </div>
  );
}
