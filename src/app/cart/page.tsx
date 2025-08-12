"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useTelegramUser } from "@/hooks/useTelegramUser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ShoppingBag, CreditCard, Truck, Shield, MessageCircle } from "lucide-react"
import CartItemComponent from "@/components/widgets/cart-item"
import { useCart } from "@/contexts/CartContext"

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, addToCart } = useCart()
  const [deliveryMethod, setDeliveryMethod] = useState("courier")
  const router = useRouter()
  const telegramUser = useTelegramUser()
  
  const currentUser = useQuery(api.users.getUserByTelegramId, 
    telegramUser ? { telegramId: telegramUser.userId || 0 } : "skip"
  )

  console.log(telegramUser)

  const handleMessage = async (itemId: string) => {
    if (!currentUser) return
    
    const item = cartItems.find(item => item.id === itemId)
    if (!item) return
    
    router.push(`/messages/new?postId=${item.postId}`)
  }

  const handleBuyItem = async (itemId: string) => {
    if (!currentUser) return
    
    const item = cartItems.find(item => item.id === itemId)
    if (!item) return
    
    router.push(`/checkout/${item.postId}?quantity=${item.quantity}`)
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center min-h-60vh p-6">
          <div className="bg-gray-100 rounded-full p-8 mb-6">
            <ShoppingBag className="h-16 w-16 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Корзина пуста</h2>
          <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
            Добавьте товары в корзину, чтобы оформить заказ. Все покупки защищены эскроу-сервисом.
          </p>
          <Button onClick={() => window.history.back()} size="lg" className="px-8 mt-4">
            Продолжить покупки
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 lg-p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-start">
            <span className="text-sm text-gray-500">В корзине: {cartItems.length} товар{cartItems.length === 1 ? "" : cartItems.length < 5 ? "а" : "ов"}</span>
          </div>

          <div className="space-y-4">
            {cartItems.map((item) => (
              <CartItemComponent 
                key={item.id} 
                item={{
                  ...item,
                  location: "Москва"
                }} 
                onRemove={removeFromCart} 
                onContactSeller={handleMessage}
                onBuyItem={handleBuyItem}
                onUpdateQuantity={updateQuantity}
              />
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Shield className="h-5 w-5" />
                <span>Безопасность покупок</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 text-sm mb-1">Эскроу-платеж</h4>
                    <p className="text-sm text-green-700 leading-relaxed">
                      Деньги переводятся на эскроу-счет и замораживаются до получения товара. После подтверждения
                      получения средства автоматически переводятся продавцу.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <CreditCard className="h-5 w-5" />
                <span>Способы оплаты</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                <div className="flex items-center justify-center h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white text-xs font-bold shadow-sm">
                  VISA
                </div>
                <div className="flex items-center justify-center h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-lg text-white text-xs font-bold shadow-sm">
                  MC
                </div>
                <div className="flex items-center justify-center h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg text-white text-xs font-bold shadow-sm">
                  МИР
                </div>
                <div className="flex items-center justify-center h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg text-white text-xs font-bold shadow-sm">
                  SBP
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 