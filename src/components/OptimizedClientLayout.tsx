"use client"

import { useEffect, useState } from 'react'
import SidebarLayout from "@/components/SidebarLayout"
import { useUserStore } from '@/stores/userStore'

interface OptimizedClientLayoutProps {
  children: React.ReactNode
}

export default function OptimizedClientLayout({ children }: OptimizedClientLayoutProps) {
  const [mounted, setMounted] = useState(false)
  const { isInitialized } = useUserStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  )
} 