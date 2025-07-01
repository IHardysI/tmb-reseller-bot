"use client"

import { useEffect, useState } from 'react'
import SidebarLayout from "@/components/SidebarLayout"
import { FullScreenLoader } from "@/components/ui/loader"

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <FullScreenLoader text="Загрузка..." />
  }

  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  )
} 