import { ParkingSpot } from '../types';

// Dataset dimostrativo di parcheggi a pagamento su strada nel centro di Bologna
// (posizioni indicative, non ufficiali). In produzione andrebbero sostituiti
// con i dati reali forniti dal Comune (es. open data strisce blu).
const now = Date.now();

export const MOCK_SPOTS: ParkingSpot[] = [
  { id: 'bo-001', lat: 44.4939, lng: 11.3428, address: 'Via Rizzoli 12', pricePerHour: 2, status: 'occupied', statusUpdatedAt: now - 40 * 60000 },
  { id: 'bo-002', lat: 44.4945, lng: 11.3465, address: 'Via Zamboni 8', pricePerHour: 1.5, status: 'occupied', statusUpdatedAt: now - 120 * 60000 },
  { id: 'bo-003', lat: 44.4925, lng: 11.3390, address: 'Piazza Maggiore 3', pricePerHour: 2.5, status: 'free', statusUpdatedAt: now - 3 * 60000 },
  { id: 'bo-004', lat: 44.4903, lng: 11.3436, address: 'Via D\'Azeglio 22', pricePerHour: 1.5, status: 'occupied', statusUpdatedAt: now - 15 * 60000 },
  { id: 'bo-005', lat: 44.4968, lng: 11.3487, address: 'Via San Vitale 40', pricePerHour: 1, status: 'unknown', statusUpdatedAt: now - 400 * 60000 },
  { id: 'bo-006', lat: 44.4881, lng: 11.3401, address: 'Via Farini 5', pricePerHour: 2, status: 'occupied', statusUpdatedAt: now - 55 * 60000 },
  { id: 'bo-007', lat: 44.4957, lng: 11.3512, address: 'Via Irnerio 30', pricePerHour: 1.5, status: 'free', statusUpdatedAt: now - 1 * 60000 },
  { id: 'bo-008', lat: 44.4869, lng: 11.3352, address: 'Via Saragozza 15', pricePerHour: 1, status: 'occupied', statusUpdatedAt: now - 200 * 60000 },
  { id: 'bo-009', lat: 44.5002, lng: 11.3420, address: 'Via dell\'Indipendenza 60', pricePerHour: 2, status: 'occupied', statusUpdatedAt: now - 10 * 60000 },
  { id: 'bo-010', lat: 44.4912, lng: 11.3515, address: 'Via Mazzini 18', pricePerHour: 1.5, status: 'occupied', statusUpdatedAt: now - 80 * 60000 },
  { id: 'bo-011', lat: 44.4834, lng: 11.3468, address: 'Via Murri 44', pricePerHour: 1, status: 'free', statusUpdatedAt: now - 6 * 60000 },
  { id: 'bo-012', lat: 44.4990, lng: 11.3340, address: 'Via Marconi 9', pricePerHour: 2, status: 'occupied', statusUpdatedAt: now - 30 * 60000 },
];
