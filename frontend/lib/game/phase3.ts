import type {
  EfficiencyBucket,
  GamePresentationVariant,
  NarrativeMilestone,
  QualityTier,
} from '@/types/game';

export interface NarrativeMilestoneInput {
  guessesCount: number;
  shortestPath: number;
  isCompleted: boolean;
}

export interface ShareRecapInput {
  locale: string;
  startCountry: string;
  endCountry: string;
  guessesCount: number;
  shortestPath: number;
  score: number | null;
  qualityTier: QualityTier | null;
  efficiency: EfficiencyBucket;
}

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function resolvePresentationVariant(
  challengeId: string,
  challengeDate: string,
  override: string | null
): GamePresentationVariant {
  if (override === 'baseline' || override === 'hybrid') {
    return override;
  }

  const cohortBucket = hashString(`${challengeId}:${challengeDate}`) % 2;
  return cohortBucket === 0 ? 'baseline' : 'hybrid';
}

export function getNarrativeMilestone(input: NarrativeMilestoneInput): NarrativeMilestone {
  if (input.isCompleted) {
    return 'finish';
  }

  if (input.guessesCount === 0) {
    return 'start';
  }

  const midpointTarget = Math.max(1, Math.ceil(input.shortestPath / 2));
  if (input.guessesCount >= midpointTarget) {
    return 'midpoint';
  }

  return 'start';
}

function getQualityTierLabel(qualityTier: QualityTier | null, locale: string): string {
  const labelsByLocale: Record<string, Record<QualityTier | 'fallback', string>> = {
    ar: {
      perfect: 'مثالي',
      near_optimal: 'قريب من المثالي',
      good_discovery: 'اكتشاف جيد',
      scenic: 'استكشافي',
      fallback: 'قيد التقييم',
    },
    es: {
      perfect: 'Perfecto',
      near_optimal: 'Casi optimo',
      good_discovery: 'Buen descubrimiento',
      scenic: 'Panoramico',
      fallback: 'En evaluacion',
    },
    en: {
      perfect: 'Perfect',
      near_optimal: 'Near Optimal',
      good_discovery: 'Good Discovery',
      scenic: 'Scenic',
      fallback: 'In Review',
    },
  };

  const localeMap = labelsByLocale[locale] ?? labelsByLocale.en;
  if (!qualityTier) {
    return localeMap.fallback;
  }
  return localeMap[qualityTier];
}

export function buildShareRecapText(input: ShareRecapInput): string {
  const delta = Math.max(0, input.guessesCount - input.shortestPath);
  const qualityLabel = getQualityTierLabel(input.qualityTier, input.locale);
  const scoreLabel = input.score ?? 0;

  if (input.locale === 'ar') {
    return [
      'رحلتي اليوم على Rahal',
      `${input.startCountry} → ${input.endCountry}`,
      `النتيجة: ${scoreLabel} | التقييم: ${qualityLabel}`,
      `التخمينات: ${input.guessesCount} (فارق +${delta} عن الأمثل)`,
      `الكفاءة: ${input.efficiency}`,
      '#Rahal',
    ].join('\n');
  }

  if (input.locale === 'es') {
    return [
      'Mi ruta de hoy en Rahal',
      `${input.startCountry} -> ${input.endCountry}`,
      `Puntuacion: ${scoreLabel} | Nivel: ${qualityLabel}`,
      `Intentos: ${input.guessesCount} (+${delta} vs optimo)`,
      `Eficiencia: ${input.efficiency}`,
      '#Rahal',
    ].join('\n');
  }

  return [
    'My Rahal route today',
    `${input.startCountry} -> ${input.endCountry}`,
    `Score: ${scoreLabel} | Grade: ${qualityLabel}`,
    `Guesses: ${input.guessesCount} (+${delta} vs optimal)`,
    `Efficiency: ${input.efficiency}`,
    '#Rahal',
  ].join('\n');
}
