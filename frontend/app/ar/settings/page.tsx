'use client';

import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { ThemeSelector } from '@/components/ui/ThemeToggle';

export default function SettingsPage() {
  const t = useTranslations('settings');

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('theme')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeSelector />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('language')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg bg-primary text-white">
                العربية
              </button>
              <button className="px-4 py-2 rounded-lg border border-border hover:bg-surface">
                English
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
