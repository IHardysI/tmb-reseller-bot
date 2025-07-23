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
    console.log('🔍 AuthGuard check:', { isInitialized, isLoading, hasUser: !!telegramUser, hasUserData: !!userData, pathname })
    
    // Don't redirect if already on login or blocked pages
    if (pathname === '/auth/login' || pathname === '/blocked') {
      console.log('🚪 Already on auth/login or blocked page - skipping redirect logic')
      return
    }
    
    if (isInitialized && !isLoading) {
      // If no Telegram user is available, redirect to login
      if (!isUserAvailable() || !telegramUser) {
        console.log('❌ No Telegram user available, redirecting to login')
        try {
          router.push('/auth/login')
        } catch (error) {
          console.log('Router failed, using window.location')
          window.location.href = '/auth/login'
        }
        return
      }

      if (!userData) {
        console.log('🔄 No userData found, redirecting to login')
        try {
          router.push('/auth/login')
        } catch (error) {
          console.log('Router failed, using window.location')
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
          console.log('🚫 User is blocked, redirecting to blocked page')
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

  console.log('🎭 AuthGuard render state:', { 
    isInitialized, 
    isLoading, 
    hasUserData: !!userData, 
    hasTelegramUser: !!telegramUser,
    pathname 
  })

  // Allow login and blocked pages to render without protection
  if (pathname === '/auth/login' || pathname === '/blocked') {
    console.log('🚪 On auth/login or blocked page - allowing access')
    return (
      <>
        <UserInitializer />
        {children}
      </>
    )
  }

  if (!isInitialized || isLoading) {
    console.log('⏳ AuthGuard showing loader: initialization in progress')
    return (
      <>
        <UserInitializer />
        <FullScreenLoader text="" />
      </>
    )
  }

  // Don't show loading screen here - let the redirect happen in useEffect
  console.log('✅ AuthGuard initialized, checking authentication...')

  if (!userData) {
    console.log('❌ No userData found in render, showing loader while redirect happens')
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

  console.log('🎉 AuthGuard: User authenticated, rendering protected content')
  return (
    <>
      <UserInitializer />
      {children}
    </>
  )
} 