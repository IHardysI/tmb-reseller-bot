'use client'

import { useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
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
    setLoading,
    clearUserDataOnly
  } = useUserStore()

  const existingUser = useQuery(
    api.users.getUserByTelegramId,
    telegramUser?.id ? { telegramId: telegramUser.id } : 'skip'
  )

  const updateUserChatId = useMutation(api.users.updateUserChatIdFromFrontend)

  useEffect(() => {
    if (isUserAvailable && user && !telegramUser) {
      setTelegramUser(user)
      setLoading(true)
    }
  }, [isUserAvailable, user, telegramUser, setTelegramUser, setLoading])

  useEffect(() => {
    console.log('🔄 UserInitializer effect triggered:', {
      existingUser: existingUser ? 'exists' : 'null',
      user: user ? `id: ${user.id}` : 'null',
      telegramUser: telegramUser ? `id: ${telegramUser.id}` : 'null',
      isUserAvailable,
      isInitialized
    })
    
    if (existingUser !== undefined) {
      setLoading(false)
      
      if (existingUser) {
        console.log('📊 Existing user data:', {
          telegramId: existingUser.telegramId,
          telegramChatId: existingUser.telegramChatId,
          hasChatId: !!existingUser.telegramChatId
        })
        
        setUserData(existingUser)
        
        // Update user's telegramChatId if they don't have one
        if (user && existingUser && !existingUser.telegramChatId) {
          console.log('🔄 Updating user chat ID from Mini App...', {
            telegramId: user.id,
            currentChatId: existingUser.telegramChatId
          })
          updateUserChatId({
            telegramId: user.id,
            telegramChatId: user.id, // In Telegram Mini Apps, user.id is the chat ID
          }).then((result) => {
            console.log('✅ Chat ID updated from Mini App:', result)
            // Force a refresh of user data to get the updated chat ID
            window.location.reload()
          }).catch((error) => {
            console.error('❌ Failed to update chat ID from Mini App:', error)
          })
        } else if (user && existingUser && existingUser.telegramChatId) {
          console.log('✅ User already has chat ID:', existingUser.telegramChatId)
        } else {
          console.log('⚠️ Conditions not met for chat ID update:', {
            hasUser: !!user,
            hasExistingUser: !!existingUser,
            hasChatId: !!existingUser?.telegramChatId
          })
        }
      } else {
        console.log('❌ No existing user found - user may have been deleted')
        // If we previously had user data but now don't find the user in DB,
        // it means the user was deleted, so clear only the user data
        if (userData) {
          console.log('🧹 User was deleted from database, clearing user data but keeping Telegram user')
          console.log('📊 Before clearUserDataOnly:', { hasUserData: !!userData, hasTelegramUser: !!telegramUser })
          clearUserDataOnly()  
          console.log('✅ Cleared user data, auth guard should now redirect to login')
          // This will trigger the auth guard to redirect to registration
        } else {
          console.log('ℹ️ No cached userData found, setting to null')
          setUserData(null)
        }
      }
      
      // Always set initialized when we get a response (even if user doesn't exist)
      if (!isInitialized) {
        setInitialized(true)
      }
    }
  }, [existingUser, setUserData, setLoading, isInitialized, setInitialized, user, updateUserChatId, userData, clearUserDataOnly])

  return null
} 