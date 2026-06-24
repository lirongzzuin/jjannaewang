'use client';
import { useState, useMemo } from 'react';
import { formatPrice, getLevelInfo, formatMonth, getCurrentMonth } from '@/lib/utils';
import { RankingEntry } from '@/types';
import { MOCK_USER } from '@/store';

const RANKING_TABS = [
  { id: 'savings', label: '절약왕', emoji: '💰', unit: '절약금액' },
  { id: 'deals', label: '딜헌터', emoji: '🏹', unit: '특가 제보' },
  { id: 'tips', label: '꿀팁왕', emoji: '🍯', unit: '좋아요' },
];

const MOCK_SAVINGS_RANKING: RankingEntry[] = [
  { rank: 1, user: { ...MOCK_USER, id: 'r1', nickname: '짠내왕킹', level: 10, total_saved_amount: 3240000 }, score: 3240000 },
  { rank: 2, user: { ...MOCK_USER, id: 'r2', nickname: '절약고수A', level: 9, total_saved_amount: 2890000 }, score: 2890000 },
  { rank: 3, user: { ...MOCK_USER, id: 'r3', nickname: '거지대공', level: 9, total_saved_amount: 2650000 }, score: 2650000 },
  { rank: 4, user: { ...MOCK_USER, id: 'r4', nickname: '절약왕B', level: 8, total_saved_amount: 2310000 }, score: 2310000 },
  { rank: 5, user: { ...MOCK_USER, id: 'r5', nickname: '짠테크교수', level: 8, total_saved_amount: 2100000 }, score: 2100000 },
  { rank: 6, user: { ...MOCK_USER, id: 'r6', nickname: '쿠폰마스터', level: 7, total_saved_amount: 1980000 }, score: 1980000 },
  { rank: 7, user: { ...MOCK_USER, id: 'r7', nickname: '특가헌터', level: 7, total_saved_amount: 1750000 }, score: 1750000 },
  { rank: 8, user: { ...MOCK_USER, id: 'r8', nickname: '절약달인', level: 6, total_saved_amount: 1560000 }, score: 1560000 },
  { rank: 9, user: { ...MOCK_USER, id: 'r9', nickname: '짠순이', level: 6, total_saved_amount: 1340000 }, score: 1340000 },
  { rank: 10, user: { ...MOCK_USER, id: 'r10', nickname: '절약초보', level: 5, total_saved_amount: 1200000 }, score: 1200000, isMe: true },
];

const MOCK_DEALS_RANKING: RankingEntry[] = [
  { rank: 1, user: { ...MOCK_USER, id: 'r11', nickname: '딜헌터킹', level: 9 }, score: 89 },
  { rank: 2, user: { ...MOCK_USER, id: 'r12', nickname: '특가마왕', level: 8 }, score: 72 },
  { rank: 3, user: { ...MOCK_USER, id: 'r13', nickname: '제보전사', level: 8 }, score: 65 },
  { rank: 4, user: { ...MOCK_USER, id: 'r14', nickname: '특가탐정', level: 7 }, score: 54 },
  { rank: 5, user: { ...MOCK_USER, id: 'r15', nickname: '딜발굴러', level: 7 }, score: 48 },
  { rank: 6, user: { ...MOCK_USER, id: 'u1', nickname: '짠내왕유저', level: 5 }, score: 12, isMe: true },
];

const MOCK_TIPS_RANKING: RankingEntry[] = [
  { rank: 1, user: { ...MOCK_USER, id: 'r21', nickname: '꿀팁마스터', level: 10 }, score: 12450 },
  { rank: 2, user: { ...MOCK_USER, id: 'r22', nickname: '절약교수', level: 9 }, score: 9820 },
  { rank: 3, user: { ...MOCK_USER, id: 'r23', nickname: '짠테크박사', level: 8 }, score: 7650 },
  { rank: 4, user: { ...MOCK_USER, id: 'r24', nickname: '꿀정보왕', level: 8 }, score: 6230 },
  { rank: 5, user: { ...MOCK_USER, id: 'r25', nickname: '정보공유러', level: 7 }, score: 5100 },
];

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

function PodiumCard({ entry, tab, position }: { entry: RankingEntry; tab: string; position: number }) {
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

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState('savings');
  const season = useMemo(() => formatMonth(getCurrentMonth()), []);
  const daysRemaining = useMemo(() => getDaysRemainingInMonth(), []);

  const rankings = activeTab === 'savings' ? MOCK_SAVINGS_RANKING
    : activeTab === 'deals' ? MOCK_DEALS_RANKING
    : MOCK_TIPS_RANKING;

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);
  const myEntry = rankings.find(r => r.isMe);
  const currentTab = RANKING_TABS.find(t => t.id === activeTab)!;

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

      {/* Podium */}
      <div className="bg-white py-6 mb-3">
        <div className="flex items-end justify-center gap-3 px-6">
          {top3[1] && <PodiumCard entry={top3[1]} tab={activeTab} position={2} />}
          {top3[0] && <PodiumCard entry={top3[0]} tab={activeTab} position={1} />}
          {top3[2] && <PodiumCard entry={top3[2]} tab={activeTab} position={3} />}
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
      {myEntry && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 z-20">
          <div className="bg-slate-900 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
            <div className="w-8 text-center">
              <span className="text-sm font-extrabold text-primary">{myEntry.rank}위</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {getLevelInfo(myEntry.user.level).icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{myEntry.user.nickname}</p>
              <p className="text-[10px] text-white/50">{formatScore(myEntry.score, activeTab)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/50">다음 순위까지</p>
              <p className="text-xs font-bold text-primary">
                {rest.length > 0 && myEntry.rank > 1
                  ? `${formatScore(rankings[myEntry.rank - 2].score - myEntry.score, activeTab)} 차이`
                  : '최고 순위!'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
