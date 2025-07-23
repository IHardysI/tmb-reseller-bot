import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Cookies from 'js-cookie'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

interface UserData {
  _id?: string
  _creationTime?: number
  telegramId: number
  firstName: string
  lastName?: string
  username?: string
  languageCode?: string
  city?: string
  deliveryAddress?: string
  agreedToTerms?: boolean
  onboardingCompleted?: boolean
  registeredAt?: number
  postsCount?: number
  soldCount?: number
  bio?: string
  rating?: number
  reviewsCount?: number
  totalViews?: number
  trustLevel?: 'bronze' | 'silver' | 'gold'
  verificationStatus?: 'verified' | 'pending' | 'unverified'
  avatar?: string | null
  avatarStorageId?: string
  lastOnline?: number
  isBlocked?: boolean
  blockedAt?: number
  blockedBy?: string
  blockReason?: string
  unblockedAt?: number
  unblockedBy?: string
  unblockReason?: string
  role?: 'admin' | 'user'
  email?: string
  sellerInfo?: {
    fullName: string
    bankName: string
    accountNumber: string
    iban: string
    swift: string
    submittedAt: number
  }
}

interface UserStore {
  telegramUser: TelegramUser | null
  userData: UserData | null
  isInitialized: boolean
  isLoading: boolean
  
  setTelegramUser: (user: TelegramUser) => void
  setUserData: (data: UserData | null) => void
  updateUserData: (data: Partial<UserData>) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  clearUser: () => void
  syncUserData: () => void
  clearAllData: () => void
  clearUserDataOnly: () => void
  
  isUserAvailable: () => boolean
  isOnboardingCompleted: () => boolean
  isUserBlocked: () => boolean
  isUserAdmin: () => boolean
}

const cookieStorage = {
  getItem: (name: string): string | null => {
    return Cookies.get(name) || null
  },
  setItem: (name: string, value: string): void => {
    Cookies.set(name, value, { 
      expires: 30,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
  },
  removeItem: (name: string): void => {
    Cookies.remove(name)
  }
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      telegramUser: null,
      userData: null,
      isInitialized: false,
      isLoading: false,
      
      setTelegramUser: (user) => {
        set({ telegramUser: user })
      },
      
      setUserData: (data) => {
        set({ userData: data })
      },
      
      updateUserData: (data) => {
        const current = get().userData
        if (current) {
          set({ userData: { ...current, ...data } })
        }
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading })
      },
      
      setInitialized: (initialized) => {
        set({ isInitialized: initialized })
      },
      
      clearUser: () => {
        set({ 
          telegramUser: null, 
          userData: null, 
          isInitialized: false, 
          isLoading: false 
        })
      },
      
      syncUserData: () => {
        // This will be called to trigger a re-fetch when needed
        // For now, it's a placeholder for future implementation
      },
      
      clearAllData: () => {
        set({ 
          telegramUser: null, 
          userData: null, 
          isInitialized: false, 
          isLoading: false 
        })
        // Clear cookies/storage as well
        cookieStorage.removeItem('user-store')
      },
      
      clearUserDataOnly: () => {
        console.log('🧹 clearUserDataOnly called')
        const stateBefore = get()
        console.log('📊 State before clear:', { 
          hasUserData: !!stateBefore.userData, 
          hasTelegramUser: !!stateBefore.telegramUser,
          isInitialized: stateBefore.isInitialized 
        })
        
        set({ 
          userData: null,  
          isLoading: false 
        })
        
        const stateAfter = get()
        console.log('📊 State after clear:', { 
          hasUserData: !!stateAfter.userData, 
          hasTelegramUser: !!stateAfter.telegramUser,
          isInitialized: stateAfter.isInitialized 
        })
        // Keep telegramUser and isInitialized - just clear the database user data
      },
      
      isUserAvailable: () => {
        const { telegramUser } = get()
        return !!telegramUser
      },
      
      isOnboardingCompleted: () => {
        const { userData } = get()
        return userData?.onboardingCompleted === true
      },
      
      isUserBlocked: () => {
        const { userData } = get()
        return userData?.isBlocked === true
      },
      
      isUserAdmin: () => {
        const { userData } = get()
        return userData?.role === 'admin'
      },
      

    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({
        telegramUser: state.telegramUser,
        userData: state.userData,
        isInitialized: state.isInitialized
      })
    }
  )
)

export type { TelegramUser, UserData, UserStore } 