'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Compass className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl font-semibold text-text-primary mb-2">
          {t('errors.notFound')}
        </p>
        <p className="text-text-secondary mb-8">
          {t('game.subtitle')}
        </p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
        >
          {t('common.home')}
        </Link>
      </div>
    </main>
  );
}
