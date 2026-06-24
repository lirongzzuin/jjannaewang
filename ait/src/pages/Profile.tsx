import { Link } from "react-router-dom";
import useSWR from "swr";
import { getLevelInfo, getNextLevelExp, formatDate, formatPriceShort } from '@/lib/utils';
import { getLevelPerks, PERK_MILESTONES } from '@/lib/level-perks';
import { useAppStore } from '@/store';
import { LEVEL_INFO, BADGES, User } from '@/types';
import { share, getTossShareLink, inviteFriends } from '@/lib/apps-in-toss';
import { api } from '@/lib/api';

interface MeResponse {
  user: User;
  badges: { badge_code: string; earned_at: string }[];
  stats: {
    savedThisMonth: number;
    trackingCount: number;
    dealCount: number;
    tipCount: number;
  };
}

async function handleShareProfile(nickname: string, level: number) {
  const url = `${window.location.origin}/profile`;
  const link = await getTossShareLink(url);
  await share({
    message: `[짠내왕] 나는 Lv.${level} ${nickname}! 같이 절약왕 해봐요 👑\n${link}`,
  });
}

async function handleInviteFriends() {
  const url = `${window.location.origin}/`;
  await inviteFriends(url, '[짠내왕] 같이 최저가 추적하고 절약해요! 👑');
}

export default function Profile() {
  const storeUser = useAppStore((s) => s.user);
  const { data, isLoading } = useSWR(
    storeUser ? '/api/me' : null,
    () => api.get<MeResponse>('/api/me')
  );

  const menuItems = [
    { icon: 'visibility', label: '내 추적 목록', href: '/tracking', badge: data ? String(data.stats.trackingCount) : null },
    { icon: 'lightbulb', label: '내가 쓴 꿀팁', href: '/tips', badge: data ? String(data.stats.tipCount) : null },
    { icon: 'bookmark', label: '스크랩한 꿀팁', href: '/tips', badge: null },
    { icon: 'workspace_premium', label: '프리미엄 구독', href: '/premium', badge: 'PRO' },
  ];

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <Link to="/">
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </Link>
        <h1 className="text-base font-bold text-slate-900">마이 프로필</h1>
        <div className="flex items-center gap-1">
          {data && (
            <button
              onClick={() => handleShareProfile(data.user.nickname, data.user.level)}
              className="p-1.5 hover:bg-slate-100 rounded-full"
              aria-label="프로필 공유"
            >
              <span className="material-symbols-outlined text-slate-600 text-[22px]">share</span>
            </button>
          )}
        </div>
      </header>

      {!storeUser ? (
        <div className="flex items-center justify-center py-24">
          <span className="material-symbols-outlined animate-spin text-4xl text-slate-300">progress_activity</span>
        </div>
      ) : isLoading || !data ? (
        <div className="flex items-center justify-center py-24">
          <span className="material-symbols-outlined animate-spin text-4xl text-slate-300">progress_activity</span>
        </div>
      ) : (
        <ProfileBody user={data.user} badges={data.badges} stats={data.stats} />
      )}

      {/* Friend Invite (contactsViral) */}
      <div className="mx-4 mb-3 bg-gradient-to-br from-amber-400 to-primary rounded-2xl p-5 text-white shadow-lg shadow-primary/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🎁</div>
          <div>
            <p className="font-extrabold text-base">친구 초대하면 EXP 500 보너스!</p>
            <p className="text-xs text-white/80">친구가 가입하면 둘 다 혜택을 받아요</p>
          </div>
        </div>
        <button
          onClick={() => handleInviteFriends()}
          className="w-full py-2.5 bg-white text-primary rounded-xl text-sm font-extrabold active:scale-95 transition-transform"
        >
          친구에게 짠내왕 알리기
        </button>
      </div>

      {/* Menu */}
      <div className="bg-white mb-6">
        {menuItems.map((item, i) => (
          <Link key={i} to={item.href}>
            <div className="flex items-center px-4 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-slate-500 text-[22px] mr-3">{item.icon}</span>
              <span className="flex-1 text-sm font-semibold text-slate-800">{item.label}</span>
              {item.badge && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full mr-2 ${
                  item.badge === 'PRO' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.badge}
                </span>
              )}
              <span className="material-symbols-outlined text-slate-300 text-[18px]">chevron_right</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Version */}
      <p className="text-center text-[11px] text-slate-300 pb-4">짠내왕 v{import.meta.env.VITE_APP_VERSION ?? '0.1.0'} · Made with 💛</p>
    </div>
  );
}

function ProfileBody({
  user,
  badges,
  stats,
}: {
  user: User;
  badges: { badge_code: string; earned_at: string }[];
  stats: MeResponse['stats'];
}) {
  const levelInfo = getLevelInfo(user.level);
  const prevLevelInfo = getLevelInfo(Math.max(1, user.level - 1));
  const nextLevelExp = getNextLevelExp(user.level);
  const prevLevelExp = prevLevelInfo.minExp;
  const expProgress = Math.min(100, Math.round(((user.exp - prevLevelExp) / (nextLevelExp - prevLevelExp)) * 100));

  const ringColor = user.level >= 9 ? 'from-primary to-orange-500'
    : user.level >= 7 ? 'from-yellow-400 to-primary'
    : user.level >= 5 ? 'from-amber-400 to-yellow-300'
    : 'from-slate-300 to-slate-400';

  const earnedCodes = new Set(badges.map((b) => b.badge_code));
  const earnedCount = BADGES.filter((b) => earnedCodes.has(b.code)).length;

  const statItems = [
    { label: '이번 달 절약', value: formatPriceShort(stats.savedThisMonth), icon: 'savings' },
    { label: '추적 상품', value: `${stats.trackingCount}개`, icon: 'visibility' },
    { label: '특가 제보', value: `${stats.dealCount}건`, icon: 'campaign' },
    { label: '꿀팁 작성', value: `${stats.tipCount}개`, icon: 'lightbulb' },
  ];

  return (
    <>
      {/* Profile card */}
      <div className="bg-white mb-3 px-4 py-6">
        <div className="flex items-start gap-4 mb-5">
          {/* Avatar with level ring */}
          <div className="relative shrink-0">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${ringColor} p-0.5`}>
              <div className="w-full h-full rounded-full bg-amber-100 flex items-center justify-center text-3xl">
                {levelInfo.icon}
              </div>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full whitespace-nowrap">
              Lv.{user.level}
            </div>
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0 pt-1">
            <h2 className="text-xl font-extrabold text-slate-900">{user.nickname}</h2>
            <p className="text-sm font-bold text-primary mt-0.5">{levelInfo.title}</p>
            <p className="text-xs text-slate-400 mt-1">
              가입일 {formatDate(user.created_at)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full">
                🔥 {user.streak_days}일 연속
              </div>
              {user.premium_tier && (
                <div className="flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full">
                  👑 {user.premium_tier.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* EXP bar */}
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>EXP {user.exp.toLocaleString()}</span>
          <span>Lv.{user.level + 1}까지 {Math.max(0, nextLevelExp - user.exp).toLocaleString()} EXP</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-primary to-yellow-300 rounded-full transition-all duration-700"
            style={{ width: `${expProgress}%` }}
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          {statItems.map(stat => (
            <div key={stat.label} className="bg-slate-50 rounded-xl p-2.5 text-center">
              <span className="material-symbols-outlined text-primary text-[20px] mb-1 block">{stat.icon}</span>
              <p className="text-sm font-extrabold text-slate-800">{stat.value}</p>
              <p className="text-[9px] text-slate-400 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Peer comparison */}
        <PeerComparison />
      </div>

      {/* Level perks */}
      <LevelPerksSection level={user.level} />

      {/* Badges */}
      <div className="bg-white mb-3 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-slate-900">획득한 뱃지</h3>
          <p className="text-xs text-slate-400">{earnedCount}/{BADGES.length}</p>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {BADGES.map(badge => {
            const earned = earnedCodes.has(badge.code);
            return (
              <div
                key={badge.code}
                className={`flex-none flex flex-col items-center gap-1 ${!earned ? 'opacity-30 grayscale' : ''}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border-2 border-amber-100 flex items-center justify-center text-2xl">
                  {badge.emoji}
                </div>
                <p className="text-[9px] text-slate-600 font-medium text-center max-w-[48px] leading-tight">{badge.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Level progress */}
      <div className="bg-white mb-3 px-4 py-4">
        <h3 className="text-sm font-extrabold text-slate-900 mb-3">레벨 로드맵</h3>
        <div className="space-y-2">
          {LEVEL_INFO.map(lv => (
            <div key={lv.level} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 ${
                user.level >= lv.level ? 'border-primary bg-primary/10' : 'border-slate-200 bg-slate-50 opacity-50'
              }`}>
                {lv.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-bold ${user.level >= lv.level ? 'text-slate-900' : 'text-slate-300'}`}>
                    Lv.{lv.level} {lv.title}
                  </p>
                  <p className="text-[10px] text-slate-400">{lv.minExp.toLocaleString()} EXP</p>
                </div>
              </div>
              {user.level === lv.level && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">현재</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function LevelPerksSection({ level }: { level: number }) {
  const perks = getLevelPerks(level);
  const next = PERK_MILESTONES.find((m) => m.level > level);

  const active: string[] = [];
  if (perks.extraTrackingSlots > 0) active.push(`추적 슬롯 +${perks.extraTrackingSlots}`);
  if (perks.freeAiAnalysis) active.push("가격 분석 무료");
  if (perks.interstitialEvery === Infinity) active.push("전면광고 없음");
  else if (perks.interstitialEvery > 4) active.push("전면광고 절반");

  return (
    <div className="bg-white mb-3 px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-900">레벨 혜택</h3>
        <span className="text-[11px] text-slate-400">EXP를 모아 레벨업하면 더 많은 혜택이 열려요</span>
      </div>
      {active.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {active.map((a) => (
            <span
              key={a}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary"
            >
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              {a}
            </span>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-xs text-slate-400">아직 열린 혜택이 없어요. 활동하고 레벨을 올려보세요!</p>
      )}
      {next && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
          <span className="material-symbols-outlined text-[18px] text-amber-500">lock_open</span>
          <p className="text-xs text-amber-800">
            <span className="font-bold">Lv.{next.level}</span> 달성 시 · {next.label}
          </p>
        </div>
      )}
    </div>
  );
}

interface InsightsResponse {
  savedThisMonth: number;
  topPercent: number | null;
  peerAverage: number;
  vsPeer: number;
  peerCount: number;
}

function PeerComparison() {
  const { data } = useSWR('/api/me/insights', () => api.get<InsightsResponse>('/api/me/insights'));
  if (!data) return null;

  if (data.topPercent == null) {
    return (
      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-center">
        <p className="text-xs text-slate-500">
          이번 달 절약을 기록하면 또래와 순위를 비교할 수 있어요
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl bg-primary/10 px-4 py-3 text-center">
      <p className="text-xs text-slate-600">이번 달 절약 순위</p>
      <p className="text-lg font-extrabold text-primary">
        상위 {data.topPercent}%
      </p>
      <p className="mt-0.5 text-[11px] text-slate-500">
        {data.vsPeer >= 0
          ? `또래 평균보다 ${formatPriceShort(data.vsPeer)} 더 아꼈어요 👏`
          : `또래 평균까지 ${formatPriceShort(Math.abs(data.vsPeer))} 남았어요`}
      </p>
    </div>
  );
}
