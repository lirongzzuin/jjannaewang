export default function DisclaimerBanner() {
  return (
    <div className="mx-4 mb-4">
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 p-3">
        <span className="material-symbols-outlined text-amber-500 text-[18px] mt-0.5 shrink-0">info</span>
        <div>
          <p className="text-xs font-bold text-amber-800 mb-0.5">커뮤니티 가이드</p>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            본 게시판의 정보는 유저들의 개인 경험이며, 투자/금융 결정은 본인의 판단과 책임 하에 이루어져야 합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
