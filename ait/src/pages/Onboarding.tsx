import { useNavigate } from "react-router-dom";

// Optional intro. Apps-in-Toss has no separate login — identity comes from Toss
// automatically (see AppInitializer), so this is purely informational.
const FEATURES = [
  {
    icon: "monitoring",
    title: "최저가를 주식 차트처럼",
    desc: "생활용품 가격 변동을 한눈에. 지금이 살 때인지 데이터로 분석해드려요.",
  },
  {
    icon: "notifications_active",
    title: "목표가 도달 알림",
    desc: "원하는 가격으로 떨어지면 토스 알림으로 바로 알려드려요.",
  },
  {
    icon: "groups",
    title: "짠내 커뮤니티",
    desc: "실시간 특가 제보와 절약 꿀팁을 함께 나눠요.",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background-light px-6 py-10">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">👑</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">짠내왕</h1>
          <p className="mt-2 text-sm text-slate-500">
            최저가 추적 & 절약 커뮤니티
            <br />
            지금 얼마가 제일 쌀까? 짠내왕이 알려드려요.
          </p>
        </div>

        <div className="space-y-3">
          {FEATURES.map((f) => (
            <div
              key={f.icon}
              className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <span className="material-symbols-outlined text-primary">{f.icon}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{f.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <button
          onClick={() => navigate("/", { replace: true })}
          className="w-full rounded-2xl bg-primary py-4 text-base font-bold text-slate-900 shadow-lg shadow-primary/30 transition-all active:scale-95"
        >
          시작하기
        </button>
        <p className="text-center text-[10px] leading-relaxed text-slate-400">
          가격 정보는 참고용이며 실제 구매가와 다를 수 있어요.
          <br />
          투자·구매 결정은 본인의 판단과 책임 하에 이루어집니다.
        </p>
      </div>
    </div>
  );
}
