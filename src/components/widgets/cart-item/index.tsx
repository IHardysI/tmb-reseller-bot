"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trash2, Lock, Star, Award, MessageCircle, MapPin } from "lucide-react"

interface CartItemData {
  id: string
  postId: string
  sellerId: string
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
  location?: string
}

interface CartItemProps {
  item: CartItemData
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  onContactSeller: (itemId: string) => void
  showSeparator?: boolean
}

export default function CartItemComponent({ item, onUpdateQuantity, onRemove, onContactSeller, showSeparator }: CartItemProps) {
  const getTrustIcon = (trust: string) => {
    const colors = {
      bronze: "text-amber-600",
      silver: "text-gray-500",
      gold: "text-yellow-500",
    }
    return <Award className={`h-4 w-4 ${colors[trust as keyof typeof colors]}`} />
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4 lg:p-6">
        <div className="flex flex-col gap-4">
          <div className="w-full sm:hidden">
            <img
              src={item.image || "/placeholder.svg"}
              alt={item.name}
              className="w-full h-48 object-cover rounded-xl border"
            />
          </div>

          <div className="flex gap-4">
            <div className="hidden sm:block flex-shrink-0">
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                className="w-28 h-28 lg:w-32 lg:h-32 object-cover rounded-xl border"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base lg:text-lg line-clamp-2 mb-1">{item.name}</h3>
                  <p className="text-gray-600 font-medium">{item.brand}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0 ml-2"
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-medium">
                  {item.condition}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {item.year} год
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.sellerAvatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs font-medium">{item.sellerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      {getTrustIcon(item.sellerTrust)}
                      <span className="text-sm font-medium text-gray-900">{item.sellerName}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <div className="flex items-center">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                        <span>{item.sellerRating}</span>
                      </div>
                      {item.location && (
                        <>
                          <span>•</span>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>{item.location}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs bg-transparent" onClick={() => onContactSeller(item.id)}>
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Написать
                </Button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <span className="text-xl lg:text-2xl font-bold text-gray-900">{(item.price * item.quantity).toLocaleString()} ₽</span>
                  <Lock className="h-4 w-4 text-green-600" />
                </div>
                {item.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">{(item.originalPrice * item.quantity).toLocaleString()} ₽</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
