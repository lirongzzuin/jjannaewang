import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, PremiumTier } from '@/types';

interface AppState {
  user: User | null;
  premiumTier: PremiumTier;
  isDarkMode: boolean;

  setUser: (user: User | null) => void;
  setPremiumTier: (tier: PremiumTier) => void;
  toggleDarkMode: () => void;
  addExp: (amount: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      premiumTier: 'free',
      isDarkMode: false,

      setUser: (user) => set({ user, premiumTier: (user?.premium_tier as PremiumTier) ?? 'free' }),
      setPremiumTier: (tier) => set({ premiumTier: tier }),
      toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
      addExp: (amount) => {
        const { user } = get();
        if (!user) return;
        const newExp = user.exp + amount;
        set({ user: { ...user, exp: newExp } });
      },
    }),
    { name: 'jjannaewang-store' }
  )
);

// Mock user for development
export const MOCK_USER: User = {
  id: 'mock-user-001',
  toss_user_id: 'toss-001',
  nickname: '짠내왕유저',
  level: 5,
  exp: 1000,
  premium_tier: null,
  premium_expiry: null,
  total_saved_amount: 1200000,
  streak_days: 7,
  warning_count: 0,
  is_banned: false,
  last_login_at: new Date().toISOString(),
  created_at: '2023-10-01T00:00:00Z',
};
