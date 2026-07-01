import { useEffect, useState } from 'react';
import { repository } from '../data';
import { UserProfile } from '../types';

export function useUserProfile(userId: string | null): UserProfile | null {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const unsubscribe = repository.subscribeToUserProfile(userId, setProfile);
    return unsubscribe;
  }, [userId]);

  return profile;
}
