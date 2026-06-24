'use client';
import { useState, useCallback } from 'react';
import { appLogin, type LoginResult } from '@/lib/apps-in-toss';

export interface TossUser {
  userId: string;
  nickname: string;
  profileImageUrl?: string;
}

interface AuthState {
  user: TossUser | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for Apps-in-Toss authentication.
 *
 * Flow:
 *  1. Call login() — triggers appLogin() → { authorizationCode, referrer }
 *  2. POST authorizationCode to your server (/api/auth/toss)
 *  3. Server exchanges it with Toss for user info (userId, nickname, …)
 *  4. User stored in local state
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    error: null,
  });

  const login = useCallback(async (): Promise<TossUser | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result: LoginResult = await appLogin();

      // Exchange authorization code for user info via server
      const res = await fetch('/api/auth/toss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizationCode: result.authorizationCode }),
      });
      if (!res.ok) throw new Error('인증 서버 오류가 발생했어요');
      const data = await res.json();

      const user: TossUser = {
        userId: data.userId,
        nickname: data.nickname,
        profileImageUrl: data.profileImageUrl,
      };

      setState({ user, isLoading: false, error: null });
      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인 실패';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, isLoading: false, error: null });
  }, []);

  return { ...state, login, logout };
}
