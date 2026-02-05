'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from '@vnedyalk0v/react19-simple-maps';
import { cn } from '@/lib/utils';
import { numericToAlpha3, getCountryState, calculateMapCenter } from '@/lib/geo';
import { MAP_COLORS } from '@/types/geo';
import type { GameMapProps } from '@/types/geo';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';

// Construct absolute URL for geography data (required by react-simple-maps' URL constructor)
const getGeoUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/geo/world-110m.json`;
  }
  // Fallback for SSR (though this component is client-only)
  return '/geo/world-110m.json';
};

// Prefetch and validate TopoJSON data
const validateGeoData = async (): Promise<boolean> => {
  try {
    const url = getGeoUrl();
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      console.error(`[GameMap] TopoJSON file not accessible: ${response.status} ${response.statusText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[GameMap] Failed to validate TopoJSON file:', error);
    return false;
  }
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.5;

export function GameMap({
  startCountryCode,
  endCountryCode,
  guessedCountryCodes,
  hintCountryCodes = [],
  zoom: externalZoom,
  center: externalCenter,
  onZoomChange,
  onCenterChange,
  className,
}: GameMapProps) {
  // Calculate default center based on start/end countries
  const defaultCenter = useMemo(
    () => calculateMapCenter(startCountryCode, endCountryCode),
    [startCountryCode, endCountryCode]
  );

  // Internal state for zoom and center (if not controlled externally)
  const [internalZoom, setInternalZoom] = useState(1.5);
  const [internalCenter, setInternalCenter] =
    useState<[number, number]>(defaultCenter);
  const [geoDataValid, setGeoDataValid] = useState(true);

  // Validate TopoJSON on mount
  useEffect(() => {
    validateGeoData().then(setGeoDataValid);
  }, []);

  const zoom = externalZoom ?? internalZoom;
  const center = externalCenter ?? internalCenter;

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + ZOOM_STEP, MAX_ZOOM);
    setInternalZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - ZOOM_STEP, MIN_ZOOM);
    setInternalZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [zoom, onZoomChange]);

  const handleReset = useCallback(() => {
    setInternalZoom(1.5);
    setInternalCenter(defaultCenter);
    onZoomChange?.(1.5);
    onCenterChange?.(defaultCenter);
  }, [defaultCenter, onZoomChange, onCenterChange]);

  const handleMoveEnd = useCallback(
    (position: { coordinates: [number, number]; zoom: number }) => {
      setInternalCenter(position.coordinates);
      setInternalZoom(position.zoom);
      onCenterChange?.(position.coordinates);
      onZoomChange?.(position.zoom);
    },
    [onCenterChange, onZoomChange]
  );

  if (!geoDataValid) {
    return (
      <div
        className={cn(
          'relative w-full aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden border border-border flex flex-col items-center justify-center p-6 text-center',
          className
        )}
      >
        <span className="text-4xl mb-4">🗺️</span>
        <p className="text-text-secondary text-sm">
          تعذر تحميل بيانات الخريطة
        </p>
        <button
          onClick={() => {
            setGeoDataValid(true);
            validateGeoData().then(setGeoDataValid);
          }}
          className="mt-4 text-primary text-sm underline"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative w-full aspect-[16/10] bg-blue-50 rounded-lg overflow-hidden border border-border',
        className
      )}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 150,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup
          zoom={zoom}
          // @ts-expect-error - Library types require branded Longitude/Latitude but [number, number] works
          center={center}
          onMoveEnd={handleMoveEnd}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
        >
          <Geographies geography={getGeoUrl()}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numericCode = geo.id;
                const alpha3Code = numericToAlpha3(String(numericCode));
                const countryState = getCountryState(
                  alpha3Code,
                  startCountryCode,
                  endCountryCode,
                  guessedCountryCodes,
                  hintCountryCodes
                );

                const fillColor = MAP_COLORS[countryState];
                const isHighlighted = countryState !== 'default';

                return (
                  <Geography
                    // @ts-expect-error - rsmKey exists at runtime but types are incomplete
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        outline: 'none',
                        transition: 'fill 0.3s ease',
                      },
                      hover: {
                        fill: isHighlighted ? fillColor : '#D1D5DB',
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: {
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
      />

      <MapLegend />
    </div>
  );
}
