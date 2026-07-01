const EARTH_RADIUS_METERS = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Distanza in metri tra due coordinate, formula di Haversine. */
export function distanceMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_METERS * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatRelativeTime(epochMs: number): string {
  const diffMs = Date.now() - epochMs;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'proprio ora';
  if (diffMin === 1) return '1 minuto fa';
  if (diffMin < 60) return `${diffMin} minuti fa`;
  const diffH = Math.round(diffMin / 60);
  if (diffH === 1) return '1 ora fa';
  if (diffH < 24) return `${diffH} ore fa`;
  const diffD = Math.round(diffH / 24);
  return diffD === 1 ? '1 giorno fa' : `${diffD} giorni fa`;
}
