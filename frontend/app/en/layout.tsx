import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/layout/Header';
import '@/app/globals.css';

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
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="font-sans bg-background text-text-primary min-h-screen">
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
