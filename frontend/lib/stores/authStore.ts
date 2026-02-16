'use client';

import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  accessToken: string | null;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
  setInitialized: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  accessToken: null,
  isInitialized: false,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      accessToken: session?.access_token ?? null,
    }),
  clearSession: () =>
    set({
      session: null,
      user: null,
      accessToken: null,
    }),
  setInitialized: (value) => set({ isInitialized: value }),
}));
