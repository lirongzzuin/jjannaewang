import { useState, useCallback } from "react";
import { appLogin, type LoginResult } from "@/lib/apps-in-toss";
import { api } from "@/lib/api";
import { setToken } from "@/lib/session";
import { useAppStore } from "@/store";
import type { User } from "@/types";

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Apps-in-Toss authentication.
 *  1. appLogin() → { authorizationCode, referrer }
 *  2. POST /api/auth/toss → server exchanges code with Toss, returns { token, user }
 *  3. token persisted (session.ts), user stored in app store
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({ isLoading: false, error: null });
  const setUser = useAppStore((s) => s.setUser);
  const user = useAppStore((s) => s.user);

  const login = useCallback(async (): Promise<User | null> => {
    setState({ isLoading: true, error: null });
    try {
      const result: LoginResult = await appLogin();
      const data = await api.post<AuthResponse>("/api/auth/toss", {
        authorizationCode: result.authorizationCode,
        referrer: result.referrer,
      });
      setToken(data.token);
      setUser(data.user);
      setState({ isLoading: false, error: null });
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : "로그인에 실패했어요";
      setState({ isLoading: false, error: message });
      return null;
    }
  }, [setUser]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, [setUser]);

  return { user, ...state, login, logout };
}
