import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/widgets/sidebar"
import {
  User,
  MessageCircle,
  Home as HomeIcon,
  ShoppingCart,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { useCart } from "@/contexts/CartContext"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useOptimizedTelegramUser } from "@/hooks/useOptimizedTelegramUser"

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { getCartItemsCount } = useCart()
  const cartItemsCount = getCartItemsCount()
  const telegramUser = useOptimizedTelegramUser()
  const roleInfo = useQuery(api.users.getCurrentUserRole)
  const isAdmin = !!roleInfo?.isAdmin
  const activeCases = useQuery(
    api.moderation.getModerationCases,
    isAdmin ? { status: "pending" } : 'skip'
  )
  const currentUser = telegramUser.userData
  const userChats = useQuery(
    api.chats.getUserChats,
    currentUser?.userId ? { userId: currentUser.userId as any } : 'skip'
  )
  
  const activeCasesCount = activeCases?.length || 0
  const unreadMessagesCount = (() => {
    if (!userChats || userChats.length === 0) return 0
    const uniqueSenderIds = new Set<string>()
    for (const chat of userChats) {
      if (chat.unreadCount && chat.unreadCount > 0 && chat.otherParticipant?.id) {
        uniqueSenderIds.add(String(chat.otherParticipant.id))
      }
    }
    return uniqueSenderIds.size
  })()


  
  return (
    <div className="bg-white border-b sticky top-0 z-40">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center gap-2">
              <Link href="/">
                <Button variant="outline" size="sm" className="h-9 px-4 border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-700 shadow-sm transition-all duration-200">
                  <HomeIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm">Главная</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" size="sm" className="h-9 px-4 border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-700 shadow-sm transition-all duration-200">
                  <User className="h-4 w-4 mr-2" />
                  <span className="text-sm">Профиль</span>
                </Button>
              </Link>
              <Link href="/cart">
                <Button variant="outline" size="sm" className="h-9 px-4 border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-700 shadow-sm transition-all duration-200 relative">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <span className="text-sm">Корзина</span>
                  {cartItemsCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white flex items-center justify-center border-2 border-white">
                      {cartItemsCount > 99 ? '99+' : cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="outline" size="sm" className="h-9 px-4 border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-700 shadow-sm transition-all duration-200 relative">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Сообщения</span>
                  {unreadMessagesCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white flex items-center justify-center border-2 border-white">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              {isAdmin && (
                <Link href="/moderation">
                  <Button variant="outline" size="sm" className="h-9 px-4 border-gray-300 bg-white hover:bg-red-50 hover:border-red-300 text-gray-700 hover:text-red-700 shadow-sm transition-all duration-200 relative">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="text-sm">Модерация</span>
                    {activeCasesCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white flex items-center justify-center border-2 border-white">
                        {activeCasesCount > 99 ? '99+' : activeCasesCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )}
            </div>
            <SidebarTrigger />
          </div>
        </div>
      </div>
    </div>
  )
} 