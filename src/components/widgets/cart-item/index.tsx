 "use client"


import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Minus,
  Plus,
  Trash2,
  Lock,
  Star,
  Award,
  MessageCircle,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"

interface CartItem {
  id: string
  name: string
  brand: string
  price: number
  originalPrice?: number
  image: string
  condition: string
  year: number
  quantity: number
  sellerName: string
  sellerAvatar: string
  sellerTrust: "bronze" | "silver" | "gold"
  sellerRating: number
}

interface CartItemComponentProps {
  item: CartItem
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  onContactSeller: (id: string) => void
  showSeparator?: boolean
}

export default function CartItemComponent({
  item,
  onUpdateQuantity,
  onRemove,
  onContactSeller,
  showSeparator = true
}: CartItemComponentProps) {
  const getTrustIcon = (trust: string) => {
    const colors = {
      bronze: "text-amber-600",
      silver: "text-gray-500",
      gold: "text-yellow-500",
    }
    return <Award className={`h-4 w-4 ${colors[trust as keyof typeof colors]}`} />
  }

  return (
    <div>
      <div className="flex space-x-4">
        <div className="flex-shrink-0">
          <Image
            src={item.image || "/placeholder.svg"}
            alt={item.name}
            width={96}
            height={96}
            className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg border"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0 pr-4">
              <h3 className="font-medium text-sm md:text-base line-clamp-2">{item.name}</h3>
              <p className="text-sm text-gray-600">{item.brand}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {item.condition}
                </Badge>
                <span className="text-xs text-gray-500">{item.year} год</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-500"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={item.sellerAvatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">{item.sellerName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex items-center space-x-1">
                {getTrustIcon(item.sellerTrust)}
                <span className="text-xs text-gray-600">{item.sellerName}</span>
                <div className="flex items-center ml-2">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-gray-600 ml-1">{item.sellerRating}</span>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => onContactSeller(item.id)}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Написать
            </Button>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center space-x-1">
                <span className="font-bold text-lg">
                  {(item.price * item.quantity).toLocaleString()} ₽
                </span>
                <Lock className="h-4 w-4 text-green-600" />
              </div>
              {item.originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  {(item.originalPrice * item.quantity).toLocaleString()} ₽
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {showSeparator && <Separator className="mt-4" />}
    </div>
  )
} 