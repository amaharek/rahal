'use client';

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  startTransition,
  type MouseEvent,
} from 'react';
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
const TOOLTIP_MAX_WIDTH = 220;
const TOOLTIP_HEIGHT = 36;
const TOOLTIP_MARGIN = 8;
const TOOLTIP_CURSOR_OFFSET_X = 12;
const TOOLTIP_CURSOR_OFFSET_Y = 16;

export function GameMapLegacy({
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
  const [hoverTooltip, setHoverTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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

  const getTooltipText = useCallback(
    (countryCode: string): string => {
      if (countryCode === startCountryCode && startCountryName) {
        return startCountryName;
      }
      if (countryCode === endCountryCode && endCountryName) {
        return endCountryName;
      }
      return guessedNameByCode.get(countryCode) || '';
    },
    [
      startCountryCode,
      startCountryName,
      endCountryCode,
      endCountryName,
      guessedNameByCode,
    ]
  );

  const updateTooltipPosition = useCallback(
    (clientX: number, clientY: number, text: string) => {
      const rect = mapContainerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const maxX = Math.max(
        TOOLTIP_MARGIN,
        rect.width - TOOLTIP_MAX_WIDTH - TOOLTIP_MARGIN
      );
      const maxY = Math.max(
        TOOLTIP_MARGIN,
        rect.height - TOOLTIP_HEIGHT - TOOLTIP_MARGIN
      );

      const x = Math.min(
        Math.max(TOOLTIP_MARGIN, clientX - rect.left + TOOLTIP_CURSOR_OFFSET_X),
        maxX
      );
      const y = Math.min(
        Math.max(TOOLTIP_MARGIN, clientY - rect.top - TOOLTIP_CURSOR_OFFSET_Y),
        maxY
      );

      setHoverTooltip({ text, x, y });
    },
    []
  );

  const handleGeographyMouseEnter = useCallback(
    (event: MouseEvent<SVGPathElement>, countryCode: string) => {
      const tooltipText = getTooltipText(countryCode);
      if (!tooltipText) {
        setHoverTooltip(null);
        return;
      }
      updateTooltipPosition(event.clientX, event.clientY, tooltipText);
    },
    [getTooltipText, updateTooltipPosition]
  );

  const handleGeographyMouseMove = useCallback(
    (event: MouseEvent<SVGPathElement>, countryCode: string) => {
      const tooltipText = getTooltipText(countryCode);
      if (!tooltipText) {
        setHoverTooltip(null);
        return;
      }
      updateTooltipPosition(event.clientX, event.clientY, tooltipText);
    },
    [getTooltipText, updateTooltipPosition]
  );

  const handleGeographyMouseLeave = useCallback(() => {
    setHoverTooltip(null);
  }, []);

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
      ref={mapContainerRef}
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

                const tooltipText = getTooltipText(alpha3Code);

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
                    onMouseEnter={(event) =>
                      handleGeographyMouseEnter(event, alpha3Code)
                    }
                    onMouseMove={(event) =>
                      handleGeographyMouseMove(event, alpha3Code)
                    }
                    onMouseLeave={handleGeographyMouseLeave}
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

      {hoverTooltip && (
        <div
          data-testid="map-country-tooltip"
          className="pointer-events-none absolute z-20 rounded-md bg-black/80 px-2.5 py-1.5 text-xs font-medium text-white shadow-md"
          style={{
            left: `${hoverTooltip.x}px`,
            top: `${hoverTooltip.y}px`,
            maxWidth: `${TOOLTIP_MAX_WIDTH}px`,
          }}
        >
          {hoverTooltip.text}
        </div>
      )}

      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
      />

      <MapLegend />
    </div>
  );
}
