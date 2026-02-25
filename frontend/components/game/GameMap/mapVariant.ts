export type MapVariant = 'legacy' | 'leaflet';

export function resolveMapVariant(rawVariant: string | null | undefined): MapVariant {
  return rawVariant === 'leaflet' ? 'leaflet' : 'legacy';
}
