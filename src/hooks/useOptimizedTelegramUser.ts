import { useUserStore } from '@/stores/userStore'
import { useMemo } from 'react'

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

  return useMemo(() => ({
    isInitialized,
    isLoading,
    userData: userData ? {
      userId: userData._id || '',
      telegramId: userData.telegramId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: userData.username,
      city: userData.city,
      deliveryAddress: userData.deliveryAddress,
      bio: userData.bio,
      rating: userData.rating || 0,
      reviewsCount: userData.reviewsCount || 0,
      postsCount: userData.postsCount || 0,
      soldCount: userData.soldCount || 0,
      totalViews: userData.totalViews || 0,
      trustLevel: userData.trustLevel || 'bronze',
      verificationStatus: userData.verificationStatus || 'unverified',
      registeredAt: userData.registeredAt || Date.now(),
      role: userData.role,
      email: userData.email,
      sellerInfo: userData.sellerInfo,
      isBlocked: userData.isBlocked || false,
      onboardingCompleted: userData.onboardingCompleted || false,
    } : null,
    user: telegramUser,
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
    role: userData?.role,
    email: userData?.email,
    sellerInfo: userData?.sellerInfo
  }), [userData, isInitialized, isLoading, telegramUser, isOnboardingCompleted, isUserAdmin, isUserAvailable, isUserBlocked]);
} 
