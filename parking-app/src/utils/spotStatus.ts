import { FREE_STATUS_EXPIRY_MINUTES, ParkingSpot, SpotStatus } from '../types';

/**
 * Uno stato "libero" non confermato da nessuno scade dopo un po' di tempo e
 * torna "sconosciuto": senza sensori fisici non possiamo sapere se qualcuno
 * ci ha parcheggiato senza segnalarlo, quindi evitiamo di mostrare dati stantii.
 * Calcolato al volo (nessun writer in background) per evitare race condition
 * tra più utenti che leggono/scrivono lo stesso posto.
 */
export function getEffectiveStatus(spot: Pick<ParkingSpot, 'status' | 'statusUpdatedAt'>): SpotStatus {
  if (spot.status === 'free') {
    const ageMinutes = (Date.now() - spot.statusUpdatedAt) / 60000;
    if (ageMinutes > FREE_STATUS_EXPIRY_MINUTES) {
      return 'unknown';
    }
  }
  return spot.status;
}

export function statusLabel(status: SpotStatus): string {
  switch (status) {
    case 'free':
      return 'Libero';
    case 'occupied':
      return 'Occupato';
    case 'unknown':
      return 'Da verificare';
  }
}

export function statusColor(status: SpotStatus): string {
  switch (status) {
    case 'free':
      return '#2E9E5B';
    case 'occupied':
      return '#D64545';
    case 'unknown':
      return '#B8860B';
  }
}
