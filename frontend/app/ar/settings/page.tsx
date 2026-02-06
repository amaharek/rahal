'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ChevronRight, Palette, Languages, Home, MapPin, HelpCircle, BarChart3, User } from 'lucide-react';
import { ThemeSelector } from '@/components/ui/ThemeToggle';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tNav = useTranslations('nav');

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link
            href="/ar"
            className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-text-primary">{t('title')}</h1>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-border">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Palette className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-text-primary">{t('theme')}</span>
            </div>
            <div className="p-5">
              <ThemeSelector />
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-border">
              <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Languages className="w-4 h-4 text-secondary" />
              </div>
              <span className="font-bold text-text-primary">{t('language')}</span>
            </div>
            <div className="p-5">
              <div className="flex gap-2">
                <button className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm transition-all">
                  {'العربية'}
                </button>
                <button className="px-5 py-2.5 rounded-xl border border-border text-text-secondary hover:border-primary hover:text-primary font-medium text-sm transition-all">
                  English
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-lg border-t border-border" aria-label="Navigation">
        <div className="max-w-5xl mx-auto flex justify-around items-center h-16 px-4">
          <Link href="/ar" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-medium">{tNav('home')}</span>
          </Link>
          <Link href="/ar/game" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
            <MapPin className="w-5 h-5" />
            <span className="text-[11px] font-medium">{tNav('game')}</span>
          </Link>
          <Link href="/ar/quiz" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
            <HelpCircle className="w-5 h-5" />
            <span className="text-[11px] font-medium">{tNav('quiz')}</span>
          </Link>
          <Link href="/ar/stats" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
            <BarChart3 className="w-5 h-5" />
            <span className="text-[11px] font-medium">{tNav('stats')}</span>
          </Link>
          <Link href="/ar/profile" className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors">
            <User className="w-5 h-5" />
            <span className="text-[11px] font-medium">{tNav('profile')}</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
