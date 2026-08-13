import { create } from 'zustand';
import { authApi } from '../api/client';
import type { UsuarioSesion } from '../api/client';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: UsuarioSesion | null;
  status: AuthStatus;
  error: string | null;
  checkSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,

  checkSession: async () => {
    set({ status: 'loading' });
    try {
      const { usuario } = await authApi.me();
      set({ user: usuario, status: 'authenticated', error: null });
    } catch {
      set({ user: null, status: 'unauthenticated' });
    }
  },

  login: async (email, password) => {
    set({ status: 'loading', error: null });
    try {
      const { usuario } = await authApi.login(email, password);
      set({ user: usuario, status: 'authenticated', error: null });
    } catch (err) {
      set({ status: 'unauthenticated', error: (err as Error).message });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, status: 'unauthenticated', error: null });
    }
  }
}));
