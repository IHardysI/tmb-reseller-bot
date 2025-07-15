"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/widgets/sidebar"
import { FilterProvider, useFilters } from "@/contexts/FilterContext"
import Header from "@/components/widgets/header"
import { SidebarTrigger } from "@/components/widgets/sidebar"
import { usePathname } from "next/navigation"

interface SidebarLayoutProps {
  children: React.ReactNode
}

function SidebarContent({ children }: SidebarLayoutProps) {
  const filters = useFilters()
  const pathname = usePathname()

  const getPageTitle = (path: string) => {
    switch (path) {
      case "/":
        return "Маркетплейс"
      case "/profile":
        return "Профиль"
      case "/cart":
        return "Корзина"
      case "/messages":
        return "Сообщения"
      case "/moderation":
        return "Модерация"
      case "/auth/login":
        return "Авторизация"
      default:
        if (path.startsWith("/messages/")) {
          return "Сообщения"
        }
        if (path.startsWith("/profile/")) {
          return "Профиль пользователя"
        }
        return "Peer Swap"
    }
  }

  const isChatPage = pathname.startsWith("/messages/") && pathname.split("/").length > 2

  return (
    <SidebarProvider>
      <AppSidebar {...filters} />
      <div className="flex-1 min-h-screen">
        {!isChatPage && (
          <>
            {/* Desktop Header */}
            <div className="hidden md:block">
              <Header title={getPageTitle(pathname)} />
            </div>
            
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b sticky top-0 z-40">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-lg font-bold">{getPageTitle(pathname)}</h1>
                  </div>
                  <SidebarTrigger />
                </div>
              </div>
            </div>
          </>
        )}
        
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