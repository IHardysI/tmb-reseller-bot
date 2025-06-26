'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import { api } from '../../convex/_generated/api';
import { FullScreenLoader } from '@/components/shared/loader';

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
    if (isUserAvailable && userId) {
      if (existingUser === null) {
        router.push('/auth/login');
      } else if (existingUser && !existingUser.onboardingCompleted) {
        router.push('/auth/login');
      }
    }
  }, [isUserAvailable, userId, existingUser, router]);

  if (!isUserAvailable || !userId) {
    return <FullScreenLoader text="Инициализация..." />;
  }

  if (existingUser === undefined) {
    return <FullScreenLoader text="Проверка авторизации..." />;
  }

  if (existingUser === null) {
    return <FullScreenLoader text="Перенаправление на регистрацию..." />;
  }

  if (!existingUser.onboardingCompleted) {
    return <FullScreenLoader text="Завершите регистрацию..." />;
  }

  return <>{children}</>;
} 