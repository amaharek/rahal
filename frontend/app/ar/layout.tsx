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
  title: 'رحال - اكتشف العالم من خلال اللعب',
  description: 'لعبة جغرافية عربية تفاعلية لاكتشاف العالم',
  keywords: ['رحال', 'جغرافيا', 'لعبة', 'عربي', 'دول', 'عواصم'],
  authors: [{ name: 'Rahal Team' }],
  openGraph: {
    title: 'رحال - اكتشف العالم من خلال اللعب',
    description: 'لعبة جغرافية عربية تفاعلية لاكتشاف العالم',
    locale: 'ar_SA',
    type: 'website',
  },
};

export default async function ArabicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="ar" dir="rtl" className={ibmPlexArabic.variable}>
      <body className="font-arabic bg-background text-text-primary min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
