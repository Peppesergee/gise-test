import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { repository } from '../data';
import { isFirebaseConfigured } from '../data/firebaseClient';
import { getFirebaseAuth } from '../data/firebaseClient';
import { generateLocalId } from '../utils/id';

const USER_ID_KEY = 'parkfree:userId';
const NICKNAME_KEY = 'parkfree:nickname';

interface AuthContextValue {
  userId: string | null;
  nickname: string | null;
  loading: boolean;
  setNickname: (nickname: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNicknameState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function resolveUserId(): Promise<string | null> {
      if (isFirebaseConfigured) {
        return new Promise((resolve) => {
          const auth = getFirebaseAuth();
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              unsubscribe();
              resolve(user.uid);
            } else {
              signInAnonymously(auth).catch(() => resolve(null));
            }
          });
        });
      }

      const stored = await AsyncStorage.getItem(USER_ID_KEY);
      if (stored) return stored;
      const generated = generateLocalId();
      await AsyncStorage.setItem(USER_ID_KEY, generated);
      return generated;
    }

    (async () => {
      const id = await resolveUserId();
      if (cancelled || !id) {
        setLoading(false);
        return;
      }
      setUserId(id);

      const storedNickname = await AsyncStorage.getItem(NICKNAME_KEY);
      if (storedNickname) {
        await repository.ensureUserProfile(id, storedNickname);
        if (!cancelled) setNicknameState(storedNickname);
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      userId,
      nickname,
      loading,
      setNickname: async (name: string) => {
        if (!userId) return;
        const trimmed = name.trim();
        await AsyncStorage.setItem(NICKNAME_KEY, trimmed);
        await repository.ensureUserProfile(userId, trimmed);
        setNicknameState(trimmed);
      },
    }),
    [userId, nickname, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider');
  return ctx;
}
