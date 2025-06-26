"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Heart,
  ShoppingCart,
  Lock,
  Star,
  Award,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Product {
  id: string
  name: string
  brand: string
  price: number
  originalPrice?: number
  images: string[]
  condition: string
  year: number
  aiRating: number
  aiRecommendation: string
  aiExplanation: string
  sellerTrust: "bronze" | "silver" | "gold"
  sellerName: string
  sellerAvatar: string
  sellerRating: number
  sellerReviews: number
  isFavorite: boolean
  description: string
  defects: Array<{
    description: string
    image: string
    location: string
  }>
}

interface ProductDetailProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onToggleFavorite: (productId: string) => void
}

export default function ProductDetail({ product, isOpen, onClose, onToggleFavorite }: ProductDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!product) return null

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
  }

  const getTrustIcon = (trust: string) => {
    const colors = {
      bronze: "text-amber-600",
      silver: "text-gray-500",
      gold: "text-yellow-500",
    }
    return <Award className={`h-4 w-4 ${colors[trust as keyof typeof colors]}`} />
  }

  const getTrustLabel = (trust: string) => {
    const labels = {
      bronze: "Бронза, 85% отзывов положительные",
      silver: "Серебро, 92% отзывов положительные",
      gold: "Золото, 98% отзывов положительные",
    }
    return labels[trust as keyof typeof labels]
  }

  const getAiRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600"
    if (rating >= 3.5) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[100vw] h-[100vh] md:w-[95vw] md:h-[95vh] md:max-h-[95vh] p-0 md:rounded-lg">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">Детали товара</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
              {/* Image Gallery - takes 2 columns on desktop */}
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={product.images[currentImageIndex] || "/placeholder.svg?height=600&width=600"}
                    alt={product.name}
                    className="w-full aspect-square lg:aspect-[3/2] object-cover rounded-lg"
                  />
                  {product.images.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 h-8 w-8"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 h-8 w-8"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {product.images.length}
                  </div>
                </div>

                {/* Thumbnail Gallery */}
                {product.images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded border-2 overflow-hidden ${
                          index === currentImageIndex ? "border-blue-500" : "border-gray-200"
                        }`}
                      >
                        <img
                          src={image || "/placeholder.svg?height=64&width=64"}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info - takes 1 column on desktop */}
              <div className="space-y-4">
                {/* Basic Info */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h1 className="text-lg md:text-2xl lg:text-3xl font-bold pr-2">{product.name}</h1>
                      <div className="flex items-center space-x-4 text-gray-600 mb-2 text-sm">
                        <span className="font-medium">{product.brand}</span>
                        <span>•</span>
                        <span>Год покупки: {product.year}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onToggleFavorite(product.id)}>
                      <Heart
                        className={`h-5 w-5 ${product.isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                      />
                    </Button>
                  </div>
                </div>

                {/* Product Description */}
                <div>
                  <h3 className="font-semibold mb-2">Описание</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{product.description}</p>
                </div>

                {/* Price */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl md:text-3xl lg:text-4xl font-bold">
                      {product.price.toLocaleString()} ₽
                    </span>
                    <Lock className="h-5 w-5 text-green-600" />
                  </div>
                  {product.originalPrice && (
                    <span className="text-lg text-gray-400 line-through">
                      {product.originalPrice.toLocaleString()} ₽
                    </span>
                  )}
                </div>

                {/* AI Rating */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm md:text-base lg:text-lg flex items-center space-x-2">
                      <span>Оценка ИИ</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < Math.floor(product.aiRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                        <span className="ml-2 font-bold">{product.aiRating}</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant="outline" className={getAiRatingColor(product.aiRating)}>
                        {product.aiRecommendation}
                      </Badge>
                      <p className="text-sm text-gray-600 leading-relaxed">{product.aiExplanation}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Defects */}
                {product.defects.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm md:text-base lg:text-lg flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <span>Описание дефектов</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {product.defects.map((defect, index) => (
                          <div key={index} className="flex space-x-3">
                            <img
                              src={defect.image || "/placeholder.svg?height=60&width=60"}
                              alt={`Дефект ${index + 1}`}
                              className="w-12 h-12 object-cover rounded border flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <p className="font-medium text-sm break-words">{defect.location}</p>
                              <p className="text-sm text-gray-600 leading-relaxed break-words">{defect.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Seller Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm md:text-base lg:text-lg">Информация о продавце</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={product.sellerAvatar || "/placeholder.svg"} />
                        <AvatarFallback>{product.sellerName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{product.sellerName}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          {getTrustIcon(product.sellerTrust)}
                          <span className="truncate">{getTrustLabel(product.sellerTrust)}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < Math.floor(product.sellerRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {product.sellerRating} ({product.sellerReviews} отзывов)
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Escrow Info */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2 text-green-800">
                      <Lock className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">Безопасная сделка</span>
                    </div>
                    <p className="text-sm text-green-700 mt-2 leading-relaxed">
                      Средства замораживаются до получения вами товара. Деньги переводятся продавцу только после вашего
                      подтверждения.
                    </p>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                  <Button className="flex-1">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Добавить в корзину
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Написать продавцу
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
