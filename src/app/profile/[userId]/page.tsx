"use client"

import { useState, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

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
  CheckCircle,
  XCircle,
  Heart,
  DollarSign,
  BanknoteIcon as Bank,
  Lock,
  Building,
} from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { useTelegramUser } from "@/hooks/useTelegramUser"
import { useRouter } from "next/navigation"
import { PageLoader } from "@/components/ui/loader"
import ProductCard from "@/components/widgets/product-card"
import ProductDetail from "@/components/widgets/product-detail"

interface UserProfile {
  id: string
  name: string
  avatar: string
  trustLevel: "bronze" | "silver" | "gold"
  rating: number
  joinDate: string
  location: string
  totalSales: number
  activeListings: number
  totalViews: number
  bio: string
  verificationStatus: "verified" | "pending" | "unverified"
}

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
  const [activeTab, setActiveTab] = useState("active")
  const [searchTerm, setSearchTerm] = useState("")

  const currentUser = useQuery(
    api.users.getUserByTelegramId,
    telegramUser?.userId ? { telegramId: telegramUser.userId } : "skip"
  )

  const viewedUser = useQuery(api.users.getUserById, { userId: userId as Id<"users"> })
  const userPosts = useQuery(api.posts.getUserPostsByUserId, { userId: userId as Id<"users"> })

  // Move hooks before early return
  const likePost = useMutation(api.posts.likePost)
  const unlikePost = useMutation(api.posts.unlikePost)

  if (!viewedUser || !userPosts) {
    return <PageLoader />
  }

  const userData: UserProfile = {
    id: viewedUser._id,
    name: `${viewedUser.firstName} ${viewedUser.lastName || ''}`.trim(),
    avatar: viewedUser.avatar || "/placeholder.svg",
    trustLevel: viewedUser.trustLevel || "bronze",
    rating: viewedUser.rating || 0,
    joinDate: viewedUser.registeredAt ? new Date(viewedUser.registeredAt).toISOString().split('T')[0] : "",
    location: viewedUser.city || "",
    totalSales: viewedUser.soldCount || 0,
    activeListings: userPosts?.filter(p => p.isActive).length || 0,
    totalViews: viewedUser.totalViews || userPosts?.reduce((sum, post) => sum + (post.views || 0), 0) || 0,
    bio: viewedUser.bio || "",
    verificationStatus: viewedUser.verificationStatus || "unverified",
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
    isOwned,
    likesCount: post.likesCount || 0,
    views: post.views || 0,
    sellerName: post.sellerName,
    sellerCity: post.sellerCity,
    aiRating: post.aiRating,
    aiRecommendation: post.aiRecommendation,
    aiExplanation: post.aiExplanation,
  })

  const filteredPosts = userPosts?.filter(post => {
    const matchesStatus = activeTab === "active" ? post.isActive : !post.isActive
    if (!matchesStatus) return false
    
    const searchLower = searchTerm.toLowerCase()
    return (
      post.name.toLowerCase().includes(searchLower) ||
      post.brand?.toLowerCase().includes(searchLower) ||
      post.category.toLowerCase().includes(searchLower) ||
      post.description.toLowerCase().includes(searchLower)
    )
  }) || []

  const isFavorited = (productId: string): boolean => {
    const post = userPosts?.find(p => p._id === productId)
    if (!post || !currentUser) return false
    return post.likedBy?.includes(currentUser._id) || false
  }

  const handleToggleFavorite = async (productId: string) => {
    if (!telegramUser?.userId) return
    
    const post = userPosts?.find(p => p._id === productId)
    if (!post || !currentUser) return
    
    try {
      const isLiked = post.likedBy?.includes(currentUser._id)
      if (isLiked) {
        await unlikePost({ postId: productId as Id<"posts">, telegramId: telegramUser.userId! })
      } else {
        await likePost({ postId: productId as Id<"posts">, telegramId: telegramUser.userId! })
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  const handleProductClick = (product: any) => {
    setSelectedPostId(product._id)
  }

  const isOwnProfile = currentUser?._id === userId

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-6xl">
      {/* Back Button */}
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={() => backToChatId ? router.push(`/messages/${backToChatId}`) : router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
      </div>

      {/* Profile Header */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 ring-4 ring-white shadow-lg mx-auto md:mx-0">
              <AvatarImage src={userData.avatar} alt={userData.name} />
              <AvatarFallback className="text-sm sm:text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {userData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3 text-center md:text-left w-full">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{userData.name}</h1>
                <div className="flex items-center justify-center md:justify-start space-x-2 mt-1">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm sm:text-base text-gray-600">{userData.location || "Местоположение не указано"}</span>
                </div>
              </div>

              {/* User badges and trust indicators */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <Badge variant="outline" className="text-amber-600 border-amber-200">
                  <Award className="h-3 w-3 mr-1" />
                  {userData.trustLevel === "bronze" ? "🥉" : userData.trustLevel === "silver" ? "🥈" : "🥇"} 
                  {userData.trustLevel.charAt(0).toUpperCase() + userData.trustLevel.slice(1)}
                </Badge>
                <Badge variant="outline" className={
                  userData.verificationStatus === "verified" ? "text-green-600 border-green-200" :
                  userData.verificationStatus === "pending" ? "text-amber-600 border-amber-200" :
                  "text-gray-600 border-gray-200"
                }>
                  {userData.verificationStatus === "verified" ? <CheckCircle className="h-3 w-3 mr-1" /> :
                   userData.verificationStatus === "pending" ? <Clock className="h-3 w-3 mr-1" /> :
                   <XCircle className="h-3 w-3 mr-1" />}
                  {userData.verificationStatus === "verified" ? "Верифицирован" :
                   userData.verificationStatus === "pending" ? "На проверке" : "Не верифицирован"}
                </Badge>
              </div>

              {/* Bio */}
              {userData.bio && (
                <p className="text-sm sm:text-base text-gray-700 mt-3 leading-relaxed">
                  {userData.bio}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{userData.activeListings}</div>
            <div className="text-xs sm:text-sm text-gray-600">Активных товаров</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{userData.totalSales}</div>
            <div className="text-xs sm:text-sm text-gray-600">Продано</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{userData.totalViews}</div>
            <div className="text-xs sm:text-sm text-gray-600">Просмотров</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{userData.rating.toFixed(1)}</div>
            <div className="text-xs sm:text-sm text-gray-600">Рейтинг</div>
          </CardContent>
        </Card>
      </div>

     
      {/* Products Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span className="text-lg sm:text-xl">Товары продавца</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="active" className="flex items-center justify-center space-x-1 p-2 text-xs sm:text-sm">
                <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Активные</span>
                <span className="sm:hidden">Акт.</span>
                <span>({userPosts?.filter(p => p.isActive).length})</span>
              </TabsTrigger>
              <TabsTrigger value="sold" className="flex items-center justify-center space-x-1 p-2 text-xs sm:text-sm">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Проданные</span>
                <span className="sm:hidden">Прод.</span>
                <span>({userPosts?.filter(p => !p.isActive && p.soldAt).length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Search Bar */}
            <div className="mt-4 mb-6">
              <div className="relative">
                <Input
                  placeholder="Поиск товаров..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Package className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {["active", "sold"].map(tab => (
              <TabsContent key={tab} value={tab} className="mt-6">
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                      {tab === "sold" ? "Нет проданных товаров" : "Нет активных товаров"}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 px-4">
                      {tab === "sold" ? "У продавца пока нет проданных товаров" : "У продавца пока нет активных товаров"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {filteredPosts.map((post) => {
                      const mappedProduct = mapPostToProduct(post, false, isFavorited(post._id))
                      return (
                        <ProductCard
                          key={post._id}
                          product={mappedProduct}
                          onProductClick={() => setSelectedPostId(post._id)}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Product Detail Modal */}
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