import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/layout/Header';
import '@/app/globals.css';

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
    <html lang="es" dir="ltr" suppressHydrationWarning>
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
