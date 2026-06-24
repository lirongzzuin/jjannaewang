import { Link } from "react-router-dom";
import { getLevelInfo, getNextLevelExp, formatDate } from '@/lib/utils';
import { MOCK_USER } from '@/store';
import { LEVEL_INFO } from '@/types';
import { share, getTossShareLink, contactsViral } from '@/lib/apps-in-toss';

const MOCK_BADGES = [
  { code: 'first_track', name: '첫 알림 등록', emoji: '🔔', earned: true },
  { code: 'save_100k', name: '10만원 절약', emoji: '💰', earned: true },
  { code: 'streak_7', name: '7일 연속', emoji: '🔥', earned: true },
  { code: 'tips_10', name: '꿀팁 10개', emoji: '🍯', earned: true },
  { code: 'hot_tip', name: '인기 꿀팁', emoji: '⭐', earned: false },
  { code: 'save_1m', name: '100만원 절약', emoji: '🏆', earned: false },
  { code: 'streak_30', name: '30일 연속', emoji: '💎', earned: false },
  { code: 'report_10', name: '특가 제보 10회', emoji: '🏹', earned: false },
];

const STATS = [
  { label: '총 절약금액', value: '120만원', icon: 'savings' },
  { label: '추적 상품', value: '8개', icon: 'visibility' },
  { label: '꿀팁 작성', value: '4개', icon: 'lightbulb' },
  { label: '스크랩', value: '23개', icon: 'bookmark' },
];

const MENU_ITEMS = [
  { icon: 'visibility', label: '내 추적 목록', href: '/tracking', badge: '8' },
  { icon: 'lightbulb', label: '내가 쓴 꿀팁', href: '/tips', badge: '4' },
  { icon: 'bookmark', label: '스크랩한 꿀팁', href: '/tips', badge: '23' },
  { icon: 'flag', label: '신고 내역', href: '#', badge: null },
  { icon: 'workspace_premium', label: '프리미엄 구독', href: '/premium', badge: 'PRO' },
  { icon: 'settings', label: '설정', href: '#', badge: null },
];

async function handleShareProfile(nickname: string, level: number) {
  const url = `${window.location.origin}/profile`;
  const link = await getTossShareLink(url);
  await share({
    message: `[짠내왕] 나는 Lv.${level} ${nickname}! 같이 절약왕 해봐요 👑\n${link}`,
  });
}

async function handleInviteFriends() {
  await contactsViral();
}

export default function Profile() {
  const user = MOCK_USER;
  const levelInfo = getLevelInfo(user.level);
  const prevLevelInfo = getLevelInfo(Math.max(1, user.level - 1));
  const nextLevelExp = getNextLevelExp(user.level);
  const prevLevelExp = prevLevelInfo.minExp;
  const expProgress = Math.min(100, Math.round(((user.exp - prevLevelExp) / (nextLevelExp - prevLevelExp)) * 100));

  const ringColor = user.level >= 9 ? 'from-primary to-orange-500'
    : user.level >= 7 ? 'from-yellow-400 to-primary'
    : user.level >= 5 ? 'from-amber-400 to-yellow-300'
    : 'from-slate-300 to-slate-400';

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <Link to="/">
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </Link>
        <h1 className="text-base font-bold text-slate-900">마이 프로필</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleShareProfile(user.nickname, user.level)}
            className="p-1.5 hover:bg-slate-100 rounded-full"
            aria-label="프로필 공유"
          >
            <span className="material-symbols-outlined text-slate-600 text-[22px]">share</span>
          </button>
          <Link to="#">
            <span className="material-symbols-outlined text-slate-600">settings</span>
          </Link>
        </div>
      </header>

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
          <span>Lv.{user.level + 1}까지 {(nextLevelExp - user.exp).toLocaleString()} EXP</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-primary to-yellow-300 rounded-full transition-all duration-700"
            style={{ width: `${expProgress}%` }}
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          {STATS.map(stat => (
            <div key={stat.label} className="bg-slate-50 rounded-xl p-2.5 text-center">
              <span className="material-symbols-outlined text-primary text-[20px] mb-1 block">{stat.icon}</span>
              <p className="text-sm font-extrabold text-slate-800">{stat.value}</p>
              <p className="text-[9px] text-slate-400 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white mb-3 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-slate-900">획득한 뱃지</h3>
          <p className="text-xs text-slate-400">{MOCK_BADGES.filter(b => b.earned).length}/{MOCK_BADGES.length}</p>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {MOCK_BADGES.map(badge => (
            <div
              key={badge.code}
              className={`flex-none flex flex-col items-center gap-1 ${!badge.earned ? 'opacity-30 grayscale' : ''}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border-2 border-amber-100 flex items-center justify-center text-2xl">
                {badge.emoji}
              </div>
              <p className="text-[9px] text-slate-600 font-medium text-center max-w-[48px] leading-tight">{badge.name}</p>
            </div>
          ))}
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
        {MENU_ITEMS.map((item, i) => (
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
