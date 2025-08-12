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
    if (pathname === '/auth/login' || pathname === '/blocked') {
      return
    }
    if (isInitialized && !isLoading) {
      if (!isUserAvailable() || !telegramUser) {
        try {
          router.push('/auth/login')
        } catch (error) {
          window.location.href = '/auth/login'
        }
        return
      }
      if (!userData) {
        try {
          router.push('/auth/login')
        } catch (error) {
          window.location.href = '/auth/login'
        }
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

  // Allow login and blocked pages to render without protection
  if (pathname === '/auth/login' || pathname === '/blocked') {
    return (
      <>
        <UserInitializer />
        {children}
      </>
    )
  }

  if (!isInitialized || isLoading) {
    return (
      <>
        <UserInitializer />
        <FullScreenLoader text="" />
      </>
    )
  }

  if (!userData) {
    return (
      <>
        <UserInitializer />
        <FullScreenLoader text="" />
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