'use client';

import { useLocale } from 'next-intl';

/**
 * Hook to get the current text direction based on locale
 * @returns 'rtl' for Arabic, 'ltr' for all other languages
 */
export function useDirection() {
  const locale = useLocale();
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Hook to check if current locale is RTL
 * @returns true for Arabic, false for all other languages
 */
export function useIsRTL() {
  const locale = useLocale();
  return locale === 'ar';
}
