'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/authStore';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setInitialized(true);
      })
      .catch(() => {
        if (!mounted) return;
        clearSession();
        setInitialized(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
      } else {
        clearSession();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, clearSession, setInitialized]);

  return <>{children}</>;
}
