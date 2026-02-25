declare module 'topojson-client' {
  export function feature(
    topology: unknown,
    object: unknown
  ): GeoJSON.Feature | GeoJSON.FeatureCollection;

  export function mesh(
    topology: unknown,
    object?: unknown,
    filter?: (a: unknown, b: unknown) => boolean
  ): GeoJSON.LineString | GeoJSON.MultiLineString;
}
