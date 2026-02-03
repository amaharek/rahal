import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

export default function HomePage() {
  const t = useTranslations();

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-primary text-white py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-2">🌍 {t('common.appName')}</h1>
          <p className="text-lg opacity-90">{t('common.tagline')}</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <section className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-4">{t('home.welcomeTitle')}</h2>
          <p className="text-text-secondary">{t('home.welcomeDescription')}</p>
        </section>

        {/* Game Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Daily Challenge */}
          <Link href="/ar/game">
            <Card hover className="h-full">
              <CardHeader>
                <div className="text-4xl mb-2">🗺️</div>
                <CardTitle>{t('home.dailyChallenge')}</CardTitle>
                <CardDescription>{t('game.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="inline-flex items-center justify-center w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-light transition-colors">
                  {t('home.startGame')}
                </span>
              </CardContent>
            </Card>
          </Link>

          {/* Quick Quiz */}
          <Link href="/ar/quiz">
            <Card hover className="h-full">
              <CardHeader>
                <div className="text-4xl mb-2">❓</div>
                <CardTitle>{t('home.quickQuiz')}</CardTitle>
                <CardDescription>{t('quiz.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="inline-flex items-center justify-center w-full py-3 bg-secondary text-white rounded-lg font-medium hover:bg-secondary-light transition-colors">
                  {t('quiz.startQuiz')}
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Stats */}
        <section>
          <h3 className="text-xl font-bold mb-4">{t('home.yourStats')}</h3>
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <div className="text-3xl font-bold text-primary">🔥 0</div>
              <div className="text-sm text-text-secondary mt-1">
                {t('home.currentStreak')}
              </div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-primary">0</div>
              <div className="text-sm text-text-secondary mt-1">
                {t('home.gamesPlayed')}
              </div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-primary">0%</div>
              <div className="text-sm text-text-secondary mt-1">
                {t('home.accuracy')}
              </div>
            </Card>
          </div>
        </section>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border py-2 px-4">
        <div className="max-w-4xl mx-auto flex justify-around items-center">
          <Link
            href="/ar"
            className="flex flex-col items-center text-primary"
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs mt-1">{t('nav.home')}</span>
          </Link>
          <Link
            href="/ar/game"
            className="flex flex-col items-center text-text-secondary hover:text-primary"
          >
            <span className="text-xl">🎯</span>
            <span className="text-xs mt-1">{t('nav.game')}</span>
          </Link>
          <Link
            href="/ar/quiz"
            className="flex flex-col items-center text-text-secondary hover:text-primary"
          >
            <span className="text-xl">❓</span>
            <span className="text-xs mt-1">{t('nav.quiz')}</span>
          </Link>
          <Link
            href="/ar/stats"
            className="flex flex-col items-center text-text-secondary hover:text-primary"
          >
            <span className="text-xl">📊</span>
            <span className="text-xs mt-1">{t('nav.stats')}</span>
          </Link>
          <Link
            href="/ar/profile"
            className="flex flex-col items-center text-text-secondary hover:text-primary"
          >
            <span className="text-xl">👤</span>
            <span className="text-xs mt-1">{t('nav.profile')}</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
