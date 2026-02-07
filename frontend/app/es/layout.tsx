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
  title: 'Rahal - Descubre el Mundo a Través del Juego',
  description: 'Un juego interactivo de geografía para descubrir el mundo',
  keywords: ['rahal', 'geografía', 'juego', 'países', 'capitales'],
  authors: [{ name: 'Rahal Team' }],
  openGraph: {
    title: 'Rahal - Descubre el Mundo a Través del Juego',
    description: 'Un juego interactivo de geografía para descubrir el mundo',
    locale: 'es_ES',
    type: 'website',
  },
};

export default async function SpanishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="es" dir="ltr" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans bg-background text-text-primary min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
