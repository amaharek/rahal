'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';

export function SignInPage() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || `/${locale}/profile`;

  const handleGoogleSignIn = async () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectTo = `${appUrl}${next}`;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.signIn')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={handleGoogleSignIn}>
            {t('auth.signIn')} Google
          </Button>
          <Link href={`/${locale}`} className="block text-sm text-center text-text-secondary">
            {t('auth.continueAsGuest')}
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
