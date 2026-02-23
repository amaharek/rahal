import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import {
  Globe,
  MapPin,
  Target,
  Trophy,
  Flame,
  ChevronLeft,
  Compass,
  Brain,
  BarChart3,
  User,
  Home,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <main className="min-h-screen pb-24">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">
              {t('common.appName')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/settings`}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-text-secondary hover:bg-primary-50 hover:text-primary transition-colors"
              aria-label="Settings"
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 opacity-[0.06]">
          <svg
            className="w-full h-full"
            viewBox="0 0 800 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="200" cy="200" r="150" stroke="white" strokeWidth="0.5" />
            <circle cx="200" cy="200" r="100" stroke="white" strokeWidth="0.5" />
            <circle cx="200" cy="200" r="50" stroke="white" strokeWidth="0.5" />
            <circle cx="600" cy="200" r="150" stroke="white" strokeWidth="0.5" />
            <circle cx="600" cy="200" r="100" stroke="white" strokeWidth="0.5" />
            <circle cx="600" cy="200" r="50" stroke="white" strokeWidth="0.5" />
            <line x1="0" y1="200" x2="800" y2="200" stroke="white" strokeWidth="0.5" />
            <line x1="400" y1="0" x2="400" y2="400" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
            <Globe className="w-4 h-4 text-white/80" />
            <span className="text-sm text-white/80 font-medium">
              {t('home.welcomeTitle')}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight text-balance">
            {t('common.tagline')}
          </h1>

          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed text-pretty">
            {t('home.welcomeDescription')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/game`}
              className="group inline-flex items-center gap-3 bg-white text-primary font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <MapPin className="w-5 h-5" />
              <span>{t('home.startGame')}</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </Link>
            <Link
              href={`/${locale}/quiz`}
              className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white font-medium px-8 py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              <Brain className="w-5 h-5" />
              <span>{t('quiz.startQuiz')}</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4">
        {/* Game Cards Section */}
        <section className="py-12">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Daily Challenge Card */}
            <Link href={`/${locale}/game`} className="group block">
              <div className="relative overflow-hidden bg-surface rounded-2xl border border-border p-8 transition-all duration-300 hover:shadow-lg hover:border-primary hover:-translate-y-1">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <MapPin className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-text-primary mb-2">
                      {t('home.dailyChallenge')}
                    </h3>
                    <p className="text-text-secondary leading-relaxed mb-6">
                      {t('game.subtitle')}
                    </p>
                    <div className="inline-flex items-center gap-2 text-primary font-medium text-sm">
                      <span>{t('home.startGame')}</span>
                      <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Quick Quiz Card */}
            <Link href={`/${locale}/quiz`} className="group block">
              <div className="relative overflow-hidden bg-surface rounded-2xl border border-border p-8 transition-all duration-300 hover:shadow-lg hover:border-secondary hover:-translate-y-1">
                <div className="absolute top-0 left-0 w-full h-1 bg-secondary" />
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/20 transition-colors">
                    <Brain className="w-7 h-7 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-text-primary mb-2">
                      {t('home.quickQuiz')}
                    </h3>
                    <p className="text-text-secondary leading-relaxed mb-6">
                      {t('quiz.subtitle')}
                    </p>
                    <div className="inline-flex items-center gap-2 text-secondary font-medium text-sm">
                      <span>{t('quiz.startQuiz')}</span>
                      <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Stats Section */}
        <section className="pb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">
              {t('home.yourStats')}
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface rounded-2xl border border-border p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-text-primary">0</div>
              <div className="text-xs text-text-muted mt-1">
                {t('home.currentStreak')}
              </div>
            </div>
            <div className="bg-surface rounded-2xl border border-border p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-text-primary">0</div>
              <div className="text-xs text-text-muted mt-1">
                {t('home.gamesPlayed')}
              </div>
            </div>
            <div className="bg-surface rounded-2xl border border-border p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-text-primary">0%</div>
              <div className="text-xs text-text-muted mt-1">
                {t('home.accuracy')}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="pb-12">
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary">
                {t('home.howToPlay')}
              </h2>
            </div>
            <div className="divide-y divide-border">
              <div className="flex items-center gap-5 p-6">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-text-primary">{t('home.step1Title')}</p>
                  <p className="text-sm text-text-muted mt-0.5">{t('home.step1Description')}</p>
                </div>
              </div>
              <div className="flex items-center gap-5 p-6">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-text-primary">{t('home.step2Title')}</p>
                  <p className="text-sm text-text-muted mt-0.5">{t('home.step2Description')}</p>
                </div>
              </div>
              <div className="flex items-center gap-5 p-6">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-text-primary">{t('home.step3Title')}</p>
                  <p className="text-sm text-text-muted mt-0.5">{t('home.step3Description')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-lg border-t border-border"
        aria-label="Navigation"
      >
        <div className="max-w-5xl mx-auto flex justify-around items-center h-16 px-4">
          <Link
            href={`/${locale}`}
            className="flex flex-col items-center gap-1 text-primary"
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t('nav.home')}</span>
          </Link>
          <Link
            href={`/${locale}/game`}
            className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors"
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t('nav.game')}</span>
          </Link>
          <Link
            href={`/${locale}/quiz`}
            className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t('nav.quiz')}</span>
          </Link>
          <Link
            href={`/${locale}/stats`}
            className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t('nav.stats')}</span>
          </Link>
          <Link
            href={`/${locale}/profile`}
            className="flex flex-col items-center gap-1 text-text-muted hover:text-primary transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-[11px] font-medium">{t('nav.profile')}</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
