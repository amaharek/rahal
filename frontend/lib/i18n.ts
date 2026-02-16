import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['ar', 'en', 'es'] as const;
export const defaultLocale = 'ar' as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  // Validate that the incoming locale is valid
  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
