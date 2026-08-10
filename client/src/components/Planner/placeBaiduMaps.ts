import type { AssignmentPlace, Place, Waypoint } from '../../types';

type PlaceLike = Pick<Place | AssignmentPlace, 'name' | 'lat' | 'lng'> & {
  address?: string | null;
};

type NamedWaypoint = Waypoint & { name?: string | null };
type BaiduTravelMode = 'driving' | 'walking' | 'transit';

const BAIDU_MAPS_SRC = 'webapp.jiqiao.trek';

function hasCoordinates<T extends { lat?: number | null; lng?: number | null }>(
  point: T
): point is T & { lat: number; lng: number } {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng);
}

function encode(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

/**
 * Opens an exact TREK place in the Baidu Maps web/app product. TREK stores
 * Google/OSM coordinates as WGS84, so coord_type must be explicit or markers
 * inside mainland China will be shifted.
 */
export function getBaiduMapsUrlForPlace(place: PlaceLike | null | undefined): string | null {
  if (!place) return null;

  const name = place.name?.trim();
  if (hasCoordinates(place)) {
    return `https://api.map.baidu.com/marker?${encode({
      location: `${place.lat},${place.lng}`,
      title: name || 'TREK',
      content: place.address?.trim() || name || 'TREK',
      output: 'html',
      coord_type: 'wgs84',
      src: BAIDU_MAPS_SRC,
    })}`;
  }

  if (!name) return null;
  return `https://api.map.baidu.com/place/search?${encode({
    query: name,
    region: '全国',
    output: 'html',
    src: BAIDU_MAPS_SRC,
  })}`;
}

/**
 * Baidu's documented web direction URI supports one origin and destination.
 * Keep TREK's full multi-stop order in the planner and hand the first/last
 * routable stops to Baidu for live directions.
 */
export function generateBaiduMapsDirectionUrl(
  places: NamedWaypoint[],
  mode: BaiduTravelMode = 'driving'
): string | null {
  const valid = places.filter(hasCoordinates);
  if (valid.length === 0) return null;

  if (valid.length === 1) {
    return getBaiduMapsUrlForPlace({
      name: valid[0].name?.trim() || 'TREK',
      lat: valid[0].lat,
      lng: valid[0].lng,
    } as PlaceLike);
  }

  const first = valid[0];
  const last = valid[valid.length - 1];
  const endpoint = (point: NamedWaypoint, fallback: string) =>
    `latlng:${point.lat},${point.lng}|name:${point.name?.trim() || fallback}`;

  return `https://api.map.baidu.com/direction?${encode({
    origin: endpoint(first, '起点'),
    destination: endpoint(last, '终点'),
    mode,
    output: 'html',
    coord_type: 'wgs84',
    src: BAIDU_MAPS_SRC,
  })}`;
}
