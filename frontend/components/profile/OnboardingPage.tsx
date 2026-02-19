'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/lib/stores/authStore';
import { bootstrapUser, updateMyProfile } from '@/lib/api/users';
import { CountrySearchField } from './CountrySearchField';

export function OnboardingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const [displayName, setDisplayName] = useState('');
  const [homeCountryCode, setHomeCountryCode] = useState<string | null>(null);

  const signInHref = useMemo(() => {
    const next = encodeURIComponent(pathname || `/${locale}/profile/onboarding`);
    return `/${locale}/auth/sign-in?next=${next}`;
  }, [locale, pathname]);

  useEffect(() => {
    if (isInitialized && !accessToken) {
      router.replace(signInHref);
    }
  }, [accessToken, isInitialized, router, signInHref]);

  const bootstrapQuery = useQuery({
    queryKey: ['user-bootstrap-onboarding'],
    queryFn: () => bootstrapUser(accessToken!),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!bootstrapQuery.data) return;
    setDisplayName(bootstrapQuery.data.display_name || '');
    setHomeCountryCode(bootstrapQuery.data.home_country_code || null);
    if (bootstrapQuery.data.display_name && bootstrapQuery.data.home_country_code) {
      router.replace(`/${locale}/profile`);
    }
  }, [bootstrapQuery.data, locale, router]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateMyProfile(
        {
          display_name: displayName.trim(),
          home_country_code: homeCountryCode,
        },
        accessToken!
      ),
    onSuccess: () => {
      router.replace(`/${locale}/profile`);
    },
  });

  if (!isInitialized || !accessToken || bootstrapQuery.isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{t('profile.onboardingTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label={t('profile.displayName')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <CountrySearchField
            label={t('profile.homeCountry')}
            placeholder={t('profile.homeCountryPlaceholder')}
            value={homeCountryCode}
            onChange={setHomeCountryCode}
          />
          <Button
            className="w-full"
            disabled={!displayName.trim() || !homeCountryCode}
            onClick={() => saveMutation.mutate()}
            isLoading={saveMutation.isPending}
          >
            {t('common.save')}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
