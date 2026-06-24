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
