/**
 * Country lookup utilities for map visualization
 */

import { CountryState, NUMERIC_TO_ALPHA3 } from '@/types/geo';

/**
 * Convert numeric ISO code (used in TopoJSON) to alpha-3 code
 */
export function numericToAlpha3(numericCode: string): string {
  return NUMERIC_TO_ALPHA3[numericCode] || '';
}

/**
 * Determine the visual state of a country on the map
 */
export function getCountryState(
  countryCode: string,
  startCountryCode: string,
  endCountryCode: string,
  guessedCountries: { code: string; isOnPath: boolean }[],
  hintCountryCodes: string[] = [],
  pathCountryCodes: string[] = []
): CountryState {
  if (countryCode === startCountryCode) {
    return 'start';
  }

  if (countryCode === endCountryCode) {
    return 'end';
  }

  const guessedCountry = guessedCountries.find((g) => g.code === countryCode);
  if (guessedCountry) {
    // If guessed and on path, show as path-country (gradual reveal)
    if (guessedCountry.isOnPath && pathCountryCodes.includes(countryCode)) {
      return 'path-country';
    }
    // Otherwise show standard guess coloring
    return guessedCountry.isOnPath ? 'guessed-on-path' : 'guessed-off-path';
  }

  if (hintCountryCodes.includes(countryCode)) {
    return 'hint';
  }

  return 'default';
}

/**
 * Get the center coordinates for a country (approximate)
 * These are rough center points for zooming to specific countries
 */
export const COUNTRY_CENTERS: Record<string, [number, number]> = {
  SAU: [45, 25],
  EGY: [30, 27],
  JOR: [36, 31],
  IRQ: [44, 33],
  SYR: [38, 35],
  LBN: [35.8, 33.9],
  PSE: [35.2, 31.9],
  ARE: [54, 24],
  KWT: [48, 29.5],
  BHR: [50.5, 26],
  QAT: [51.2, 25.3],
  OMN: [57, 21],
  YEM: [48, 15.5],
  DZA: [3, 28],
  MAR: [-6, 32],
  TUN: [9, 34],
  LBY: [17, 27],
  SDN: [30, 15],
  USA: [-95, 38],
  CAN: [-106, 56],
  MEX: [-102, 23],
  BRA: [-55, -10],
  ARG: [-64, -34],
  GBR: [-2, 54],
  FRA: [2, 47],
  DEU: [10, 51],
  ITA: [12, 43],
  ESP: [-4, 40],
  RUS: [100, 60],
  CHN: [105, 35],
  IND: [78, 22],
  JPN: [138, 36],
  AUS: [134, -25],
  ZAF: [25, -29],
  NGA: [8, 10],
  KEN: [38, 1],
  TUR: [35, 39],
  IRN: [53, 32],
  PAK: [69, 30],
  AFG: [66, 34],
};

/**
 * Calculate optimal map center based on start and end countries
 */
export function calculateMapCenter(
  startCode: string,
  endCode: string
): [number, number] {
  const startCenter = COUNTRY_CENTERS[startCode];
  const endCenter = COUNTRY_CENTERS[endCode];

  if (startCenter && endCenter) {
    let [startLon, startLat] = startCenter;
    let [endLon, endLat] = endCenter;

    // Handle antimeridian crossing so midpoint stays near the selected pair.
    if (Math.abs(startLon - endLon) > 180) {
      if (startLon > endLon) {
        endLon += 360;
      } else {
        startLon += 360;
      }
    }

    let midpointLon = (startLon + endLon) / 2;
    if (midpointLon > 180) midpointLon -= 360;
    if (midpointLon < -180) midpointLon += 360;

    return [
      midpointLon,
      (startLat + endLat) / 2,
    ];
  }

  if (startCenter) return startCenter;
  if (endCenter) return endCenter;

  // Default to Middle East / North Africa region
  return [35, 25];
}

/**
 * Calculate map zoom based on geographic spread of start/end countries.
 */
export function calculateMapZoom(startCode: string, endCode: string): number {
  const startCenter = COUNTRY_CENTERS[startCode];
  const endCenter = COUNTRY_CENTERS[endCode];

  if (!startCenter || !endCenter) {
    return 1.5;
  }

  let lonDelta = Math.abs(startCenter[0] - endCenter[0]);
  if (lonDelta > 180) lonDelta = 360 - lonDelta;

  const latDelta = Math.abs(startCenter[1] - endCenter[1]);
  const spread = Math.max(lonDelta * 0.85, latDelta * 1.4);

  if (spread <= 12) return 3.2;
  if (spread <= 22) return 2.8;
  if (spread <= 35) return 2.4;
  if (spread <= 55) return 2.0;
  if (spread <= 80) return 1.7;
  if (spread <= 110) return 1.45;

  return 1.25;
}

export function calculateMapView(
  startCode: string,
  endCode: string,
  pathCountryCodes: string[] = []
): { center: [number, number]; zoom: number } {
  const routeCodes = [startCode, ...pathCountryCodes, endCode].filter(Boolean);
  const routeCenters = routeCodes
    .map((code) => COUNTRY_CENTERS[code])
    .filter((center): center is [number, number] => Boolean(center));

  // Fallback to pair-only logic if route metadata is incomplete.
  if (routeCenters.length < 2) {
    return {
      center: calculateMapCenter(startCode, endCode),
      zoom: calculateMapZoom(startCode, endCode),
    };
  }

  const latitudes = routeCenters.map(([, lat]) => lat);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const latSpan = maxLat - minLat;

  const longitudes = routeCenters.map(([lon]) => lon);
  const directMinLon = Math.min(...longitudes);
  const directMaxLon = Math.max(...longitudes);
  const directLonSpan = directMaxLon - directMinLon;

  // Antimeridian-safe wrap to keep points clustered if they cross +/-180.
  const wrappedLongitudes = longitudes.map((lon) => (lon < 0 ? lon + 360 : lon));
  const wrappedMinLon = Math.min(...wrappedLongitudes);
  const wrappedMaxLon = Math.max(...wrappedLongitudes);
  const wrappedLonSpan = wrappedMaxLon - wrappedMinLon;

  const useWrapped = wrappedLonSpan < directLonSpan;
  const lonSpan = useWrapped ? wrappedLonSpan : directLonSpan;
  const minLon = useWrapped ? wrappedMinLon : directMinLon;
  const maxLon = useWrapped ? wrappedMaxLon : directMaxLon;

  let centerLon = (minLon + maxLon) / 2;
  if (useWrapped && centerLon > 180) {
    centerLon -= 360;
  }

  const centerLat = (minLat + maxLat) / 2;

  // Weighted spread approximates visible footprint in mercator projection.
  const spread = Math.max(lonSpan * 0.85, latSpan * 1.35);
  let zoom = 1.2;
  if (spread <= 8) zoom = 3.8;
  else if (spread <= 14) zoom = 3.4;
  else if (spread <= 22) zoom = 3.0;
  else if (spread <= 32) zoom = 2.6;
  else if (spread <= 45) zoom = 2.25;
  else if (spread <= 62) zoom = 1.95;
  else if (spread <= 85) zoom = 1.65;
  else if (spread <= 110) zoom = 1.4;

  // User requested a slightly tighter default framing.
  const zoomWithBias = Math.min(8, Math.max(1, zoom * 1.25));

  return {
    center: [centerLon, centerLat],
    zoom: zoomWithBias,
  };
}
