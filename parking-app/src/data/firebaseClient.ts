import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

// Le variabili EXPO_PUBLIC_* sono lette da Expo a build-time da un file .env
// nella root del progetto (vedi .env.example). Se mancano, l'app usa
// automaticamente il backend locale (mock) e resta comunque utilizzabile.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export function getFirebaseAuth(): Auth {
  if (!auth) throw new Error('Firebase non configurato: imposta le variabili EXPO_PUBLIC_FIREBASE_* in .env');
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) throw new Error('Firebase non configurato: imposta le variabili EXPO_PUBLIC_FIREBASE_* in .env');
  return db;
}
