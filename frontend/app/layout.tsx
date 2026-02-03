import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'رحال - Rahal',
  description: 'لعبة جغرافية عربية تفاعلية',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

// Redirect root to Arabic version
export function generateStaticParams() {
  return [{ locale: 'ar' }, { locale: 'en' }];
}
