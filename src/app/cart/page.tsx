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
import Header from "@/components/widgets/header"
import CartItemComponent from "@/components/widgets/cart-item"
import AddSampleItems from "@/components/widgets/add-sample-items"
import { useCart } from "@/contexts/CartContext"

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, addToCart } = useCart()
  const [deliveryMethod, setDeliveryMethod] = useState("courier")
  const router = useRouter()
  const telegramUser = useTelegramUser()
  
  const currentUser = useQuery(api.users.getUserByTelegramId, 
    telegramUser ? { telegramId: telegramUser.userId || 0 } : "skip"
  )
  
  const createChat = useMutation(api.chats.createChat)

  const handleMessage = async (itemId: string) => {
    if (!currentUser) return
    
    const item = cartItems.find(item => item.id === itemId)
    if (!item) return
    
    try {
      const chatId = await createChat({
        postId: item.postId as any,
        buyerId: currentUser._id,
      })
      
      router.push(`/messages/${chatId}`)
    } catch (error) {
      console.error("Error creating chat:", error)
    }
  }

  const handleMessageAllSellers = async () => {
    if (!currentUser) return
    
    const uniqueSellers = Array.from(new Set(cartItems.map(item => item.sellerId)))
    
    try {
      const chatPromises = uniqueSellers.map(async (sellerId) => {
        const item = cartItems.find(item => item.sellerId === sellerId)
        if (!item) return null
        
        return await createChat({
          postId: item.postId as any,
          buyerId: currentUser._id,
        })
      })
      
      const chatIds = await Promise.all(chatPromises)
      
      if (chatIds.length === 1) {
        router.push(`/messages/${chatIds[0]}`)
      } else {
        router.push("/messages")
      }
    } catch (error) {
      console.error("Error creating chats:", error)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = deliveryMethod === "courier" ? 500 : 0
  const serviceFee = Math.round(subtotal * 0.03)
  const total = subtotal + deliveryFee + serviceFee

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Корзина" />

        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
          <div className="bg-gray-100 rounded-full p-8 mb-6">
            <ShoppingBag className="h-16 w-16 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Корзина пуста</h2>
          <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
            Добавьте товары в корзину, чтобы оформить заказ. Все покупки защищены эскроу-сервисом.
          </p>
          <AddSampleItems />
          <Button onClick={() => window.history.back()} size="lg" className="px-8 mt-4">
            Продолжить покупки
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Корзина" subtitle={`${cartItems.length} ${cartItems.length === 1 ? "товар" : cartItems.length < 5 ? "товара" : "товаров"}`} />

      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          <div className="xl:col-span-2">
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
                  onUpdateQuantity={updateQuantity}
                />
              ))}
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Truck className="h-5 w-5" />
                  <span>Способ получения</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod} className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="courier" id="courier" />
                    <Label htmlFor="courier" className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">Курьерская доставка</div>
                        <div className="text-sm text-gray-600">1-2 рабочих дня</div>
                      </div>
                    </Label>
                    <span className="font-semibold text-gray-900 ml-auto">500 ₽</span>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">Самовывоз</div>
                        <div className="text-sm text-gray-600">Встреча с продавцом</div>
                      </div>
                    </Label>
                    <span className="font-semibold text-green-600 ml-auto">Бесплатно</span>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          <div className="xl:sticky xl:top-24 xl:self-start">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <CreditCard className="h-5 w-5" />
                  <span>Итого к оплате</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Товары ({cartItems.length} {cartItems.length === 1 ? "шт" : "шт"})
                    </span>
                    <span className="font-medium">{subtotal.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Доставка</span>
                    <span className="font-medium">
                      {deliveryFee > 0 ? `${deliveryFee.toLocaleString()} ₽` : "Бесплатно"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Сервисный сбор</span>
                    <span className="font-medium">{serviceFee.toLocaleString()} ₽</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Итого</span>
                    <span>{total.toLocaleString()} ₽</span>
                  </div>
                </div>

                <Button className="w-full h-12 text-base font-medium" size="lg" onClick={handleMessageAllSellers}>
                  <MessageCircle className="h-5 w-5 mr-2" />
                  {cartItems.length > 1 ? "Связаться с продавцами" : "Связаться с продавцом"}
                </Button>

                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-4">
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
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-900">Способы оплаты</Label>
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 