import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, PremiumTier } from '@/types';

// 글자 크기 단계 (중장년층 접근성). rem 기반이라 root font-size를 키우면 전체가 커짐.
export type FontScale = 1 | 1.15 | 1.3;
export const FONT_SCALE_OPTIONS: { value: FontScale; label: string }[] = [
  { value: 1, label: '보통' },
  { value: 1.15, label: '크게' },
  { value: 1.3, label: '아주 크게' },
];

interface AppState {
  user: User | null;
  premiumTier: PremiumTier;
  isDarkMode: boolean;
  fontScale: FontScale;

  setUser: (user: User | null) => void;
  setPremiumTier: (tier: PremiumTier) => void;
  toggleDarkMode: () => void;
  setFontScale: (scale: FontScale) => void;
  addExp: (amount: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      premiumTier: 'free',
      isDarkMode: false,
      fontScale: 1,

      setUser: (user) => set({ user, premiumTier: (user?.premium_tier as PremiumTier) ?? 'free' }),
      setPremiumTier: (tier) => set({ premiumTier: tier }),
      toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
      setFontScale: (scale) => set({ fontScale: scale }),
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
