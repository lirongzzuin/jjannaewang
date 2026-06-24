import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { formatPrice, getLevelInfo, formatMonth, getCurrentMonth } from '@/lib/utils';
import { RankingEntry } from '@/types';
import { api } from '@/lib/api';
import EmptyState from '@/components/ui/EmptyState';

const RANKING_TABS = [
  { id: 'savings', label: '절약왕', emoji: '💰', unit: '절약금액' },
  { id: 'deals', label: '딜헌터', emoji: '🏹', unit: '특가 제보' },
  { id: 'tips', label: '꿀팁왕', emoji: '🍯', unit: '좋아요' },
];

interface RankingResponse {
  type: string;
  month: string;
  rankings: RankingEntry[];
  me: RankingEntry | null;
}

function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

function formatScore(score: number, tab: string): string {
  if (tab === 'savings') return formatPrice(score);
  if (tab === 'deals') return `${score}건`;
  return `${score.toLocaleString()} 좋아요`;
}

function PodiumCard({ entry, position }: { entry: RankingEntry; position: number }) {
  const levelInfo = getLevelInfo(entry.user.level);
  const heights = { 1: 'h-24', 2: 'h-16', 3: 'h-12' };
  const sizes = { 1: 'w-16 h-16 text-2xl', 2: 'w-12 h-12 text-lg', 3: 'w-12 h-12 text-lg' };
  const podiumColors = { 1: 'bg-primary', 2: 'bg-slate-400', 3: 'bg-amber-700' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <div className={`${sizes[position as 1|2|3]} rounded-full bg-slate-200 flex items-center justify-center border-2 ${position === 1 ? 'border-primary' : 'border-slate-300'}`}>
          <span>{levelInfo.icon}</span>
        </div>
        <span className="absolute -bottom-1 -right-1 text-base">{medals[position as 1|2|3]}</span>
        {entry.isMe && (
          <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-primary text-white px-1 rounded-full">나</span>
        )}
      </div>
      <p className="text-xs font-bold text-slate-800 text-center max-w-[70px] truncate">{entry.user.nickname}</p>
      <p className="text-[10px] text-slate-500">Lv.{entry.user.level}</p>
      <div className={`w-full ${heights[position as 1|2|3]} ${podiumColors[position as 1|2|3]} rounded-t-lg flex items-end justify-center pb-2`}>
        <span className="text-white font-extrabold text-lg">{position}</span>
      </div>
    </div>
  );
}

export default function Ranking() {
  const [activeTab, setActiveTab] = useState('savings');
  const season = useMemo(() => formatMonth(getCurrentMonth()), []);
  const daysRemaining = useMemo(() => getDaysRemainingInMonth(), []);

  const { data, error, isLoading } = useSWR(
    ['ranking', activeTab],
    () => api.get<RankingResponse>(`/api/ranking?type=${activeTab}`)
  );

  const rankings = data?.rankings ?? [];
  const me = data?.me ?? null;

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  const nextRankEntry = me ? rankings.find(r => r.rank === me.rank - 1) ?? null : null;

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 pt-4 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">이달의 랭킹 🏆</h1>
            <p className="text-xs text-slate-400 mt-0.5">{season} · 마감 {daysRemaining}일 남음</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] text-amber-600 font-medium">마감까지</p>
            <p className="text-lg font-extrabold text-amber-600">{daysRemaining}일</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1">
          {RANKING_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 pb-3 pt-2 text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400'
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <span className="material-symbols-outlined animate-spin text-4xl text-slate-300">progress_activity</span>
        </div>
      ) : error ? (
        <EmptyState
          icon="error"
          title="랭킹을 불러오지 못했어요"
          description="잠시 후 다시 시도해주세요."
        />
      ) : rankings.length === 0 ? (
        <EmptyState
          icon="trophy"
          title="아직 이달의 랭킹이 없어요"
          description="가장 먼저 절약하고 제보하고 꿀팁을 남겨 1등에 도전해보세요!"
        />
      ) : (
        <>
          {/* Podium */}
          <div className="bg-white py-6 mb-3">
            <div className="flex items-end justify-center gap-3 px-6">
              {top3[1] && <PodiumCard entry={top3[1]} position={2} />}
              {top3[0] && <PodiumCard entry={top3[0]} position={1} />}
              {top3[2] && <PodiumCard entry={top3[2]} position={3} />}
            </div>
            {/* Top 3 scores */}
            <div className="flex justify-center gap-3 mt-4 px-6">
              {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry, i) => (
                <div key={i} className="flex-1 text-center">
                  <p className="text-[10px] text-slate-400">{formatScore(entry.score, activeTab)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rankings 4+ */}
          <div className="bg-white mx-0 mb-24">
            {rest.map((entry) => {
              const levelInfo = getLevelInfo(entry.user.level);
              return (
                <div
                  key={entry.user.id}
                  className={`flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 ${entry.isMe ? 'bg-primary/5' : ''}`}
                >
                  <div className="w-7 text-center">
                    <span className={`text-sm font-extrabold ${entry.isMe ? 'text-primary' : 'text-slate-400'}`}>
                      {entry.rank}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg border-2 border-slate-200">
                    {levelInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-bold ${entry.isMe ? 'text-primary' : 'text-slate-900'} truncate`}>
                        {entry.user.nickname}
                      </p>
                      {entry.isMe && (
                        <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">나</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">Lv.{entry.user.level} {getLevelInfo(entry.user.level).title}</p>
                  </div>
                  <p className={`text-sm font-bold ${entry.isMe ? 'text-primary' : 'text-slate-700'}`}>
                    {formatScore(entry.score, activeTab)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* My rank sticky footer */}
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 z-20">
            {me ? (
              <div className="bg-slate-900 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
                <div className="w-8 text-center">
                  <span className="text-sm font-extrabold text-primary">{me.rank}위</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {getLevelInfo(me.user.level).icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{me.user.nickname}</p>
                  <p className="text-[10px] text-white/50">{formatScore(me.score, activeTab)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/50">다음 순위까지</p>
                  <p className="text-xs font-bold text-primary">
                    {nextRankEntry
                      ? `${formatScore(nextRankEntry.score - me.score, activeTab)} 차이`
                      : '최고 순위!'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-lg">🏃</div>
                <div className="flex-1">
                  <p className="text-sm font-bold">아직 순위에 들지 못했어요</p>
                  <p className="text-[10px] text-white/50">지금 절약하고 제보하면 순위에 올라요!</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
