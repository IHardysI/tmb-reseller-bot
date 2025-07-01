"use client"

import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/CartContext"
import { ShoppingBag } from "lucide-react"

const sampleItems = [
  {
    id: "sample-1",
    name: "Классическая сумка Neverfull",
    brand: "Louis Vuitton",
    price: 85000,
    originalPrice: 150000,
    image: "/placeholder.svg?height=400&width=400",
    condition: "Как новое",
    year: 2022,
    sellerName: "Анна К.",
    sellerAvatar: "/placeholder.svg?height=48&width=48",
    sellerTrust: "gold" as const,
    sellerRating: 4.8,
  },
  {
    id: "sample-2",
    name: "Кроссовки Air Jordan 1 Retro",
    brand: "Nike",
    price: 25000,
    originalPrice: 35000,
    image: "/placeholder.svg?height=400&width=400",
    condition: "С дефектами",
    year: 2021,
    sellerName: "Максим П.",
    sellerAvatar: "/placeholder.svg?height=48&width=48",
    sellerTrust: "silver" as const,
    sellerRating: 4.2,
  },
]

export default function AddSampleItems() {
  const { addToCart, cartItems } = useCart()

  const handleAddSampleItems = () => {
    sampleItems.forEach(item => {
      addToCart(item)
    })
  }

  if (cartItems.length > 0) {
    return null
  }

  return (
    <div className="text-center space-y-4">
      <p className="text-sm text-gray-600">
        Корзина пуста. Добавьте несколько тестовых товаров для демонстрации:
      </p>
      <Button onClick={handleAddSampleItems} variant="outline" size="sm">
        <ShoppingBag className="h-4 w-4 mr-2" />
        Добавить тестовые товары
      </Button>
    </div>
  )
} 