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

// Fetch TopoJSON data to avoid URL validation issues
const fetchTopoJSON = async () => {
  try {
    console.log('[GameMap] Fetching TopoJSON data...');
    const response = await fetch('/geo/world-110m.json');
    if (!response.ok) {
      console.error(`[GameMap] Failed to fetch TopoJSON: ${response.status}`);
      return null;
    }
    const data = await response.json();
    console.log('[GameMap] TopoJSON loaded successfully');
    return data;
  } catch (error) {
    console.error('[GameMap] Error fetching TopoJSON:', error);
    return null;
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
  const [topoData, setTopoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Fetch TopoJSON on mount
  useEffect(() => {
    console.log('[GameMap] Component mounted, fetching TopoJSON...');
    setIsLoading(true);
    fetchTopoJSON()
      .then((data) => {
        if (data) {
          setTopoData(data);
          setHasError(false);
        } else {
          setHasError(true);
        }
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, []);

  const zoom = externalZoom ?? internalZoom;
  const center = externalCenter ?? internalCenter;

  // Debug logging
  useEffect(() => {
    console.log('[GameMap] Render - zoom:', zoom, 'center:', center);
  }, [zoom, center]);

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

  if (isLoading) {
    return (
      <div
        className={cn(
          'relative w-full aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden border border-border flex flex-col items-center justify-center p-6 text-center',
          className
        )}
      >
        <span className="text-4xl mb-4 animate-pulse">🗺️</span>
        <p className="text-text-secondary text-sm">جاري تحميل الخريطة...</p>
      </div>
    );
  }

  if (hasError || !topoData) {
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
            setIsLoading(true);
            setHasError(false);
            fetchTopoJSON()
              .then((data) => {
                if (data) {
                  setTopoData(data);
                  setHasError(false);
                } else {
                  setHasError(true);
                }
              })
              .catch(() => setHasError(true))
              .finally(() => setIsLoading(false));
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
      style={{ minHeight: '500px' }}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 150,
        }}
        width={800}
        height={500}
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
          <Geographies geography={topoData}>
            {({ geographies }) => {
              console.log('[GameMap] Geographies loaded:', geographies.length);
              return geographies.map((geo) => {
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
              });
            }}
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
