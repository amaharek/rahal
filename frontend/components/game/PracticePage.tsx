'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Map } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { CountryInput } from '@/components/game/CountryInput';
import { EmojiScore } from '@/components/game/EmojiScore';
import {
  MapErrorBoundary,
  MapSkeleton,
  resolveMapVariant,
} from '@/components/game/GameMap';
import { createPracticeSession, submitPracticeGuess, usePracticeHint } from '@/lib/api/game';
import { calculateMapView } from '@/lib/geo';
import type {
  Country,
  GuessEntry,
  HintResponse,
  PracticeSession,
  RouteMode,
} from '@/types/game';

const GameMap = dynamic(
  () =>
    import('@/components/game/GameMap')
      .then((mod) => {
        if (!mod.GameMap) {
          throw new Error('GameMap component not found in module');
        }
        return mod.GameMap;
      })
      .catch((error) => {
        console.error('[PracticePage] Failed to load GameMap:', error);
        throw error;
      }),
  { ssr: false, loading: () => <MapSkeleton /> }
);

export function PracticePage() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const mapVariant = resolveMapVariant(searchParams.get('map'));
  const autoSetupTriggeredRef = useRef(false);
  const [startCountry, setStartCountry] = useState<Country | null>(null);
  const [endCountry, setEndCountry] = useState<Country | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<HintResponse | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(1.5);
  const [mapCenter, setMapCenter] = useState<[number, number]>([35, 25]);
  const [routeMode, setRouteMode] = useState<RouteMode>('shortest');

  const guessedCountryCodes = useMemo(
    () =>
      guesses.map((guess) => ({
        code: guess.country_code,
        isOnPath: guess.emoji === '🟢' || guess.emoji === '🟡',
        name: locale === 'ar' ? guess.name_ar : guess.name_en || guess.name_ar,
      })),
    [guesses, locale]
  );

  const setupMutation = useMutation({
    mutationFn: (payload: { startCountryId: string; endCountryId: string; mode: RouteMode }) =>
      createPracticeSession({
        start_country_id: payload.startCountryId,
        end_country_id: payload.endCountryId,
        mode: payload.mode,
      }),
    onSuccess: (practiceSession) => {
      setSession(practiceSession);
      setGuesses([]);
      setHintsUsed(0);
      setCurrentHint(null);
      setIsCompleted(false);
      setScore(null);
      setErrorMessage(null);

      const mapView = calculateMapView(
        practiceSession.start_country.code,
        practiceSession.end_country.code,
        practiceSession.path_country_codes || []
      );
      setMapZoom(mapView.zoom);
      setMapCenter(mapView.center);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
  });

  const guessMutation = useMutation({
    mutationFn: (country: Country) =>
      submitPracticeGuess({
        session_id: session!.session_id,
        country_id: country.id,
        mode: routeMode,
      }),
    onSuccess: (response) => {
      const newGuess: GuessEntry = {
        country_id: response.country.id,
        country_code: response.country.code,
        name_ar: response.country.name_ar,
        name_en: response.country.name_en,
        flag_emoji: response.country.flag_emoji,
        emoji: response.score_emoji,
        order: guesses.length + 1,
      };
      setGuesses((prev) => [...prev, newGuess]);

      if (response.game_complete && session) {
        setScore(response.score ?? 0);
        setIsCompleted(true);
      }
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
  });

  const hintMutation = useMutation({
    mutationFn: () =>
      usePracticeHint({
        session_id: session!.session_id,
        mode: routeMode,
      }),
    onSuccess: (response) => {
      setCurrentHint(response);
      setHintsUsed((prev) => prev + 1);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
  });

  const getCountryName = (country: { name_ar: string; name_en?: string }) =>
    locale === 'ar' ? country.name_ar : country.name_en || country.name_ar;

  const formatHintDisplay = (hint: HintResponse): string => {
    const { hint_type, hint_data } = hint;
    const separator = locale === 'ar' ? '، ' : ', ';
    const arrow = locale === 'ar' ? ' ← ' : ' -> ';

    if (hint_type === 'progressive_1') {
      const countryName = (hint_data.country_name_en || hint_data.country_name_ar) as
        | string
        | undefined;
      const borderCountries = hint_data.border_countries as string[];
      if (countryName && borderCountries?.length) {
        return t('game.hintDisplay.borderHint', {
          country: countryName,
          countries: borderCountries.join(separator),
        });
      }
    }

    if (hint_type === 'progressive_3' && hint_data.path_countries) {
      const pathCountries = hint_data.path_countries as string[];
      return t('game.hintDisplay.pathHint', {
        countries: pathCountries.join(arrow),
      });
    }

    if (hint_type === 'progressive_2' && hint_data.first_letters) {
      const letters = hint_data.first_letters as string[];
      return t('game.hintDisplay.firstLettersHint', {
        letters: letters.join(separator),
      });
    }

    return JSON.stringify(hint_data);
  };

  const onStartPractice = () => {
    if (!startCountry || !endCountry) return;
    if (startCountry.id === endCountry.id) {
      setErrorMessage(t('practice.errors.sameCountry'));
      return;
    }
    setupMutation.mutate({
      startCountryId: startCountry.id,
      endCountryId: endCountry.id,
      mode: routeMode,
    });
  };

  const onGuessCountry = (country: Country) => {
    if (!session || isCompleted) return;
    const alreadyGuessed = guesses.some((g) => g.country_id === country.id);
    if (alreadyGuessed) {
      setErrorMessage(t('errors.alreadyGuessed'));
      return;
    }
    guessMutation.mutate(country);
  };

  const onUseHint = () => {
    if (!session || isCompleted || hintsUsed >= 3 || hintMutation.isPending) return;
    hintMutation.mutate();
  };

  useEffect(() => {
    if (autoSetupTriggeredRef.current || session || setupMutation.isPending) {
      return;
    }

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const modeParam = searchParams.get('mode');
    const mode: RouteMode = modeParam === 'explorer' ? 'explorer' : 'shortest';

    if (!from || !to || from === to) {
      return;
    }

    autoSetupTriggeredRef.current = true;
    setRouteMode(mode);
    setupMutation.mutate({
      startCountryId: from,
      endCountryId: to,
      mode,
    });
  }, [searchParams, session, setupMutation]);

  return (
    <main className="min-h-screen pb-20">
      <header className="bg-primary text-white py-3 px-4">
        <div className="max-w-7xl mx-auto">
          <Link href={`/${locale}/game`} className="text-white/80 text-sm mb-1 inline-block">
            ← {t('common.back')}
          </Link>
          <h1 className="text-xl font-bold">{t('practice.title')}</h1>
          <p className="text-white/80 text-xs">{t('practice.subtitle')}</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-3 space-y-4">
        {!session ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('practice.setupTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={routeMode === 'shortest' ? 'primary' : 'outline'}
                  className="flex-1"
                  onClick={() => setRouteMode('shortest')}
                >
                  {t('game.routeModes.shortest')}
                </Button>
                <Button
                  variant={routeMode === 'explorer' ? 'primary' : 'outline'}
                  className="flex-1"
                  onClick={() => setRouteMode('explorer')}
                >
                  {t('game.routeModes.explorer')}
                </Button>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">{t('practice.startCountry')}</div>
                <CountryInput
                  onSelect={setStartCountry}
                  placeholder={t('practice.startCountryPlaceholder')}
                />
                {startCountry && (
                  <div className="text-sm mt-2">
                    {startCountry.flag_emoji} {getCountryName(startCountry)}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-medium mb-2">{t('practice.endCountry')}</div>
                <CountryInput
                  onSelect={setEndCountry}
                  placeholder={t('practice.endCountryPlaceholder')}
                />
                {endCountry && (
                  <div className="text-sm mt-2">
                    {endCountry.flag_emoji} {getCountryName(endCountry)}
                  </div>
                )}
              </div>
              <Button
                onClick={onStartPractice}
                isLoading={setupMutation.isPending}
                disabled={!startCountry || !endCountry}
              >
                {t('practice.startButton')}
              </Button>
              {errorMessage && <p className="text-sm text-error">{errorMessage}</p>}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-center flex-1">
                    <div className="text-2xl mb-0.5">{session.start_country.flag_emoji}</div>
                    <div className="font-bold text-sm">{getCountryName(session.start_country)}</div>
                    <div className="text-xs text-text-secondary">{t('game.from')}</div>
                  </div>
                  <div className="text-xl text-primary">→</div>
                  <div className="text-center flex-1">
                    <div className="text-2xl mb-0.5">{session.end_country.flag_emoji}</div>
                    <div className="font-bold text-sm">{getCountryName(session.end_country)}</div>
                    <div className="text-xs text-text-secondary">{t('game.to')}</div>
                  </div>
                </div>
                <div className="text-center mt-2 pt-2 border-t border-border text-xs text-text-secondary">
                  {t('game.shortestPath')}: {session.shortest_path} {t('game.pathCountriesUnit')}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="lg:hidden mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowMap((prev) => !prev)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Map className="w-4 h-4" />
                    {showMap ? t('game.map.hideMap') : t('game.map.showMap')}
                    {showMap ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>

                <div className={`${showMap ? 'block' : 'hidden'} lg:block`}>
                  <MapErrorBoundary>
                    <GameMap
                      variant={mapVariant}
                      startCountryCode={session.start_country.code}
                      endCountryCode={session.end_country.code}
                      startCountryName={getCountryName(session.start_country)}
                      endCountryName={getCountryName(session.end_country)}
                      guessedCountryCodes={guessedCountryCodes}
                      pathCountryCodes={session.path_country_codes || []}
                      zoom={mapZoom}
                      center={mapCenter}
                      onZoomChange={setMapZoom}
                      onCenterChange={setMapCenter}
                    />
                  </MapErrorBoundary>
                </div>
              </div>

              <div className="space-y-4">
                {isCompleted ? (
                  <Card className="bg-success/10 border-success">
                    <CardContent className="text-center">
                      <div className="text-4xl mb-2">🎉</div>
                      <h2 className="text-xl font-bold text-success mb-2">{t('game.completed')}</h2>
                      <p className="text-text-secondary mb-4">{t('practice.completedMessage')}</p>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-2xl font-bold text-primary">{score ?? 0}</div>
                          <div className="text-sm text-text-secondary">{t('game.score')}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">{guesses.length}</div>
                          <div className="text-sm text-text-secondary">{t('game.totalGuesses')}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSession(null);
                          setStartCountry(null);
                          setEndCountry(null);
                          setGuesses([]);
                          setHintsUsed(0);
                          setCurrentHint(null);
                          setIsCompleted(false);
                          setScore(null);
                          setErrorMessage(null);
                        }}
                      >
                        {t('practice.newRun')}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <CountryInput
                    onSelect={onGuessCountry}
                    placeholder={t('game.enterCountry')}
                    disabled={guessMutation.isPending}
                    autoFocus
                  />
                )}

                {!isCompleted && (
                  <Card>
                    <CardHeader>
                    <CardTitle className="text-base">
                      {t('game.hints')} ({3 - hintsUsed} {t('game.hintsRemaining')})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={hintsUsed >= 3 || hintMutation.isPending}
                        className="w-full"
                        onClick={onUseHint}
                      >
                        {t('game.nextHint')}
                      </Button>
                      {currentHint && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="text-yellow-900">{formatHintDisplay(currentHint)}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t('game.guesses')} ({guesses.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {guesses.length === 0 ? (
                      <div className="text-center py-8 text-text-secondary">
                        <p>{t('game.noGuessesYet')}</p>
                        <p className="text-sm mt-2">{t('game.startTyping')}</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {guesses.map((guess, index) => (
                          <div
                            key={`${guess.country_id}-${index}`}
                            className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                          >
                            <span className="text-lg font-bold text-text-secondary w-8">{index + 1}.</span>
                            <span className="text-2xl">{guess.flag_emoji}</span>
                            <span className="flex-1 font-medium">{getCountryName(guess)}</span>
                            <EmojiScore emoji={guess.emoji} size="sm" animate={false} />
                          </div>
                        ))}
                      </div>
                    )}
                    {errorMessage && <p className="text-sm text-error mt-3">{errorMessage}</p>}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
