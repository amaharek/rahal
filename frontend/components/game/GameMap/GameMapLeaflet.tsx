'use client';

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  startTransition,
  type MutableRefObject,
} from 'react';
import {
  GeoJSON,
  MapContainer,
  Pane,
  useMapEvents,
} from 'react-leaflet';
import { feature, mesh } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type {
  Layer,
  LeafletMouseEvent,
  Map as LeafletMap,
  Path as LeafletPath,
} from 'leaflet';
import { cn } from '@/lib/utils';
import { numericToAlpha3, getCountryState, calculateMapView } from '@/lib/geo';
import { useMapColors } from '@/lib/hooks/useMapColors';
import type { GameMapProps } from '@/types/geo';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.5;
const TOOLTIP_MAX_WIDTH = 220;
const TOOLTIP_HEIGHT = 36;
const TOOLTIP_MARGIN = 8;
const TOOLTIP_CURSOR_OFFSET_X = 12;
const TOOLTIP_CURSOR_OFFSET_Y = 16;
const BORDER_WEIGHT = 1.2;

type TopologyLike = {
  objects?: Record<string, unknown>;
};

function isGeometryCollection(value: unknown): value is { type: string } {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'type' in value &&
      typeof (value as { type?: unknown }).type === 'string'
  );
}

function resolvePrimaryTopologyObject(topology: TopologyLike): unknown | null {
  const objects = topology.objects;
  if (!objects || typeof objects !== 'object') {
    return null;
  }

  // Prefer explicit countries object to avoid accidentally rendering land-only geometry.
  if (objects.countries && isGeometryCollection(objects.countries)) {
    return objects.countries;
  }

  const geometryCollectionKey = Object.keys(objects).find((key) =>
    isGeometryCollection(objects[key])
  );
  if (!geometryCollectionKey) {
    return null;
  }

  return objects[geometryCollectionKey];
}

interface ViewportSyncProps {
  center: [number, number];
  zoom: number;
  onMoveEnd: (position: { coordinates: [number, number]; zoom: number }) => void;
  mapRef: MutableRefObject<LeafletMap | null>;
}

function ViewportSync({ center, zoom, onMoveEnd, mapRef }: ViewportSyncProps) {
  const map = useMapEvents({
    moveend: () => {
      const mapCenter = map.getCenter();
      onMoveEnd({
        coordinates: [mapCenter.lng, mapCenter.lat],
        zoom: map.getZoom(),
      });
    },
  });

  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  useEffect(() => {
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    const centerChanged =
      Math.abs(currentCenter.lng - center[0]) > 0.001 ||
      Math.abs(currentCenter.lat - center[1]) > 0.001;
    const zoomChanged = Math.abs(currentZoom - zoom) > 0.001;

    if (centerChanged || zoomChanged) {
      map.setView([center[1], center[0]], zoom, { animate: false });
    }
  }, [center, zoom, map]);

  return null;
}

function fetchTopoJSON() {
  return fetch('/geo/world-110m.json').then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch TopoJSON (${response.status})`);
    }
    return response.json();
  });
}

function resolveCountryCode(geoFeature: Feature<Geometry, Record<string, unknown>>): string {
  const properties = geoFeature.properties || {};

  if (typeof properties.ISO_A3 === 'string' && properties.ISO_A3.length === 3) {
    return properties.ISO_A3;
  }

  if (typeof properties.ADM0_A3 === 'string' && properties.ADM0_A3.length === 3) {
    return properties.ADM0_A3;
  }

  const numericId = geoFeature.id;
  if (numericId !== undefined && numericId !== null) {
    return numericToAlpha3(String(numericId));
  }

  if (typeof properties.iso_n3 === 'string') {
    return numericToAlpha3(properties.iso_n3);
  }

  if (typeof properties.iso_num === 'string') {
    return numericToAlpha3(properties.iso_num);
  }

  return '';
}

function normalizeRing(ring: number[][]): number[][] {
  if (ring.length === 0) return ring;
  const out = [ring[0]];
  for (let i = 1; i < ring.length; i++) {
    const prev = out[i - 1][0];
    let lng = ring[i][0];
    while (lng - prev > 180) lng -= 360;
    while (lng - prev < -180) lng += 360;
    out.push([lng, ring[i][1]]);
  }
  return out;
}

function normalizeCoords(geometry: Geometry): Geometry {
  if (geometry.type === 'Polygon') {
    return { ...geometry, coordinates: geometry.coordinates.map(normalizeRing) };
  }
  if (geometry.type === 'MultiPolygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((poly) => poly.map(normalizeRing)),
    };
  }
  if (geometry.type === 'LineString') {
    return { ...geometry, coordinates: normalizeRing(geometry.coordinates) };
  }
  if (geometry.type === 'MultiLineString') {
    return { ...geometry, coordinates: geometry.coordinates.map(normalizeRing) };
  }
  return geometry;
}

function toFeatureCollection(
  topoData: unknown
): FeatureCollection<Geometry, Record<string, unknown>> | null {
  if (!topoData || typeof topoData !== 'object') {
    return null;
  }

  const topology = topoData as TopologyLike;
  const primaryObject = resolvePrimaryTopologyObject(topology);
  if (!primaryObject) {
    return null;
  }

  const worldFeatures = feature(topology as any, primaryObject as any);
  if (worldFeatures.type !== 'FeatureCollection') {
    return null;
  }

  const normalized: FeatureCollection<Geometry, Record<string, unknown>> = {
    ...worldFeatures,
    features: worldFeatures.features.map((f) => ({
      ...f,
      properties: f.properties ?? {},
      geometry: normalizeCoords(f.geometry),
    })),
  };
  return normalized as FeatureCollection<Geometry, Record<string, unknown>>;
}

function toCountryBorderGeometry(topoData: unknown): Geometry | null {
  if (!topoData || typeof topoData !== 'object') {
    return null;
  }

  const topology = topoData as TopologyLike;
  const primaryObject = resolvePrimaryTopologyObject(topology);
  if (!primaryObject) {
    return null;
  }

  const borderMesh = mesh(topology as any, primaryObject as any) as Geometry | null;
  if (!borderMesh || (borderMesh.type !== 'LineString' && borderMesh.type !== 'MultiLineString')) {
    return null;
  }

  return normalizeCoords(borderMesh);
}

function countWrapCrossingSegments(
  collection: FeatureCollection<Geometry, Record<string, unknown>>
): number {
  let wrapCrossingSegments = 0;

  for (const geoFeature of collection.features) {
    const geometry = geoFeature.geometry;
    if (!geometry) {
      continue;
    }

    const polygonSets =
      geometry.type === 'Polygon'
        ? [geometry.coordinates]
        : geometry.type === 'MultiPolygon'
          ? geometry.coordinates
          : [];

    for (const polygon of polygonSets) {
      for (const ring of polygon) {
        for (let index = 1; index < ring.length; index += 1) {
          const [previousLon] = ring[index - 1];
          const [nextLon] = ring[index];
          if (Math.abs(nextLon - previousLon) > 300) {
            wrapCrossingSegments += 1;
          }
        }
      }
    }
  }

  return wrapCrossingSegments;
}

export function GameMapLeaflet({
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
  const mapColors = useMapColors();
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const defaultView = useMemo(
    () => calculateMapView(startCountryCode, endCountryCode, pathCountryCodes),
    [startCountryCode, endCountryCode, pathCountryCodes]
  );

  const guessedNameByCode = useMemo(
    () => new Map(guessedCountryCodes.map((guessedCountry) => [guessedCountry.code, guessedCountry.name])),
    [guessedCountryCodes]
  );

  const geoJsonKey = useMemo(() => {
    const guessed = guessedCountryCodes.map((c) => c.code).sort().join(',');
    const hints = [...hintCountryCodes].sort().join(',');
    const path = [...pathCountryCodes].sort().join(',');
    return `${guessed}|${hints}|${path}`;
  }, [guessedCountryCodes, hintCountryCodes, pathCountryCodes]);

  const [internalZoom, setInternalZoom] = useState(defaultView.zoom);
  const [internalCenter, setInternalCenter] = useState<[number, number]>(defaultView.center);
  const [geoFeatures, setGeoFeatures] =
    useState<FeatureCollection<Geometry, Record<string, unknown>> | null>(null);
  const [borderGeometry, setBorderGeometry] = useState<Geometry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hoverTooltip, setHoverTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const zoom = externalZoom ?? internalZoom;
  const center = externalCenter ?? internalCenter;

  const loadMap = useCallback(() => {
    setIsLoading(true);
    setHasError(false);

    fetchTopoJSON()
      .then((data) => {
        const features = toFeatureCollection(data);
        if (!features) {
          throw new Error('Failed to parse world TopoJSON to FeatureCollection');
        }
        const borders = toCountryBorderGeometry(data);
        if (!borders) {
          throw new Error('Failed to parse world TopoJSON borders');
        }

        if (process.env.NODE_ENV !== 'production') {
          const wrapSegments = countWrapCrossingSegments(features);
          if (wrapSegments > 0) {
            console.warn(
              `[GameMapLeaflet] Loaded geometry contains ${wrapSegments} wrap-crossing segments.`
            );
          }
        }

        setGeoFeatures(features);
        setBorderGeometry(borders);
      })
      .catch((error) => {
        console.error('[GameMapLeaflet] Failed to load world map:', error);
        setGeoFeatures(null);
        setBorderGeometry(null);
        setHasError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadMap();
  }, [loadMap]);

  useEffect(() => {
    if (externalZoom === undefined) {
      setInternalZoom(defaultView.zoom);
    }
    if (externalCenter === undefined) {
      setInternalCenter(defaultView.center);
    }
  }, [defaultView, externalZoom, externalCenter]);

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

      const maxX = Math.max(TOOLTIP_MARGIN, rect.width - TOOLTIP_MAX_WIDTH - TOOLTIP_MARGIN);
      const maxY = Math.max(TOOLTIP_MARGIN, rect.height - TOOLTIP_HEIGHT - TOOLTIP_MARGIN);

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

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + ZOOM_STEP, MAX_ZOOM);
    setInternalZoom(newZoom);
    onZoomChange?.(newZoom);
    mapRef.current?.setZoom(newZoom);
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - ZOOM_STEP, MIN_ZOOM);
    setInternalZoom(newZoom);
    onZoomChange?.(newZoom);
    mapRef.current?.setZoom(newZoom);
  }, [zoom, onZoomChange]);

  const handleReset = useCallback(() => {
    setInternalZoom(defaultView.zoom);
    setInternalCenter(defaultView.center);
    onZoomChange?.(defaultView.zoom);
    onCenterChange?.(defaultView.center);
    mapRef.current?.flyTo([defaultView.center[1], defaultView.center[0]], defaultView.zoom, {
      duration: 0.8,
    });
  }, [defaultView, onZoomChange, onCenterChange]);

  const mapStyle = useCallback(
    (geoFeature?: Feature<Geometry, Record<string, unknown>>) => {
      if (!geoFeature) {
        return {
          fillColor: mapColors.colors.default,
          fillOpacity: 0.95,
          stroke: false,
          className: undefined,
        };
      }

      const countryCode = resolveCountryCode(geoFeature);
      const countryState = getCountryState(
        countryCode,
        startCountryCode,
        endCountryCode,
        guessedCountryCodes,
        hintCountryCodes,
        pathCountryCodes
      );

      return {
        fillColor: mapColors.colors[countryState],
        fillOpacity: 0.95,
        stroke: false,
        className:
          countryState === 'start' || countryState === 'end'
            ? 'rahal-country-highlight'
            : undefined,
      };
    },
    [
      startCountryCode,
      endCountryCode,
      guessedCountryCodes,
      hintCountryCodes,
      pathCountryCodes,
      mapColors,
    ]
  );

  const onEachFeature = useCallback(
    (geoFeature: Feature<Geometry, Record<string, unknown>>, layer: Layer) => {
      const countryCode = resolveCountryCode(geoFeature);
      const tooltipText = getTooltipText(countryCode);
      const countryState = getCountryState(
        countryCode,
        startCountryCode,
        endCountryCode,
        guessedCountryCodes,
        hintCountryCodes,
        pathCountryCodes
      );

      layer.on({
        add: () => {
          const pathEl = (layer as any)._path as HTMLElement | undefined;
          if (pathEl && countryCode) {
            pathEl.setAttribute('data-country-code', countryCode);
          }
        },
        mouseover: (event: LeafletMouseEvent) => {
          const pathLayer = event.target as LeafletPath;
          if (countryState === 'default') {
            pathLayer.setStyle({ fillColor: mapColors.hoverDefault });
          }

          if (!tooltipText) {
            setHoverTooltip(null);
            return;
          }

          updateTooltipPosition(
            event.originalEvent.clientX,
            event.originalEvent.clientY,
            tooltipText
          );
        },
        mousemove: (event: LeafletMouseEvent) => {
          if (!tooltipText) {
            setHoverTooltip(null);
            return;
          }

          updateTooltipPosition(
            event.originalEvent.clientX,
            event.originalEvent.clientY,
            tooltipText
          );
        },
        mouseout: (event: LeafletMouseEvent) => {
          setHoverTooltip(null);

          const pathLayer = event.target as LeafletPath;
          const nextStyle = mapStyle(geoFeature);
          pathLayer.setStyle({ fillColor: nextStyle.fillColor });
        },
      });
    },
    [
      getTooltipText,
      startCountryCode,
      endCountryCode,
      guessedCountryCodes,
      hintCountryCodes,
      pathCountryCodes,
      mapColors.hoverDefault,
      mapStyle,
      updateTooltipPosition,
    ]
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

  if (hasError || !geoFeatures || !borderGeometry) {
    return (
      <div
        className={cn(
          'relative w-full aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden border border-border flex flex-col items-center justify-center p-6 text-center',
          className
        )}
      >
        <span className="text-4xl mb-4">🗺️</span>
        <p className="text-text-secondary text-sm">تعذر تحميل بيانات الخريطة</p>
        <button onClick={loadMap} className="mt-4 text-primary text-sm underline">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className={cn(
        'relative isolate w-full aspect-[16/10] rounded-lg overflow-hidden border border-border',
        className
      )}
      style={{ minHeight: '500px', backgroundColor: mapColors.oceanBg }}
    >
      <MapContainer
        className="rahal-leaflet-map"
        center={[center[1], center[0]]}
        zoom={zoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%', background: mapColors.oceanBg }}
        worldCopyJump={false}
      >
        <ViewportSync center={center} zoom={zoom} onMoveEnd={handleMoveEnd} mapRef={mapRef} />
        <Pane name="countries-fill" style={{ zIndex: 300 }}>
          <GeoJSON
            key={geoJsonKey}
            data={geoFeatures}
            style={mapStyle}
            onEachFeature={(
              featureEntry: Feature<Geometry, Record<string, unknown>>,
              layer: Layer
            ) => {
              onEachFeature(featureEntry, layer);
            }}
          />
        </Pane>
        <Pane name="country-borders" style={{ zIndex: 350, pointerEvents: 'none' }}>
          <GeoJSON
            key="country-borders"
            data={borderGeometry}
            style={() => ({
              color: mapColors.borderColor,
              weight: BORDER_WEIGHT,
              opacity: 0.9,
              fill: false,
              interactive: false,
            })}
          />
        </Pane>
      </MapContainer>

      {hoverTooltip && (
        <div
          data-testid="map-country-tooltip"
          className="pointer-events-none absolute z-[1000] rounded-md bg-black/80 px-2.5 py-1.5 text-xs font-medium text-white shadow-md"
          style={{
            left: `${hoverTooltip.x}px`,
            top: `${hoverTooltip.y}px`,
            maxWidth: `${TOOLTIP_MAX_WIDTH}px`,
          }}
        >
          {hoverTooltip.text}
        </div>
      )}

      <MapControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReset={handleReset} />
      <MapLegend />
    </div>
  );
}
