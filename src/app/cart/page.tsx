"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  ShoppingBag,
  CreditCard,
  Truck,
  Shield,
  MessageCircle,
} from "lucide-react"
import Header from "@/components/widgets/header"
import CartItemComponent from "@/components/widgets/cart-item"
import AddSampleItems from "@/components/widgets/add-sample-items"
import { useCart } from "@/contexts/CartContext"

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

const mockCartItems: CartItem[] = [
  {
    id: "1",
    name: "Классическая сумка Neverfull",
    brand: "Louis Vuitton",
    price: 85000,
    originalPrice: 150000,
    image: "/placeholder.svg?height=400&width=400",
    condition: "Как новое",
    year: 2022,
    quantity: 1,
    sellerName: "Анна К.",
    sellerAvatar: "/placeholder.svg?height=48&width=48",
    sellerTrust: "gold",
    sellerRating: 4.8,
  },
  {
    id: "2",
    name: "Кроссовки Air Jordan 1 Retro",
    brand: "Nike",
    price: 25000,
    originalPrice: 35000,
    image: "/placeholder.svg?height=400&width=400",
    condition: "С дефектами",
    year: 2021,
    quantity: 1,
    sellerName: "Максим П.",
    sellerAvatar: "/placeholder.svg?height=48&width=48",
    sellerTrust: "silver",
    sellerRating: 4.2,
  },
]

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, addToCart } = useCart()
  const [deliveryMethod, setDeliveryMethod] = useState("courier")
  const [promoCode, setPromoCode] = useState("")
  const [promoDiscount, setPromoDiscount] = useState(0)

  const contactSeller = (id: string) => {
    const item = cartItems.find(item => item.id === id)
    if (item) {
      alert(`Связаться с продавцом: ${item.sellerName}`)
    }
  }

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === "save10") {
      setPromoDiscount(0.1)
    } else {
      setPromoDiscount(0)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = deliveryMethod === "courier" ? 500 : 0
  const serviceFee = Math.round(subtotal * 0.03)
  const discount = Math.round(subtotal * promoDiscount)
  const total = subtotal + deliveryFee + serviceFee - discount

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Корзина" />
        
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <div className="bg-gray-100 rounded-full p-6 mb-6">
            <ShoppingBag className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Корзина пуста</h2>
          <p className="text-gray-600 text-center mb-8 max-w-md">
            Добавьте товары в корзину, чтобы оформить заказ. Все покупки защищены эскроу-сервисом.
          </p>
          <AddSampleItems />
          <Button onClick={() => window.history.back()} size="lg" className="mt-4">
            Продолжить покупки
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Корзина" />

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingBag className="h-5 w-5" />
                  <span>Товары в корзине</span>
                  <Badge variant="secondary" className="ml-2">
                    {cartItems.length} {cartItems.length === 1 ? "товар" : "товара"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item, index) => (
                  <CartItemComponent
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}    
                    onRemove={removeFromCart}
                    onContactSeller={contactSeller}
                    showSeparator={index < cartItems.length - 1}
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>Способ доставки</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="courier" id="courier" />
                    <Label htmlFor="courier" className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Курьерская доставка</div>
                          <div className="text-sm text-gray-600">1-2 рабочих дня</div>
                        </div>
                        <span className="font-medium">500 ₽</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Самовывоз</div>
                          <div className="text-sm text-gray-600">Встреча с продавцом</div>
                        </div>
                        <span className="font-medium text-green-600">Бесплатно</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Итого к оплате</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Товары ({cartItems.length})</span>
                    <span>{subtotal.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Доставка</span>
                    <span>{deliveryFee > 0 ? `${deliveryFee.toLocaleString()} ₽` : "Бесплатно"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Сервисный сбор</span>
                    <span>{serviceFee.toLocaleString()} ₽</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Скидка</span>
                      <span>-{discount.toLocaleString()} ₽</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Итого</span>
                    <span>{total.toLocaleString()} ₽</span>
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Связаться с продавцами
                </Button>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-800 text-sm">Эскроу-платеж</h4>
                        <p className="text-sm text-green-700 mt-1 leading-relaxed">
                          Деньги переводятся на эскроу-счет и замораживаются до получения товара. После подтверждения
                          получения средства автоматически переводятся продавцу.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Способы оплаты</Label>
                  <div className="flex space-x-2">
                    <div className="flex items-center justify-center w-12 h-8 bg-blue-600 rounded text-white text-xs font-bold">
                      VISA
                    </div>
                    <div className="flex items-center justify-center w-12 h-8 bg-red-600 rounded text-white text-xs font-bold">
                      MC
                    </div>
                    <div className="flex items-center justify-center w-12 h-8 bg-yellow-500 rounded text-white text-xs font-bold">
                      МИР
                    </div>
                    <div className="flex items-center justify-center w-12 h-8 bg-purple-600 rounded text-white text-xs font-bold">
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