import { ParkingSpot, PointsEvent, ReportResult, UserProfile } from '../types';

export interface ParkingRepository {
  /** Iscrizione realtime a tutti i parcheggi. Ritorna la funzione di unsubscribe. */
  subscribeToSpots(callback: (spots: ParkingSpot[]) => void): () => void;

  /** Iscrizione realtime al profilo dell'utente (punti, ore gratis). */
  subscribeToUserProfile(userId: string, callback: (profile: UserProfile) => void): () => void;

  getPointsHistory(userId: string): Promise<PointsEvent[]>;

  /** L'utente segnala di aver lasciato libero un posto: assegna punti se le condizioni sono rispettate. */
  reportSpotFree(
    spotId: string,
    userId: string,
    userLat: number,
    userLng: number
  ): Promise<ReportResult>;

  /** L'utente segnala che un posto risulta occupato (nessun punto assegnato). */
  reportSpotOccupied(
    spotId: string,
    userId: string,
    userLat: number,
    userLng: number
  ): Promise<ReportResult>;

  ensureUserProfile(userId: string, nickname: string): Promise<UserProfile>;
}
