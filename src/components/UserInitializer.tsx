'use client'

import { useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useTelegramUser } from '@/hooks/useTelegramUser'
import { useUserStore } from '@/stores/userStore'
import type { UserData } from '@/stores/userStore'
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
    if (existingUser !== undefined) {
      setLoading(false)
      
      if (existingUser) {
        const normalizedUser: UserData = {
          _id: existingUser._id as any,
          _creationTime: existingUser._creationTime,
          telegramId: existingUser.telegramId,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          username: existingUser.username,
          languageCode: existingUser.languageCode,
          city: existingUser.city,
          deliveryAddress: existingUser.deliveryAddress,
          agreedToTerms: existingUser.agreedToTerms,
          onboardingCompleted: existingUser.onboardingCompleted,
          registeredAt: existingUser.registeredAt,
          postsCount: existingUser.postsCount,
          soldCount: existingUser.soldCount,
          bio: existingUser.bio,
          rating: existingUser.rating,
          reviewsCount: existingUser.reviewsCount,
          totalViews: existingUser.totalViews,
          trustLevel: existingUser.trustLevel,
          verificationStatus: existingUser.verificationStatus,
          avatar: existingUser.avatar || null,
          avatarStorageId: (existingUser as any).avatarStorageId,
          lastOnline: existingUser.lastOnline,
          isBlocked: existingUser.isBlocked,
          blockedAt: existingUser.blockedAt,
          blockedBy: (existingUser as any).blockedBy as any,
          blockReason: existingUser.blockReason,
          unblockedAt: existingUser.unblockedAt,
          unblockedBy: (existingUser as any).unblockedBy as any,
          unblockReason: existingUser.unblockReason,
          role: existingUser.role,
          email: existingUser.email,
          sellerInfo: existingUser.sellerInfo as any,
        }
        if (!userData || userData._id !== (existingUser._id as any)) {
          setUserData(normalizedUser)
        }
        
        // Update user's telegramChatId if they don't have one
        if (user && existingUser && !existingUser.telegramChatId) {
          updateUserChatId({
            telegramId: user.id,
            telegramChatId: user.id, // In Telegram Mini Apps, user.id is the chat ID
          }).then((result) => {
            // Force a refresh of user data to get the updated chat ID
            window.location.reload()
          }).catch((error) => {
            console.error('❌ Failed to update chat ID from Mini App:', error)
          })
        }
      } else {
        // If we previously had user data but now don't find the user in DB,
        // it means the user was deleted, so clear only the user data
        if (userData) {
          clearUserDataOnly()  
        } else {
          setUserData(null)
        }
      }
      
      // Always set initialized when we get a response (even if user doesn't exist)
      if (!isInitialized) {
        setInitialized(true)
      }
    }
  }, [existingUser, setUserData, setLoading, isInitialized, setInitialized, user, updateUserChatId, clearUserDataOnly, userData?._id])

  return null
} 