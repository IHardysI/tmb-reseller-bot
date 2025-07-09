import { useCallback } from 'react'
import { useMutation } from 'convex/react'
import { useUserStore } from '@/stores/userStore'
import { api } from '../../convex/_generated/api'

export function useUserDataSync() {
  const { updateUserData, setUserData, telegramUser } = useUserStore()
  
  const updateUserProfile = useMutation(api.users.updateUserProfile)
  const updateUserAvatar = useMutation(api.users.updateUserAvatar)
  const completeOnboarding = useMutation(api.users.completeOnboarding)
  
  const syncUpdateProfile = useCallback(async (profileData: any) => {
    if (!telegramUser?.id) return
    
    try {
      // Update in database
      await updateUserProfile({
        telegramId: telegramUser.id!,
        ...profileData
      })
      
      // Update store instantly
      updateUserData(profileData)
      
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }, [telegramUser?.id, updateUserProfile, updateUserData])
  
  const syncUpdateAvatar = useCallback(async (avatarStorageId: string) => {
    if (!telegramUser?.id) return
    
    try {
      // Update in database
      const result = await updateUserAvatar({
        telegramId: telegramUser.id!,
        avatarStorageId: avatarStorageId as any
      })
      
      // Update store instantly
      updateUserData({ avatarStorageId: avatarStorageId as any })
      
      return result
    } catch (error) {
      console.error('Error updating avatar:', error)
      throw error
    }
  }, [telegramUser?.id, updateUserAvatar, updateUserData])
  
  const syncCompleteOnboarding = useCallback(async (onboardingData: any) => {
    if (!telegramUser?.id) return
    
    try {
      // Update in database
      const result = await completeOnboarding({
        telegramId: telegramUser.id!,
        ...onboardingData
      })
      
      // Update store instantly
      updateUserData({
        ...onboardingData,
        onboardingCompleted: true,
        agreedToTerms: true
      })
      
      return result
    } catch (error) {
      console.error('Error completing onboarding:', error)
      throw error
    }
  }, [telegramUser?.id, completeOnboarding, updateUserData])
  
  return {
    syncUpdateProfile,
    syncUpdateAvatar,
    syncCompleteOnboarding
  }
} 