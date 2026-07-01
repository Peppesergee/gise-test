import { isFirebaseConfigured } from './firebaseClient';
import { FirebaseParkingRepository } from './firebaseRepository';
import { MockParkingRepository } from './mockRepository';
import { ParkingRepository } from './ParkingRepository';

// Se sono presenti le credenziali Firebase (.env) usiamo il backend
// realtime multiutente, altrimenti l'app funziona comunque in locale
// con dati salvati sul dispositivo: utile per demo e sviluppo senza setup.
export const repository: ParkingRepository = isFirebaseConfigured
  ? new FirebaseParkingRepository()
  : new MockParkingRepository();

export { isFirebaseConfigured };
export type { ParkingRepository } from './ParkingRepository';
