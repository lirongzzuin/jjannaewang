import { LEVEL_INFO } from '@/types';
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number): string {
  return `₩${price.toLocaleString('ko-KR')}`;
}

export function formatPriceShort(price: number): string {
  if (price >= 100000000) return `${(price / 100000000).toFixed(1)}억`;
  if (price >= 10000) return `${(price / 10000).toFixed(1)}만원`;
  return `₩${price.toLocaleString('ko-KR')}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  return `${year}년 ${parseInt(month)}월`;
}

export function getPriceChangePercent(current: number, previous: number): number {
  return Math.round(((current - previous) / previous) * 100);
}

export function getLevelInfo(level: number) {
  return LEVEL_INFO[Math.min(level - 1, LEVEL_INFO.length - 1)];
}

export function getLevelFromExp(exp: number) {
  for (let i = LEVEL_INFO.length - 1; i >= 0; i--) {
    if (exp >= LEVEL_INFO[i].minExp) return LEVEL_INFO[i].level;
  }
  return 1;
}

export function getNextLevelExp(level: number): number {
  const nextLevel = LEVEL_INFO.find(l => l.level === level + 1);
  return nextLevel?.minExp ?? LEVEL_INFO[LEVEL_INFO.length - 1].minExp;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '...';
}

export function getDiscountRate(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100);
}

export function generateShareText(savedAmount: number, _month?: string): string {
  return `나 이번 달 짠내왕에서 ${formatPrice(savedAmount)} 아꼈어ㅋㅋ 거지력 만렙 달성 중! 👑`;
}
