import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
} from 'firebase/firestore';
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
import { getFirebaseDb } from './firebaseClient';
import { ParkingRepository } from './ParkingRepository';

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
 * Backend realtime multiutente su Firestore. Il controllo di vicinanza GPS
 * qui è lato client (le coordinate arrivano dal chiamante): per una
 * protezione anti-spoofing più robusta andrebbe replicato in una Cloud
 * Function che riceve solo l'id del posto e usa la posizione nota al server.
 */
export class FirebaseParkingRepository implements ParkingRepository {
  subscribeToSpots(callback: (spots: ParkingSpot[]) => void): () => void {
    const db = getFirebaseDb();
    return onSnapshot(collection(db, 'parkingSpots'), (snap) => {
      const spots = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ParkingSpot);
      callback(spots);
    });
  }

  subscribeToUserProfile(userId: string, callback: (profile: UserProfile) => void): () => void {
    const db = getFirebaseDb();
    return onSnapshot(doc(db, 'users', userId), (snap) => {
      if (snap.exists()) {
        callback(snap.data() as UserProfile);
      }
    });
  }

  async ensureUserProfile(userId: string, nickname: string): Promise<UserProfile> {
    const db = getFirebaseDb();
    const userRef = doc(db, 'users', userId);
    return runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists()) {
        const profile = makeDefaultProfile(userId, nickname);
        tx.set(userRef, profile);
        return profile;
      }
      const profile = snap.data() as UserProfile;
      if (profile.nickname !== nickname) {
        const updated = { ...profile, nickname };
        tx.set(userRef, updated, { merge: true });
        return updated;
      }
      return profile;
    });
  }

  async getPointsHistory(userId: string): Promise<PointsEvent[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'users', userId, 'pointsHistory'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PointsEvent);
  }

  async reportSpotOccupied(
    spotId: string,
    userId: string,
    userLat: number,
    userLng: number
  ): Promise<ReportResult> {
    const db = getFirebaseDb();
    const spotRef = doc(db, 'parkingSpots', spotId);
    let reason: ReportResult['reason'] | undefined;

    await runTransaction(db, async (tx) => {
      const spotSnap = await tx.get(spotRef);
      if (!spotSnap.exists()) {
        reason = 'not_found';
        return;
      }
      const spot = spotSnap.data() as ParkingSpot;
      const distance = distanceMeters(userLat, userLng, spot.lat, spot.lng);
      if (distance > REPORT_PROXIMITY_METERS) {
        reason = 'too_far';
        return;
      }
      tx.update(spotRef, { status: 'occupied', statusUpdatedAt: Date.now(), statusUpdatedBy: userId });
    });

    if (reason) return { success: false, pointsAwarded: 0, reason };
    return { success: true, pointsAwarded: 0 };
  }

  async reportSpotFree(
    spotId: string,
    userId: string,
    userLat: number,
    userLng: number
  ): Promise<ReportResult> {
    const db = getFirebaseDb();
    const spotRef = doc(db, 'parkingSpots', spotId);
    const userRef = doc(db, 'users', userId);

    let reason: ReportResult['reason'] | undefined;
    let pointsAwarded = 0;
    let spotAddress = '';

    await runTransaction(db, async (tx) => {
      const spotSnap = await tx.get(spotRef);
      if (!spotSnap.exists()) {
        reason = 'not_found';
        return;
      }
      const spot = spotSnap.data() as ParkingSpot;
      spotAddress = spot.address;

      const distance = distanceMeters(userLat, userLng, spot.lat, spot.lng);
      if (distance > REPORT_PROXIMITY_METERS) {
        reason = 'too_far';
        return;
      }

      const previousEffectiveStatus = getEffectiveStatus(spot);
      tx.update(spotRef, { status: 'free', statusUpdatedAt: Date.now(), statusUpdatedBy: userId });

      // Punti solo liberando un posto davvero occupato, con cooldown per evitare farming.
      if (previousEffectiveStatus !== 'occupied') return;

      const userSnap = await tx.get(userRef);
      const profile = userSnap.exists() ? (userSnap.data() as UserProfile) : makeDefaultProfile(userId, 'Utente');
      const lastReportMap = (userSnap.data()?.lastFreeReportBySpot ?? {}) as Record<string, number>;
      const lastReport = lastReportMap[spotId];
      const cooldownMs = SAME_SPOT_COOLDOWN_MINUTES * 60000;
      if (lastReport && Date.now() - lastReport < cooldownMs) return;

      pointsAwarded = 1;
      const nextPoints = profile.points + pointsAwarded;
      tx.set(
        userRef,
        {
          ...profile,
          points: nextPoints,
          totalPointsEarned: profile.totalPointsEarned + pointsAwarded,
          freeHoursAvailable: Math.floor(nextPoints / POINTS_PER_FREE_HOUR),
          lastFreeReportBySpot: { ...lastReportMap, [spotId]: Date.now() },
        },
        { merge: true }
      );
    });

    if (reason) return { success: false, pointsAwarded: 0, reason };

    if (pointsAwarded > 0) {
      await addDoc(collection(db, 'users', userId, 'pointsHistory'), {
        userId,
        spotId,
        spotAddress,
        points: pointsAwarded,
        createdAt: Date.now(),
      });
    }

    return { success: true, pointsAwarded };
  }
}
