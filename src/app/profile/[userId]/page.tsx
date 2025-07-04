"use client"

import { useState, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  Award,
  ArrowLeft,
  MapPin,
  Package,
  Star,
  Calendar,
  Eye,
  TrendingUp,
  Shield,
  ShieldCheck,
  Clock,
} from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { useTelegramUser } from "@/hooks/useTelegramUser"
import { useRouter } from "next/navigation"
import { PageLoader } from "@/components/ui/loader"
import ProductCard from "@/components/widgets/product-card"
import ProductDetail from "@/components/widgets/product-detail"

interface UserProfilePageProps {
  params: Promise<{
    userId: string
  }>
  searchParams: Promise<{
    backToChatId?: string
  }>
}

export default function UserProfilePage({ params, searchParams }: UserProfilePageProps) {
  const router = useRouter()
  const telegramUser = useTelegramUser()
  const resolvedParams = use(params)
  const resolvedSearchParams = use(searchParams)
  const { userId } = resolvedParams
  const { backToChatId } = resolvedSearchParams
  
  const [selectedPostId, setSelectedPostId] = useState<Id<"posts"> | null>(null)

  const currentUser = useQuery(
    api.users.getUserByTelegramId, 
    telegramUser?.userId ? { telegramId: telegramUser.userId } : "skip"
  )

  const profileUser = useQuery(
    api.users.getUserById,
    userId ? { userId: userId as Id<"users"> } : "skip"
  )

  const userPosts = useQuery(
    api.posts.getUserPostsByUserId,
    userId ? { userId: userId as Id<"users"> } : "skip"
  )



  const handleBack = () => {
    if (backToChatId) {
      router.push(`/messages/${backToChatId}`)
    } else {
      router.back()
    }
  }

  const getTrustIcon = (trust: string) => {
    const colors = {
      bronze: "text-amber-600",
      silver: "text-gray-500", 
      gold: "text-yellow-500",
    }
    return <Award className={`h-5 w-5 ${colors[trust as keyof typeof colors]}`} />
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Проверен
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            На проверке
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <Shield className="h-3 w-3 mr-1" />
            Не проверен
          </Badge>
        )
    }
  }

  const formatLastOnline = (isOnline: boolean, lastOnline?: number) => {
    if (isOnline) {
      return "В сети"
    }
    
    if (!lastOnline) {
      return "Был в сети давно"
    }
    
    const now = Date.now()
    const timeDiff = now - lastOnline
    const minutes = Math.floor(timeDiff / 60000)
    const hours = Math.floor(timeDiff / 3600000)
    const days = Math.floor(timeDiff / 86400000)
    
    if (minutes < 60) {
      if (minutes < 5) {
        return "Был в сети недавно"
      }
      return `Был в сети ${minutes} мин. назад`
    }
    
    if (hours < 24) {
      return `Был в сети ${hours} ч. назад`
    }
    
    if (days === 1) {
      return "Был в сети вчера"
    }
    
    return `Был в сети ${days} дн. назад`
  }

  const mapPostToProduct = (post: any, isOwned: boolean, isFavorite: boolean) => ({
    id: post._id,
    sellerId: post.userId,
    name: post.name,
    brand: post.brand || "Без бренда",
    price: post.price,
    images: post.images,
    condition: post.condition,
    year: post.year,
    description: post.description,
    category: post.category || "",
    subcategory: post.subcategory,
    defects: post.defects.map((d: any) => ({
      description: d.description,
      location: d.location,
    })),
    isFavorite,
    aiRating: post.aiRating,
    aiRecommendation: post.aiRecommendation,
    aiExplanation: post.aiExplanation,
    sellerName: post.sellerName,
    sellerCity: post.sellerCity,
    likesCount: post.likesCount,
    views: post.views,
    isOwned,
  })

  const getFilteredItems = () => {
    if (!userPosts) return []
    
    // Only show active items for other users' profiles
    return userPosts
      .filter(post => post.isActive)
      .map(post => mapPostToProduct(
        post,
        false,
        currentUser && post.likedBy?.includes(currentUser._id) || false
      ))
  }

  const filteredItems = getFilteredItems()

  const likePost = useMutation(api.posts.likePost)
  const unlikePost = useMutation(api.posts.unlikePost)

  const handleProductClick = (product: any) => {
    setSelectedPostId(product.id)
  }

  const handleToggleFavorite = async (productId: string) => {
    if (!telegramUser?.userId) return
    
    const product = filteredItems.find(p => p.id === productId)
    if (!product) return
    
    try {
      if (product.isFavorite) {
        await unlikePost({ postId: productId as Id<"posts">, telegramId: telegramUser.userId })
      } else {
        await likePost({ postId: productId as Id<"posts">, telegramId: telegramUser.userId })
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  if (!telegramUser) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader text="" />
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader text="" />
      </div>
    )
  }

  // Check online status
  const now = Date.now()
  const lastOnline = profileUser?.lastOnline || 0
  const timeDiff = now - lastOnline
  const isOnline = timeDiff <= 300000 // 5 minutes = online

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-semibold text-lg">Профиль пользователя</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32 relative">
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            <div className="p-6 -mt-16 relative">
              <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 space-y-4 sm:space-y-0">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src={profileUser?.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {profileUser?.firstName?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 border-2 border-white rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                        <span>{`${profileUser?.firstName || ''} ${profileUser?.lastName || ''}`.trim()}</span>
                        {getTrustIcon(profileUser?.trustLevel || "bronze")}
                      </h1>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatLastOnline(isOnline, profileUser?.lastOnline)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                      {getVerificationBadge(profileUser?.verificationStatus || "unverified")}
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{profileUser?.rating || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profileUser?.city || "Не указано"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>С {new Date(profileUser?.registeredAt || 0).toLocaleDateString("ru-RU")}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {profileUser?.bio && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">{profileUser.bio}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Продано</p>
                  <p className="text-xl font-bold text-gray-900">{profileUser?.soldCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">На продаже</p>
                  <p className="text-xl font-bold text-gray-900">{userPosts ? userPosts.filter(p => p.isActive).length : 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Просмотры</p>
                  <p className="text-xl font-bold text-gray-900">{profileUser?.totalViews || (userPosts ? userPosts.reduce((sum, post) => sum + (post.views || 0), 0) : 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Star className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Рейтинг</p>
                  <p className="text-xl font-bold text-gray-900">{profileUser?.rating || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Товары на продаже</span>
              <Badge variant="secondary" className="ml-2">
                {userPosts ? userPosts.filter(p => p.isActive).length : 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onProductClick={handleProductClick}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </div>
            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg font-medium">Нет товаров на продаже</p>
                <p className="text-gray-400 text-sm mt-2">Пользователь пока не выставил товары на продажу</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedPostId && (
        <ProductDetail
          postId={selectedPostId}
          isOpen={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </div>
  )
} 