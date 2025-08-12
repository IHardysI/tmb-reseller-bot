"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@/../convex/_generated/api"
import { Id } from "@/../convex/_generated/dataModel"
import { useTelegramUser } from "@/hooks/useTelegramUser"
import { useCart } from "@/contexts/CartContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Heart,
  ShoppingCart,
  Lock,
  Star,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  MapPin,
  X,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Image from "next/image"
import { ImagePreview } from "@/components/ui/image-preview"

interface ProductDetailProps {
  postId: Id<"posts"> | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (post: any) => void
  onDelete?: (postId: string) => void
  hideMessageSellerButton?: boolean
}

export default function ProductDetail({ postId, isOpen, onClose, onEdit, onDelete, hideMessageSellerButton }: ProductDetailProps) {
  const telegramUser = useTelegramUser()
  const { addToCart, isInCart } = useCart()
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLiking, setIsLiking] = useState(false)
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  
  const post = useQuery(api.posts.getPostById, postId ? { postId } : "skip")
  const currentUser = useQuery(api.users.getUserByTelegramId, 
    telegramUser ? { telegramId: telegramUser.userId || 0 } : "skip"
  )
  
  const likePost = useMutation(api.posts.likePost)
  const unlikePost = useMutation(api.posts.unlikePost)
  const incrementViews = useMutation(api.posts.incrementViews)

  useEffect(() => {
    if (isOpen && postId && telegramUser?.userId) {
      incrementViews({ postId, telegramId: telegramUser.userId })
    }
  }, [isOpen, postId, telegramUser?.userId, incrementViews])

  if (!post || !postId) return null

  const nextImage = () => {
    if (post && currentImageIndex < post.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const prevImage = () => {
    if (post && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  const handleAddToCart = () => {
    if (!post || isInCart(post._id)) return
    
    addToCart({
      id: post._id,
      postId: post._id,
      sellerId: post.userId,
      name: post.name,
      brand: post.brand || "Без бренда",
      price: post.price,
      image: post.images[0] || "/placeholder.svg",
      condition: post.condition,
      year: post.year,
      sellerName: post.sellerName || "Продавец",
      sellerAvatar: "/placeholder.svg",
      sellerTrust: "bronze",
      sellerRating: 4.5
    })
  }

  const handleMessageSeller = async () => {
    if (!post || !currentUser) return
    
    router.push(`/messages/new?postId=${post._id}`)
  }

  const handleToggleLike = async () => {
    if (!telegramUser?.userId || !postId || isLiking) return
    
    setIsLiking(true)
    try {
      if (isLiked) {
        await unlikePost({ postId, telegramId: telegramUser.userId })
      } else {
        await likePost({ postId, telegramId: telegramUser.userId })
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleDelete = () => {
    if (onDelete && postId) {
      onDelete(postId)
      onClose()
    }
  }

  const isOwned = currentUser && post.userId === currentUser._id
  const isLiked = currentUser && post.likedBy?.includes(currentUser._id) || false
  const likesCount = post.likesCount || 0
  const viewsCount = post.views || 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[95vw] h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-1 sm:p-3 border-b bg-white sticky top-0 z-10">
          <DialogTitle className="sr-only">Товар: {post.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Детальная информация о товаре {post.name} от {post.brand}
          </DialogDescription>
          <div className="flex items-center justify-end gap-2">
            {isOwned && (
              <>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    className="h-8 w-8"
                    >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit({
                      ...post,
                      id: post._id
                    })}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </Button>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-3 lg:px-5 py-3 space-y-4">
            {/* Full Width Images */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow group py-0">
              <div className="relative">
                <Image
                  src={post.images[currentImageIndex] || "/placeholder.svg"}
                  alt={post.name}
                  width={800}
                  height={450}
                  className="w-full aspect-[16/9] object-cover cursor-pointer"
                  priority
                  unoptimized
                  onClick={() => setIsImagePreviewOpen(true)}
                />
                
                {post.images.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 shadow-xl border-gray-300 h-8 w-8 z-10"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-700" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 shadow-xl border-gray-300 h-8 w-8 z-10"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4 text-gray-700" />
                    </Button>
                  </>
                )}
                
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 rounded-full text-sm font-medium leading-none">
                  {currentImageIndex + 1} / {post.images.length}
                </div>
              </div>
            </Card>

            {/* Thumbnail Gallery */}
            {post.images.length > 1 && (
              <div className="flex justify-center gap-2 lg:gap-4 overflow-x-auto pb-2">
                {post.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 lg:w-24 lg:h-24 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? "border-blue-500 ring-2 ring-blue-200" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${post.name} ${index + 1}`}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {!isOwned && (
              <div className="flex gap-2 w-full">
                <Button 
                  size="sm" 
                  className={`w-1/2 px-5 h-10 text-sm font-semibold ${
                    isInCart(post._id) ? 'bg-green-600 hover:bg-green-700' : ''
                  }`}
                  onClick={handleAddToCart}
                  disabled={isInCart(post._id)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
                    {isInCart(post._id) ? 'Добавлено в корзину' : 'Добавить в корзину'}
                  </span>
                  <span className="sm:hidden">
                    {isInCart(post._id) ? 'Добавлено' : 'В корзину'}
                  </span>
                </Button>
                {!hideMessageSellerButton && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-1/2 px-5 h-10 text-sm font-semibold"
                    onClick={handleMessageSeller}
                    disabled={!currentUser}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Написать продавцу</span>
                    <span className="sm:hidden">Написать</span>
                  </Button>
                )}
              </div>
            )}

            {/* Product Info */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="px-4 lg:px-6">
                <div className="space-y-3">
                  <div>
                    <h1 className="font-bold text-xl lg:text-2xl leading-tight mb-2 lg:mb-3 mt-0">{post.name}</h1>
                    <div className="flex items-center gap-2 lg:gap-3 text-gray-600 text-sm lg:text-base flex-wrap">
                      <span className="font-semibold text-blue-600 text-base lg:text-lg">{post.brand}</span>
                      <span className="w-1 h-1 lg:w-2 lg:h-2 bg-gray-400 rounded-full"></span>
                      <span>{post.year} год</span>
                      <span className="w-1 h-1 lg:w-2 lg:h-2 bg-gray-400 rounded-full"></span>
                      <span className="capitalize">{post.condition}</span>
                      {post.category && (
                        <>
                          <span className="w-1 h-1 lg:w-2 lg:h-2 bg-gray-400 rounded-full"></span>
                          <Badge variant="secondary" className="text-xs lg:text-xs whitespace-nowrap">
                            {post.category}
                            {post.subcategory && ` • ${post.subcategory}`}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-2xl lg:text-3xl">{post.price.toLocaleString()} ₽</span>
                      <Lock className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
                    </div>
                    <div className="text-sm text-gray-600">
                      В наличии: <span className="font-semibold">{(post as any).quantityAvailable ?? (post as any).quantityTotal ?? 1}</span> шт.
                    </div>
                  </div>

                  {post.aiRating && post.aiRecommendation && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < Math.floor(post.aiRating!) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="text-green-600 font-semibold text-sm">{post.aiRecommendation}</span>
                        <span className="font-bold text-base">{post.aiRating!.toFixed(1)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-gray-600 text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{viewsCount}</span>
                      </div>
                      <button
                        onClick={handleToggleLike}
                        disabled={isLiking}
                        className={`flex items-center space-x-1 transition-all hover:scale-105 ${
                          isLiked ? "text-red-500" : "hover:text-red-500"
                        } ${isLiking ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""} ${isLiking ? "animate-pulse" : ""}`} />
                        <span>{likesCount}</span>
                      </button>
                    </div>
                    <span className="text-xs">{new Date(post.createdAt).toLocaleDateString("ru-RU")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="px-3 lg:px-5">
                <CardTitle className="text-base lg:text-xl">Описание товара</CardTitle>
              </CardHeader>
              <CardContent className="px-4 lg:px-6">
                <p className="text-gray-700 leading-relaxed text-sm lg:text-base whitespace-pre-wrap break-words overflow-wrap-anywhere max-w-full" style={{ 
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  maxWidth: '100%'
                }}>
                  {post.description}
                </p>
              </CardContent>
            </Card>

            {/* AI Rating Details */}
            {post.aiRating && post.aiExplanation && (
              <Card className="border border-blue-200 bg-blue-50/30 overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="px-3 lg:px-5 py-2">
                  <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <Star className="h-3 w-3 text-white fill-current" />
                    </div>
                    <span className="text-sm lg:text-base">Подробная оценка ИИ</span>
                    <div className="flex items-center gap-1 ml-auto">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(post.aiRating!) 
                              ? "text-yellow-400 fill-current" 
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="font-bold text-sm ml-1">
                        {post.aiRating!.toFixed(1)}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 lg:px-5">
                  <p className="text-gray-700 leading-relaxed text-sm break-words overflow-wrap-anywhere max-w-full" style={{ 
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    maxWidth: '100%'
                  }}>
                    {post.aiExplanation}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Defects */}
            {post.defects.length > 0 && (
              <Card className="border border-orange-200 bg-orange-50/30 overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="px-3 lg:px-5 py-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-orange-800">
                    <AlertTriangle className="h-4 w-4" />
                    Замеченные дефекты
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 lg:px-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {post.defects.map((defect, index) => (
                      <div key={index} className="flex gap-3 p-3 bg-white rounded-lg border border-orange-200">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-orange-900 mb-1 text-sm break-words overflow-wrap-anywhere" style={{ 
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                          }}>
                            {defect.location}
                          </h4>
                          <p className="text-gray-700 text-xs leading-relaxed break-words overflow-wrap-anywhere" style={{ 
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                          }}>
                            {defect.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
              {/* Seller Info */}
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="px-3 lg:px-5 lg:py-3">
                  <CardTitle className="text-sm lg:text-base">Продавец</CardTitle>
                </CardHeader>
                <CardContent className="px-3 lg:px-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="text-sm font-semibold">
                        {post.sellerName?.charAt(0) || 'П'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm lg:text-base text-gray-900">
                        {post.sellerName}
                      </h3>
                      {post.sellerCity && (
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">{post.sellerCity}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-amber-600">
                        <span className="text-sm">🥉</span>
                        <span className="font-medium text-xs">Новый продавец</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Safety Info */}
              <Card className="border border-green-200 bg-green-50/30 overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="px-3 lg:px-5 lg:py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Lock className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 mb-2 text-sm lg:text-base">
                        Безопасная сделка
                      </h3>
                      <p className="text-green-800 text-xs leading-relaxed">
                        Ваши средства защищены. Оплата поступит продавцу только после получения и подтверждения товара с вашей стороны.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
      
      <ImagePreview
        images={post.images}
        isOpen={isImagePreviewOpen}
        onClose={() => setIsImagePreviewOpen(false)}
        initialIndex={currentImageIndex}
      />
    </Dialog>
  )
} 