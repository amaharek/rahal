'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/lib/stores/authStore';
import { supabase } from '@/lib/supabase/client';

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const signInHref = useMemo(() => {
    const next = encodeURIComponent(pathname || `/${locale}`);
    return `/${locale}/auth/sign-in?next=${next}`;
  }, [pathname, locale]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href={`/${locale}/profile`}
                className="text-sm font-medium text-text-primary hover:text-primary"
              >
                {user.user_metadata?.full_name || user.email || t('profile.title')}
              </Link>
              <Button size="sm" variant="outline" onClick={handleSignOut}>
                {t('profile.signOut')}
              </Button>
            </>
          ) : (
            <Link href={signInHref}>
              <Button size="sm" variant="primary">
                {t('auth.signIn')}
              </Button>
            </Link>
          )}
        </div>

        {/* Global Controls - Always at the end (right in LTR, left in RTL) */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="dropdown" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
