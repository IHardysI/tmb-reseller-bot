import { useUserStore } from '@/stores/userStore'

export function useOptimizedTelegramUser() {
  const { 
    telegramUser, 
    userData, 
    isInitialized, 
    isLoading,
    isUserAvailable,
    isOnboardingCompleted,
    isUserBlocked,
    isUserAdmin 
  } = useUserStore()

  return {
    user: telegramUser,
    userData,
    isInitialized,
    isLoading,
    isUserAvailable: isUserAvailable(),
    userId: telegramUser?.id,
    userName: telegramUser?.username,
    userFirstName: telegramUser?.first_name,
    userLastName: telegramUser?.last_name,
    userLanguage: telegramUser?.language_code,
    userIsPremium: telegramUser?.is_premium,
    
    onboardingCompleted: isOnboardingCompleted(),
    isBlocked: isUserBlocked(),
    isAdmin: isUserAdmin(),
    
    fullName: userData ? `${userData.firstName} ${userData.lastName || ''}`.trim() : '',
    city: userData?.city,
    deliveryAddress: userData?.deliveryAddress,
    bio: userData?.bio,
    avatar: userData?.avatar,
    rating: userData?.rating,
    trustLevel: userData?.trustLevel,
    verificationStatus: userData?.verificationStatus,
    postsCount: userData?.postsCount,
    soldCount: userData?.soldCount,
    totalViews: userData?.totalViews,
    registeredAt: userData?.registeredAt,
    lastOnline: userData?.lastOnline,
    role: userData?.role
  }
} 