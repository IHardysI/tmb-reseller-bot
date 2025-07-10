'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'
import { UserInitializer } from './UserInitializer'
import { FullScreenLoader } from '@/components/ui/loader'

interface OptimizedAuthGuardProps {
  children: React.ReactNode
}

export function OptimizedAuthGuard({ children }: OptimizedAuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { 
    telegramUser, 
    userData, 
    isInitialized, 
    isLoading,
    isUserAvailable,
    isOnboardingCompleted,
    isUserBlocked 
  } = useUserStore()

  useEffect(() => {
    if (isInitialized && !isLoading) {
      if (!isUserAvailable() || !telegramUser) {
        return
      }

      if (!userData) {
        router.push('/auth/login')
        return
      }

      if (!isOnboardingCompleted()) {
        router.push('/auth/login')
        return
      }

      if (isUserBlocked()) {
        if (pathname !== '/blocked') {
          router.push('/blocked')
        }
        return
      }
    }
  }, [
    isInitialized, 
    isLoading, 
    telegramUser, 
    userData, 
    router, 
    pathname,
    isUserAvailable, 
    isOnboardingCompleted, 
    isUserBlocked
  ])

  if (!isInitialized || isLoading) {
    return (
      <>
        <UserInitializer />
        <FullScreenLoader text="Инициализация..." />
      </>
    )
  }

  if (!isUserAvailable() || !telegramUser) {
    return (
      <>
        <UserInitializer />
        <FullScreenLoader text="Загрузка данных..." />
      </>
    )
  }

  if (!userData) {
    return (
      <>
        <UserInitializer />
        <FullScreenLoader text="Перенаправление на регистрацию..." />
      </>
    )
  }

  if (!isOnboardingCompleted()) {
    return (
      <>
        <UserInitializer />
        <FullScreenLoader text="Завершите регистрацию..." />
      </>
    )
  }

  if (isUserBlocked()) {
    if (pathname !== '/blocked') {
      router.push('/blocked')
      return (
        <>
          <UserInitializer />
          <FullScreenLoader text="Аккаунт заблокирован..." />
        </>
      )
    }
    return (
      <>
        <UserInitializer />
        {children}
      </>
    )
  }

  return (
    <>
      <UserInitializer />
      {children}
    </>
  )
} 