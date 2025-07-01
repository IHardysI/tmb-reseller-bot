"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { Id } from "@/../convex/_generated/dataModel"
import { useTelegramUser } from "@/hooks/useTelegramUser"
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
}

export default function ProductDetail({ postId, isOpen, onClose, onEdit, onDelete }: ProductDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLiking, setIsLiking] = useState(false)
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const telegramUser = useTelegramUser()
  
  const post = useQuery(api.posts.getPostById, postId ? { postId } : "skip")
  const currentUser = useQuery(
    api.users.getUserByTelegramId, 
    telegramUser?.userId ? { telegramId: telegramUser.userId } : "skip"
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
    setCurrentImageIndex((prev) => (prev + 1) % post.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length)
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

  const isLiked = currentUser && post.likedBy?.includes(currentUser._id) || false
  const isOwned = currentUser && post.telegramId === telegramUser?.userId || false
  const likesCount = post.likesCount || 0
  const viewsCount = post.views || 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl! w-[95vw] h-[95vh] p-0 overflow-hidden">
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
                    onClick={() => onEdit(post)}
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
          <div className="px-3 lg:px-6 py-2 lg:py-3 space-y-4 lg:space-y-8">
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
                      className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 shadow-xl border-gray-300 h-8 w-8 lg:h-12 lg:w-12 z-10"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4 lg:h-6 lg:w-6 text-gray-700" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 shadow-xl border-gray-300 h-8 w-8 lg:h-12 lg:w-12 z-10"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4 lg:h-6 lg:w-6 text-gray-700" />
                    </Button>
                  </>
                )}
                
                <div className="absolute bottom-2 lg:bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-2 lg:px-4 rounded-full text-sm lg:text-lg font-medium leading-none">
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
                <Button size="sm" className="w-1/2 px-6 h-10 text-sm lg:px-12 lg:h-14 lg:text-lg font-semibold">
                  <ShoppingCart className="h-4 w-4 lg:h-6 lg:w-6 mr-2 lg:mr-3" />
                  <span className="hidden sm:inline">Добавить в корзину</span>
                  <span className="sm:hidden">В корзину</span>
                </Button>
                <Button variant="outline" size="sm" className="w-1/2 px-6 h-10 text-sm lg:px-12 lg:h-14 lg:text-lg font-semibold">
                  <MessageCircle className="h-4 w-4 lg:h-6 lg:w-6 mr-2 lg:mr-3" />
                  <span className="hidden sm:inline">Написать продавцу</span>
                  <span className="sm:hidden">Написать</span>
                </Button>
              </div>
            )}

            {/* Product Info */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="px-4 lg:px-8">
                <div className="space-y-3">
                  <div>
                    <h1 className="font-bold text-xl lg:text-4xl leading-tight mb-2 lg:mb-4 mt-0!">{post.name}</h1>
                    <div className="flex items-center gap-2 lg:gap-4 text-gray-600 text-sm lg:text-xl flex-wrap">
                      <span className="font-semibold text-blue-600 text-base lg:text-2xl">{post.brand}</span>
                      <span className="w-1 h-1 lg:w-2 lg:h-2 bg-gray-400 rounded-full"></span>
                      <span>{post.year} год</span>
                      <span className="w-1 h-1 lg:w-2 lg:h-2 bg-gray-400 rounded-full"></span>
                      <span className="capitalize">{post.condition}</span>
                      {post.category && (
                        <>
                          <span className="w-1 h-1 lg:w-2 lg:h-2 bg-gray-400 rounded-full"></span>
                          <Badge variant="secondary" className="text-xs lg:text-sm whitespace-nowrap">
                            {post.category}
                            {post.subcategory && ` • ${post.subcategory}`}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <span className="font-bold text-2xl lg:text-5xl">{post.price.toLocaleString()} ₽</span>
                      <Lock className="h-5 w-5 lg:h-8 lg:w-8 text-green-600" />
                    </div>
                  </div>

                  {post.aiRating && post.aiRecommendation && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 lg:space-x-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 lg:h-6 lg:w-6 ${i < Math.floor(post.aiRating!) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="text-green-600 font-semibold text-sm lg:text-lg">{post.aiRecommendation}</span>
                        <span className="font-bold text-base lg:text-xl">{post.aiRating!.toFixed(1)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-gray-600 text-sm lg:text-lg">
                    <div className="flex items-center space-x-4 lg:space-x-8">
                      <div className="flex items-center space-x-1 lg:space-x-2">
                        <Eye className="h-4 w-4 lg:h-5 lg:w-5" />
                        <span>{viewsCount}</span>
                      </div>
                      <button
                        onClick={handleToggleLike}
                        disabled={isLiking}
                        className={`flex items-center space-x-1 lg:space-x-2 transition-all hover:scale-105 ${
                          isLiked ? "text-red-500" : "hover:text-red-500"
                        } ${isLiking ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <Heart className={`h-4 w-4 lg:h-5 lg:w-5 ${isLiked ? "fill-current" : ""} ${isLiking ? "animate-pulse" : ""}`} />
                        <span>{likesCount}</span>
                      </button>
                    </div>
                    <span className="text-xs lg:text-base">{new Date(post.createdAt).toLocaleDateString("ru-RU")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="px-3 lg:px-6">
                <CardTitle className="text-base lg:text-2xl">Описание товара</CardTitle>
              </CardHeader>
              <CardContent className="px-4 lg:px-8">
                <p className="text-gray-700 leading-relaxed text-sm lg:text-lg whitespace-pre-wrap break-words overflow-wrap-anywhere max-w-full" style={{ 
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
              <Card className="border-2 border-blue-200 bg-blue-50/30 overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="px-3 lg:px-6 py-2 lg:py-3">
                  <CardTitle className="flex items-center gap-2 lg:gap-3 text-sm lg:text-lg">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <Star className="h-3 w-3 lg:h-4 lg:w-4 text-white fill-current" />
                    </div>
                    <span className="text-sm lg:text-base">Подробная оценка ИИ</span>
                    <div className="flex items-center gap-1 lg:gap-2 ml-auto">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 lg:h-4 lg:w-4 ${
                            i < Math.floor(post.aiRating!) 
                              ? "text-yellow-400 fill-current" 
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="font-bold text-sm lg:text-lg ml-1">
                        {post.aiRating!.toFixed(1)}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 lg:px-6">
                  <p className="text-gray-700 leading-relaxed text-sm lg:text-base break-words overflow-wrap-anywhere max-w-full" style={{ 
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
              <Card className="border-orange-200 bg-orange-50/30 overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="px-3 lg:px-6 py-2 lg:py-3">
                  <CardTitle className="flex items-center gap-2 text-sm lg:text-lg text-orange-800">
                    <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5" />
                    Замеченные дефекты
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 lg:px-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                    {post.defects.map((defect, index) => (
                      <div key={index} className="flex gap-2 lg:gap-3 p-3 lg:p-4 bg-white rounded-lg border border-orange-200">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-orange-900 mb-1 text-sm lg:text-base break-words overflow-wrap-anywhere" style={{ 
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                          }}>
                            {defect.location}
                          </h4>
                          <p className="text-gray-700 text-xs lg:text-sm leading-relaxed break-words overflow-wrap-anywhere" style={{ 
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
                <CardHeader className="px-3 lg:px-6 lg:py-3">
                  <CardTitle className="text-sm lg:text-lg">Продавец</CardTitle>
                </CardHeader>
                <CardContent className="px-3 lg:px-6">
                  <div className="flex items-start gap-3 lg:gap-4">
                    <Avatar className="h-10 w-10 lg:h-14 lg:w-14">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="text-sm lg:text-lg font-semibold">
                        {post.sellerName?.charAt(0) || 'П'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm lg:text-lg text-gray-900">
                        {post.sellerName}
                      </h3>
                      {post.sellerCity && (
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <MapPin className="h-3 w-3 lg:h-4 lg:w-4" />
                          <span className="text-xs lg:text-sm">{post.sellerCity}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-amber-600">
                        <span className="text-sm lg:text-lg">🥉</span>
                        <span className="font-medium text-xs lg:text-sm">Новый продавец</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Safety Info */}
              <Card className="border-green-200 bg-green-50/30 overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="px-3 lg:px-6 lg:py-4">
                  <div className="flex items-start gap-2 lg:gap-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Lock className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 mb-2 text-sm lg:text-base">
                        Безопасная сделка
                      </h3>
                      <p className="text-green-800 text-xs lg:text-sm leading-relaxed">
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