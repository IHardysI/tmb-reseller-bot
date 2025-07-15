"use client"

import { useEffect, useState } from 'react'
import SidebarLayout from "@/components/SidebarLayout"
import { useUserStore } from '@/stores/userStore'
import { OptimizedAuthGuard } from '@/components/OptimizedAuthGuard'
import { useMessageNotifications } from '@/hooks/useMessageNotifications'

interface OptimizedClientLayoutProps {
  children: React.ReactNode
}

export default function OptimizedClientLayout({ children }: OptimizedClientLayoutProps) {
  const [mounted, setMounted] = useState(false)
  const { isInitialized } = useUserStore()

  useMessageNotifications()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <OptimizedAuthGuard>
      <SidebarLayout>
        {children}
      </SidebarLayout>
    </OptimizedAuthGuard>
  )
} 