'use client';

import dynamic from 'next/dynamic';
import type { GameMapProps } from '@/types/geo';
import type { MapVariant } from './mapVariant';
import { MapSkeleton } from './MapSkeleton';

const GameMapLegacyClient = dynamic(
  () => import('./GameMapLegacy').then((m) => ({ default: m.GameMapLegacy })),
  { ssr: false, loading: () => <MapSkeleton /> }
);

const GameMapLeafletClient = dynamic(
  () => import('./GameMapLeaflet').then((m) => ({ default: m.GameMapLeaflet })),
  { ssr: false, loading: () => <MapSkeleton /> }
);

type GameMapComponentProps = GameMapProps & {
  variant?: MapVariant;
};

export function GameMap({ variant = 'legacy', ...props }: GameMapComponentProps) {
  if (variant === 'leaflet') {
    return <GameMapLeafletClient {...props} />;
  }
  return <GameMapLegacyClient {...props} />;
}
