import AsyncStorage from '@react-native-async-storage/async-storage';
import { distanceMeters } from '../utils/geo';
import { getEffectiveStatus } from '../utils/spotStatus';
import {
  ParkingSpot,
  PointsEvent,
  POINTS_PER_FREE_HOUR,
  ReportResult,
  REPORT_PROXIMITY_METERS,
  SAME_SPOT_COOLDOWN_MINUTES,
  UserProfile,
} from '../types';
import { MOCK_SPOTS } from './mockSpots';
import { ParkingRepository } from './ParkingRepository';

const SPOTS_KEY = 'parkfree:spots';
const PROFILE_KEY_PREFIX = 'parkfree:profile:';
const HISTORY_KEY_PREFIX = 'parkfree:history:';

function makeDefaultProfile(userId: string, nickname: string): UserProfile {
  return {
    id: userId,
    nickname,
    points: 0,
    totalPointsEarned: 0,
    freeHoursAvailable: 0,
    freeHoursRedeemed: 0,
    createdAt: Date.now(),
  };
}

/**
 * Backend locale basato su AsyncStorage: utile per sviluppare e dimostrare
 * l'app senza dover configurare un progetto Firebase. Simula un canale
 * realtime tramite semplici listener in-memory sullo stesso dispositivo.
 */
export class MockParkingRepository implements ParkingRepository {
  private spots: ParkingSpot[] | null = null;
  private spotListeners = new Set<(spots: ParkingSpot[]) => void>();
  private profileListeners = new Map<string, Set<(profile: UserProfile) => void>>();

  private async loadSpots(): Promise<ParkingSpot[]> {
    if (this.spots) return this.spots;
    const raw = await AsyncStorage.getItem(SPOTS_KEY);
    this.spots = raw ? (JSON.parse(raw) as ParkingSpot[]) : MOCK_SPOTS;
    if (!raw) {
      await AsyncStorage.setItem(SPOTS_KEY, JSON.stringify(this.spots));
    }
    return this.spots;
  }

  private async saveSpots(spots: ParkingSpot[]) {
    this.spots = spots;
    await AsyncStorage.setItem(SPOTS_KEY, JSON.stringify(spots));
    this.spotListeners.forEach((cb) => cb(spots));
  }

  subscribeToSpots(callback: (spots: ParkingSpot[]) => void): () => void {
    this.spotListeners.add(callback);
    this.loadSpots().then((spots) => callback(spots));
    return () => this.spotListeners.delete(callback);
  }

  private async loadProfile(userId: string, nickname = 'Utente'): Promise<UserProfile> {
    const raw = await AsyncStorage.getItem(PROFILE_KEY_PREFIX + userId);
    if (raw) return JSON.parse(raw) as UserProfile;
    const profile = makeDefaultProfile(userId, nickname);
    await AsyncStorage.setItem(PROFILE_KEY_PREFIX + userId, JSON.stringify(profile));
    return profile;
  }

  private async saveProfile(profile: UserProfile) {
    await AsyncStorage.setItem(PROFILE_KEY_PREFIX + profile.id, JSON.stringify(profile));
    this.profileListeners.get(profile.id)?.forEach((cb) => cb(profile));
  }

  async ensureUserProfile(userId: string, nickname: string): Promise<UserProfile> {
    const profile = await this.loadProfile(userId, nickname);
    if (profile.nickname !== nickname) {
      const updated = { ...profile, nickname };
      await this.saveProfile(updated);
      return updated;
    }
    return profile;
  }

  subscribeToUserProfile(userId: string, callback: (profile: UserProfile) => void): () => void {
    if (!this.profileListeners.has(userId)) {
      this.profileListeners.set(userId, new Set());
    }
    this.profileListeners.get(userId)!.add(callback);
    this.loadProfile(userId).then((profile) => callback(profile));
    return () => this.profileListeners.get(userId)?.delete(callback);
  }

  async getPointsHistory(userId: string): Promise<PointsEvent[]> {
    const raw = await AsyncStorage.getItem(HISTORY_KEY_PREFIX + userId);
    const history: PointsEvent[] = raw ? JSON.parse(raw) : [];
    return history.sort((a, b) => b.createdAt - a.createdAt);
  }

  private async appendHistory(event: PointsEvent) {
    const history = await this.getPointsHistory(event.userId);
    history.unshift(event);
    await AsyncStorage.setItem(HISTORY_KEY_PREFIX + event.userId, JSON.stringify(history));
  }

  private async updateSpotStatus(
    spotId: string,
    userId: string,
    userLat: number,
    userLng: number,
    newStatus: 'free' | 'occupied'
  ): Promise<{ spot: ParkingSpot; previousEffectiveStatus: ParkingSpot['status'] } | { error: ReportResult['reason'] }> {
    const spots = await this.loadSpots();
    const index = spots.findIndex((s) => s.id === spotId);
    if (index === -1) return { error: 'not_found' };

    const spot = spots[index];
    const distance = distanceMeters(userLat, userLng, spot.lat, spot.lng);
    if (distance > REPORT_PROXIMITY_METERS) return { error: 'too_far' };

    const previousEffectiveStatus = getEffectiveStatus(spot);
    const updatedSpot: ParkingSpot = {
      ...spot,
      status: newStatus,
      statusUpdatedAt: Date.now(),
      statusUpdatedBy: userId,
    };
    const nextSpots = [...spots];
    nextSpots[index] = updatedSpot;
    await this.saveSpots(nextSpots);
    return { spot: updatedSpot, previousEffectiveStatus };
  }

  async reportSpotOccupied(
    spotId: string,
    userId: string,
    userLat: number,
    userLng: number
  ): Promise<ReportResult> {
    const result = await this.updateSpotStatus(spotId, userId, userLat, userLng, 'occupied');
    if ('error' in result) return { success: false, pointsAwarded: 0, reason: result.error };
    return { success: true, pointsAwarded: 0 };
  }

  async reportSpotFree(
    spotId: string,
    userId: string,
    userLat: number,
    userLng: number
  ): Promise<ReportResult> {
    const result = await this.updateSpotStatus(spotId, userId, userLat, userLng, 'free');
    if ('error' in result) return { success: false, pointsAwarded: 0, reason: result.error };

    const { spot, previousEffectiveStatus } = result;

    // Punti solo se si libera un posto che risultava davvero occupato,
    // e non se lo stesso utente lo "ricicla" ripetutamente per accumulare punti.
    if (previousEffectiveStatus !== 'occupied') {
      return { success: true, pointsAwarded: 0 };
    }

    const history = await this.getPointsHistory(userId);
    const cooldownMs = SAME_SPOT_COOLDOWN_MINUTES * 60000;
    const recentSameSpot = history.find(
      (e) => e.spotId === spotId && Date.now() - e.createdAt < cooldownMs
    );
    if (recentSameSpot) {
      return { success: true, pointsAwarded: 0 };
    }

    const profile = await this.loadProfile(userId);
    const pointsAwarded = 1;
    const nextTotal = profile.totalPointsEarned + pointsAwarded;
    const nextPoints = profile.points + pointsAwarded;
    const updatedProfile: UserProfile = {
      ...profile,
      points: nextPoints,
      totalPointsEarned: nextTotal,
      freeHoursAvailable: Math.floor(nextPoints / POINTS_PER_FREE_HOUR),
    };
    await this.saveProfile(updatedProfile);
    await this.appendHistory({
      id: `${spotId}-${Date.now()}`,
      userId,
      spotId,
      spotAddress: spot.address,
      points: pointsAwarded,
      createdAt: Date.now(),
    });

    return { success: true, pointsAwarded };
  }
}
