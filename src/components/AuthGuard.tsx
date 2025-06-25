'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import { api } from '../../convex/_generated/api';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { userId, isUserAvailable } = useTelegramUser();
  const router = useRouter();
  
  const existingUser = useQuery(
    api.users.getUserByTelegramId,
    userId ? { telegramId: userId } : 'skip'
  );

  useEffect(() => {
    if (isUserAvailable && userId && existingUser === null) {
      router.push('/auth/login');
    }
  }, [isUserAvailable, userId, existingUser, router]);

  if (!isUserAvailable || !userId) {
    return <div>Загрузка.</div>;
  }

  if (existingUser === undefined) {
    return <div>Загрузка...</div>;
  }

  if (existingUser === null) {
    return <div>Идём на страницу авторизации...</div>;
  }

  return <>{children}</>;
} 