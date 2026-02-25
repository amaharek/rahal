import 'leaflet/dist/leaflet.css';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/layout/Header';
import { locales } from '@/lib/i18n';
import '@/app/globals.css';

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const titles: Record<string, string> = {
    ar: 'رحال - اكتشف العالم من خلال اللعب',
    en: 'Rahal - Discover the World Through Play',
    es: 'Rahal - Descubre el Mundo a Través del Juego',
  };

  const descriptions: Record<string, string> = {
    ar: 'لعبة جغرافية عربية تفاعلية لاكتشاف العالم',
    en: 'An interactive geography game to discover the world',
    es: 'Un juego interactivo de geografía para descubrir el mundo',
  };

  const ogLocales: Record<string, string> = {
    ar: 'ar_SA',
    en: 'en_US',
    es: 'es_ES',
  };

  const title = titles[locale] ?? titles.en;
  const description = descriptions[locale] ?? descriptions.en;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: ogLocales[locale] ?? 'en_US',
      type: 'website' as const,
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0D7377',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const isRTL = locale === 'ar';

  return (
    <html
      lang={locale}
      dir={isRTL ? 'rtl' : 'ltr'}
      className={ibmPlexArabic.variable}
      suppressHydrationWarning
    >
      <body
        className={`${isRTL ? 'font-arabic' : 'font-sans'} bg-background text-text-primary min-h-screen antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Header />
            <main className="pt-16">{children}</main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
