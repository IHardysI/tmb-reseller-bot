"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/widgets/sidebar"
import { FilterProvider, useFilters } from "@/contexts/FilterContext"

interface SidebarLayoutProps {
  children: React.ReactNode
}

function SidebarContent({ children }: SidebarLayoutProps) {
  const filters = useFilters()

  return (
    <SidebarProvider>
      <AppSidebar {...filters} />
      <div className="flex-1 min-h-screen">
        {children}
      </div>
    </SidebarProvider>
  )
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <FilterProvider>
      <SidebarContent>
        {children}
      </SidebarContent>
    </FilterProvider>
  )
} 