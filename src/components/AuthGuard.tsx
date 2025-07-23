'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { useTelegramUser } from '@/hooks/useTelegramUser';
import { api } from '../../convex/_generated/api';
import { FullScreenLoader } from '@/components/ui/loader';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [mounted, setMounted] = useState(false);
  const { userId, isUserAvailable } = useTelegramUser();
  const router = useRouter();
  
  const existingUser = useQuery(
    api.users.getUserByTelegramId,
    userId ? { telegramId: userId } : 'skip'
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isUserAvailable && userId) {
      if (existingUser === null) {
        router.push('/auth/login');
      } else if (existingUser && !existingUser.onboardingCompleted) {
        router.push('/auth/login');
      } else if (existingUser && existingUser.isBlocked) {
        router.push('/blocked');
      }
    }
  }, [mounted, isUserAvailable, userId, existingUser, router]);

  if (!mounted) {
    return <FullScreenLoader text="Загрузка..." />;
  }

  if (!isUserAvailable || !userId) {
    return <FullScreenLoader text="Инициализация..." />;
  }

  if (existingUser === undefined) {
    return <FullScreenLoader text="Проверка авторизации..." />;
  }

  if (existingUser === null) {
    return <FullScreenLoader text="" />;
  }

  if (!existingUser.onboardingCompleted) {
    return <FullScreenLoader text="Завершите регистрацию..." />;
  }

  if (existingUser.isBlocked) {
    return <FullScreenLoader text="Аккаунт заблокирован..." />;
  }

  return <>{children}</>;
} 