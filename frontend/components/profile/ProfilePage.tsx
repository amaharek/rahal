'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/lib/stores/authStore';
import { supabase } from '@/lib/supabase/client';
import { bootstrapUser, getMyAchievements, getMyProfile, updateMyProfile } from '@/lib/api/users';
import { CountrySearchField } from './CountrySearchField';

export function ProfilePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [homeCountryCode, setHomeCountryCode] = useState<string | null>(null);

  const signInHref = useMemo(() => {
    const next = encodeURIComponent(pathname || `/${locale}/profile`);
    return `/${locale}/auth/sign-in?next=${next}`;
  }, [locale, pathname]);

  useEffect(() => {
    if (isInitialized && !accessToken) {
      router.replace(signInHref);
    }
  }, [accessToken, isInitialized, router, signInHref]);

  const bootstrapQuery = useQuery({
    queryKey: ['user-bootstrap'],
    queryFn: () => bootstrapUser(accessToken!),
    enabled: Boolean(accessToken),
    retry: 1,
  });

  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => getMyProfile(accessToken!),
    enabled: Boolean(accessToken) && bootstrapQuery.isSuccess,
    retry: 1,
  });

  const achievementsQuery = useQuery({
    queryKey: ['my-achievements'],
    queryFn: () => getMyAchievements(accessToken!),
    enabled: Boolean(accessToken) && bootstrapQuery.isSuccess,
    retry: 1,
  });

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    setDisplayName(profile.display_name || '');
    setUsername(profile.username || '');
    setHomeCountryCode(profile.home_country_code || null);

    if (!profile.display_name || !profile.home_country_code) {
      router.replace(`/${locale}/profile/onboarding`);
    }
  }, [profileQuery.data, locale, router]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateMyProfile(
        {
          display_name: displayName.trim() || null,
          username: username.trim() || null,
          home_country_code: homeCountryCode,
        },
        accessToken!
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });

  if (!isInitialized || !accessToken) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </main>
    );
  }

  if (bootstrapQuery.isPending || profileQuery.isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </main>
    );
  }

  const profile = profileQuery.data;
  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>{t('common.error')}</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <Card data-testid="user-profile">
        <CardHeader>
          <CardTitle>{t('profile.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label={t('profile.displayName')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label={t('profile.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <CountrySearchField
            label={t('profile.homeCountry')}
            placeholder={t('profile.homeCountryPlaceholder')}
            value={homeCountryCode}
            onChange={setHomeCountryCode}
          />
          <Button
            data-testid="edit-profile"
            onClick={() => updateMutation.mutate()}
            isLoading={updateMutation.isPending}
          >
            {t('profile.editProfile')}
          </Button>
          <p className="text-sm text-text-secondary">
            {t('profile.memberSince')}: {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('home.yourStats')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>{t('stats.gamesPlayed')}: {profile.games_played}</div>
          <div>{t('stats.gamesWon')}: {profile.games_won}</div>
          <div>{t('stats.currentStreak')}: {profile.current_streak}</div>
          <div>{t('stats.maxStreak')}: {profile.max_streak}</div>
          <div>{t('stats.winRate')}: {profile.win_rate.toFixed(1)}%</div>
          <div>{t('stats.accuracy')}: {profile.quiz_accuracy.toFixed(1)}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('profile.achievements')}</CardTitle>
        </CardHeader>
        <CardContent>
          {achievementsQuery.data && achievementsQuery.data.length > 0 ? (
            <ul className="space-y-2">
              {achievementsQuery.data.map((item) => (
                <li key={item.id} className="p-2 rounded border border-border">
                  {locale === 'ar' ? item.achievement.name_ar : item.achievement.name_en}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-secondary">{t('profile.noAchievements')}</p>
          )}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={async () => {
          await supabase.auth.signOut();
          router.replace(`/${locale}`);
        }}
      >
        {t('profile.signOut')}
      </Button>
    </main>
  );
}
