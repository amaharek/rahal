'use client';

import { useState, useCallback, useMemo, useEffect, startTransition } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from '@vnedyalk0v/react19-simple-maps';
import { cn } from '@/lib/utils';
import { numericToAlpha3, getCountryState, calculateMapView } from '@/lib/geo';
import { useMapColors } from '@/lib/hooks/useMapColors';
import type { GameMapProps } from '@/types/geo';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';

// Fetch TopoJSON data to avoid URL validation issues
const fetchTopoJSON = async () => {
  try {
    const response = await fetch('/geo/world-110m.json');
    if (!response.ok) {
      console.error(`[GameMap] Failed to fetch TopoJSON: ${response.status}`);
      return null;
    }
    const data = await response.json();
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
  startCountryName,
  endCountryName,
  guessedCountryCodes,
  hintCountryCodes = [],
  pathCountryCodes = [],
  zoom: externalZoom,
  center: externalCenter,
  onZoomChange,
  onCenterChange,
  className,
}: GameMapProps) {
  // Get theme-aware map colors
  const mapColors = useMapColors();

  // Calculate default view based on start/end plus known shortest-path countries.
  const defaultView = useMemo(
    () => calculateMapView(startCountryCode, endCountryCode, pathCountryCodes),
    [startCountryCode, endCountryCode, pathCountryCodes]
  );
  const guessedNameByCode = useMemo(
    () =>
      new Map(
        guessedCountryCodes.map((guessedCountry) => [guessedCountry.code, guessedCountry.name])
      ),
    [guessedCountryCodes]
  );

  // Internal state for zoom and center (if not controlled externally)
  const [internalZoom, setInternalZoom] = useState(defaultView.zoom);
  const [internalCenter, setInternalCenter] =
    useState<[number, number]>(defaultView.center);
  const [topoData, setTopoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Fetch TopoJSON on mount
  useEffect(() => {
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

  useEffect(() => {
    if (externalZoom === undefined) {
      setInternalZoom(defaultView.zoom);
    }
    if (externalCenter === undefined) {
      setInternalCenter(defaultView.center);
    }
  }, [defaultView, externalZoom, externalCenter]);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + ZOOM_STEP, MAX_ZOOM);
    startTransition(() => {
      setInternalZoom(newZoom);
      onZoomChange?.(newZoom);
    });
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - ZOOM_STEP, MIN_ZOOM);
    startTransition(() => {
      setInternalZoom(newZoom);
      onZoomChange?.(newZoom);
    });
  }, [zoom, onZoomChange]);

  const handleReset = useCallback(() => {
    startTransition(() => {
      setInternalZoom(defaultView.zoom);
      setInternalCenter(defaultView.center);
      onZoomChange?.(defaultView.zoom);
      onCenterChange?.(defaultView.center);
    });
  }, [defaultView, onZoomChange, onCenterChange]);

  const handleMoveEnd = useCallback(
    (position: { coordinates: [number, number]; zoom: number }) => {
      startTransition(() => {
        setInternalCenter(position.coordinates);
        setInternalZoom(position.zoom);
        onCenterChange?.(position.coordinates);
        onZoomChange?.(position.zoom);
      });
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
        'relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-border',
        className
      )}
      style={{ minHeight: '500px', backgroundColor: mapColors.oceanBg }}
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
              return geographies.map((geo, index) => {
                const numericCode = geo.id;
                const alpha3Code = numericToAlpha3(String(numericCode));
                const countryState = getCountryState(
                  alpha3Code,
                  startCountryCode,
                  endCountryCode,
                  guessedCountryCodes,
                  hintCountryCodes,
                  pathCountryCodes
                );

                const fillColor = mapColors.colors[countryState];
                const isHighlighted = countryState !== 'default';

                // Keep start/end labels as priority, then fall back to guessed labels.
                let tooltipText = '';
                if (alpha3Code === startCountryCode && startCountryName) {
                  tooltipText = startCountryName;
                } else if (alpha3Code === endCountryCode && endCountryName) {
                  tooltipText = endCountryName;
                } else {
                  tooltipText = guessedNameByCode.get(alpha3Code) || '';
                }

                // Use geo.id or fallback to index for unique key
                const geoKey =
                  (geo as { rsmKey?: string }).rsmKey || geo.id || `geo-${index}`;

                return (
                  <Geography
                    key={geoKey}
                    geography={geo}
                    fill={fillColor}
                    stroke={mapColors.borderColor}
                    strokeWidth={0.5}
                    style={{
                      default: {
                        outline: 'none',
                        transition: 'fill 0.3s ease',
                      },
                      hover: {
                        fill: isHighlighted ? fillColor : mapColors.hoverDefault,
                        outline: 'none',
                        cursor: tooltipText ? 'pointer' : 'default',
                      },
                      pressed: {
                        outline: 'none',
                      },
                    }}
                  >
                    {tooltipText && <title>{tooltipText}</title>}
                  </Geography>
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
