'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { locales, type Locale } from '@/lib/i18n';

interface LanguageSwitcherProps {
  variant?: 'buttons' | 'dropdown';
  className?: string;
}

const LANGUAGE_NAMES: Record<Locale, { native: string; english: string; flag: string }> = {
  ar: { native: 'العربية', english: 'Arabic', flag: '🇸🇦' },
  en: { native: 'English', english: 'English', flag: '🇬🇧' },
  es: { native: 'Español', english: 'Spanish', flag: '🇪🇸' },
};

export function LanguageSwitcher({ variant = 'buttons', className }: LanguageSwitcherProps) {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('settings');

  const switchLanguage = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    // Replace the locale in the pathname
    // Pathname format: /[locale]/path
    const pathWithoutLocale = pathname.split('/').slice(2).join('/');
    const newPath = `/${newLocale}${pathWithoutLocale ? `/${pathWithoutLocale}` : ''}`;
    
    router.push(newPath);
  };

  if (variant === 'dropdown') {
    return (
      <div className={cn('relative', className)}>
        <select
          value={currentLocale}
          onChange={(e) => switchLanguage(e.target.value as Locale)}
          className="px-4 py-2 rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-hover transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={t('language')}
        >
          {locales.map((locale) => (
            <option key={locale} value={locale}>
              {LANGUAGE_NAMES[locale].flag} {LANGUAGE_NAMES[locale].native}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2', className)} role="group" aria-label={t('language')}>
      {locales.map((locale) => {
        const isActive = locale === currentLocale;
        const lang = LANGUAGE_NAMES[locale];
        
        return (
          <button
            key={locale}
            onClick={() => switchLanguage(locale)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'border border-border bg-surface hover:bg-surface-hover text-text-primary'
            )}
            aria-label={`Switch to ${lang.english}`}
            aria-pressed={isActive}
          >
            <span className="inline-flex items-center gap-2">
              <span role="img" aria-label={lang.english}>
                {lang.flag}
              </span>
              <span>{lang.native}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
