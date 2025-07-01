import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/widgets/sidebar"
import {
  User,
  MessageCircle,
  Home as HomeIcon,
  ShoppingCart,
} from "lucide-react"
import Link from "next/link"

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  return (
    <div className="bg-white border-b sticky top-0 z-40">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold">{title}</h1>
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
                <Button variant="outline" size="sm" className="h-9 px-4 border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-700 shadow-sm transition-all duration-200">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <span className="text-sm">Корзина</span>
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="outline" size="sm" className="h-9 px-4 border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-700 shadow-sm transition-all duration-200">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Сообщения</span>
                </Button>
              </Link>
            </div>
            <SidebarTrigger />
          </div>
        </div>
      </div>
    </div>
  )
} 