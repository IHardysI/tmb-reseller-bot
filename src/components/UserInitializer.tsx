'use client'

import { useEffect } from 'react'
import { useQuery } from 'convex/react'
import { useTelegramUser } from '@/hooks/useTelegramUser'
import { useUserStore } from '@/stores/userStore'
import { api } from '../../convex/_generated/api'

export function UserInitializer() {
  const { user, isUserAvailable } = useTelegramUser()
  const { 
    telegramUser, 
    userData, 
    isInitialized, 
    setTelegramUser, 
    setUserData, 
    setInitialized, 
    setLoading 
  } = useUserStore()

  const existingUser = useQuery(
    api.users.getUserByTelegramId,
    telegramUser?.id ? { telegramId: telegramUser.id } : 'skip'
  )

  useEffect(() => {
    if (isUserAvailable && user && !telegramUser) {
      setTelegramUser(user)
      setLoading(true)
    }
  }, [isUserAvailable, user, telegramUser, setTelegramUser, setLoading])

  useEffect(() => {
    if (existingUser !== undefined) {
      setLoading(false)
      
      if (existingUser) {
        setUserData(existingUser)
      } else {
        setUserData(null)
      }
      
      if (!isInitialized) {
        setInitialized(true)
      }
    }
  }, [existingUser, setUserData, setLoading, isInitialized, setInitialized])

  return null
} 