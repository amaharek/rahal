import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Providers } from '@/components/Providers';
import '@/app/globals.css';

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata = {
  title: '\u0631\u062D\u0627\u0644 - \u0627\u0643\u062A\u0634\u0641 \u0627\u0644\u0639\u0627\u0644\u0645 \u0645\u0646 \u062E\u0644\u0627\u0644 \u0627\u0644\u0644\u0639\u0628',
  description: '\u0644\u0639\u0628\u0629 \u062C\u063A\u0631\u0627\u0641\u064A\u0629 \u0639\u0631\u0628\u064A\u0629 \u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0644\u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0644\u0639\u0627\u0644\u0645',
  keywords: ['\u0631\u062D\u0627\u0644', '\u062C\u063A\u0631\u0627\u0641\u064A\u0627', '\u0644\u0639\u0628\u0629', '\u0639\u0631\u0628\u064A', '\u062F\u0648\u0644', '\u0639\u0648\u0627\u0635\u0645'],
  authors: [{ name: 'Rahal Team' }],
  openGraph: {
    title: '\u0631\u062D\u0627\u0644 - \u0627\u0643\u062A\u0634\u0641 \u0627\u0644\u0639\u0627\u0644\u0645 \u0645\u0646 \u062E\u0644\u0627\u0644 \u0627\u0644\u0644\u0639\u0628',
    description: '\u0644\u0639\u0628\u0629 \u062C\u063A\u0631\u0627\u0641\u064A\u0629 \u0639\u0631\u0628\u064A\u0629 \u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u0644\u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0644\u0639\u0627\u0644\u0645',
    locale: 'ar_SA',
    type: 'website',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#0D7377',
  },
};

export default async function ArabicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="ar" dir="rtl" className={ibmPlexArabic.variable} suppressHydrationWarning>
      <body className="font-arabic bg-background text-text-primary min-h-screen antialiased">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
