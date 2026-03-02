'use client';

import dynamic from 'next/dynamic';
import type { GameMapProps } from '@/types/geo';
import { MapSkeleton } from './MapSkeleton';

const GameMapLeafletClient = dynamic(
  () => import('./GameMapLeaflet').then((m) => ({ default: m.GameMapLeaflet })),
  { ssr: false, loading: () => <MapSkeleton /> }
);

export function GameMap(props: GameMapProps) {
  return <GameMapLeafletClient {...props} />;
}
