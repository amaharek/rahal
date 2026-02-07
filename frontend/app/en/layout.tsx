import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Providers } from '@/components/Providers';
import '@/app/globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Rahal - Discover the World Through Play',
  description: 'An interactive geography game to discover the world',
  keywords: ['rahal', 'geography', 'game', 'countries', 'capitals'],
  authors: [{ name: 'Rahal Team' }],
  openGraph: {
    title: 'Rahal - Discover the World Through Play',
    description: 'An interactive geography game to discover the world',
    locale: 'en_US',
    type: 'website',
  },
};

export default async function EnglishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="en" dir="ltr" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans bg-background text-text-primary min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
