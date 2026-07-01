export type SpotStatus = 'free' | 'occupied' | 'unknown';

export interface ParkingSpot {
  id: string;
  lat: number;
  lng: number;
  address: string;
  /** Prezzo indicativo per ora, in euro. Assente se gratuito o non a pagamento a tariffa oraria. */
  pricePerHour?: number;
  status: SpotStatus;
  /** Epoch ms dell'ultimo aggiornamento di stato. */
  statusUpdatedAt: number;
  /** Utente che ha effettuato l'ultimo aggiornamento (per audit, non mostrato pubblicamente). */
  statusUpdatedBy?: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  /** Punti Park attualmente disponibili (spendibili per ore gratis). */
  points: number;
  /** Totale storico di punti guadagnati, usato solo per statistiche. */
  totalPointsEarned: number;
  /** Ore di parcheggio gratis sbloccate ma non ancora riscattate presso il Comune. */
  freeHoursAvailable: number;
  freeHoursRedeemed: number;
  createdAt: number;
}

export interface PointsEvent {
  id: string;
  userId: string;
  spotId: string;
  spotAddress: string;
  points: number;
  createdAt: number;
}

export interface ReportResult {
  success: boolean;
  pointsAwarded: number;
  reason?: 'too_far' | 'not_found' | 'unknown_error';
}

export const POINTS_PER_FREE_HOUR = 10;
/** Raggio massimo (metri) entro cui un utente può segnalare lo stato di un parcheggio. */
export const REPORT_PROXIMITY_METERS = 60;
/** Dopo quanti minuti uno stato "libero" non confermato torna automaticamente "sconosciuto". */
export const FREE_STATUS_EXPIRY_MINUTES = 8;
/** Tempo minimo tra due segnalazioni che generano punti sullo stesso posto, per lo stesso utente. */
export const SAME_SPOT_COOLDOWN_MINUTES = 30;
