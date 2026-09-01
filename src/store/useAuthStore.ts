import { create } from 'zustand';
import { User, Role } from '../types';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem(
      'stationery-auth',
      JSON.stringify({ state: { user, accessToken, refreshToken } })
    );
    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
  },

  setUser: (user) => {
    set((state) => {
      const updated = { ...state, user };
      localStorage.setItem(
        'stationery-auth',
        JSON.stringify({
          state: { user, accessToken: state.accessToken, refreshToken: state.refreshToken },
        })
      );
      return updated;
    });
  },

  refreshUser: async () => {
    try {
      const res = (await api.get('/auth/me')) as any;
      if (res?.data) {
        const updatedUser = res.data;
        set((state) => {
          const updated = { ...state, user: updatedUser };
          localStorage.setItem(
            'stationery-auth',
            JSON.stringify({
              state: { user: updatedUser, accessToken: state.accessToken, refreshToken: state.refreshToken },
            })
          );
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  },

  logout: () => {
    localStorage.removeItem('stationery-auth');
    localStorage.removeItem('stationery-cart');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },

  initialize: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('stationery-auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.accessToken && parsed?.state?.user) {
          set({
            user: parsed.state.user,
            accessToken: parsed.state.accessToken,
            refreshToken: parsed.state.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
    } catch {
      // ignore
    }
    set({ isLoading: false });
  },
}));
