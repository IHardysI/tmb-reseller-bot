"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

import {
  Award,
  Edit,
  MapPin,
  Package,
  Camera,
  Save,
  Star,
  CreditCard,
  Plus,
  Trash2,
  Shield,
  Building,
  User,
  Calendar,
  Settings,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  BanknoteIcon as Bank,
  Lock,
  TrendingUp,
  Eye,
  Heart,
  FileText
} from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { useTelegramUser } from "@/hooks/useTelegramUser"
import { useRouter } from "next/navigation"
import { OptimizedAuthGuard } from '@/components/OptimizedAuthGuard'
import Link from "next/link"
import { PageLoader } from "@/components/ui/loader"
import ProductCard from "@/components/widgets/product-card"
import ProductDetail from "@/components/widgets/product-detail"
import AddItemDialog from "@/components/widgets/create-post"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

interface SellerInfo {
  payout_token: string
  first6: string
  last4: string
  card_type: string
  issuer_name: string
  issuer_country: string
  submittedAt: number
}

function ProfilePageContent() {
  const router = useRouter()
  const telegramUser = useTelegramUser()
  
  const currentUser = useQuery(api.users.getUserByTelegramId, 
    telegramUser?.userId ? { telegramId: telegramUser.userId } : "skip"
  )
  const userPosts = useQuery(api.posts.getUserPosts, 
    telegramUser?.userId ? { telegramId: telegramUser.userId } : "skip"
  )
  
  const updateUserProfile = useMutation(api.users.updateUserProfile)
  const saveSellerPayoutInfo = useMutation(api.users.saveSellerPayoutInfo)
  const likePost = useMutation(api.posts.likePost)
  const unlikePost = useMutation(api.posts.unlikePost)
  const deletePost = useMutation(api.posts.deletePost)

  const [activeTab, setActiveTab] = useState("active")
  const [searchTerm, setSearchTerm] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSellerDialogOpen, setIsSellerDialogOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<Id<"posts"> | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<any>(null)

  const [editForm, setEditForm] = useState({
    firstName: currentUser?.firstName || "",
    lastName: currentUser?.lastName || "",
    city: currentUser?.city || "",
    deliveryAddress: currentUser?.deliveryAddress || "",
    bio: currentUser?.bio || "",
  })

  const [cardData, setCardData] = useState<{
    payout_token: string
    first6: string
    last4: string
    card_type: string
    issuer_name: string
    issuer_country: string
  } | null>(null)
  
  const [widgetError, setWidgetError] = useState<string | null>(null)

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingSellerInfo, setIsSavingSellerInfo] = useState(false)
  const payoutRenderedRef = useRef(false)

  // YooKassa widget initialization
  const initializePayoutWidget = () => {
    if (typeof window !== 'undefined' && (window as any).PayoutsData) {
      const accountId = process.env.NEXT_PUBLIC_YOOKASSA_ACCOUNT_ID
      if (!accountId) {
        console.error('YooKassa account ID not configured')
        setWidgetError('Ошибка конфигурации: не указан ID аккаунта YooKassa')
        return null
      }
      
      return new (window as any).PayoutsData({
        type: 'safedeal',
        account_id: accountId,
        lang: 'ru_RU', // 
        success_callback: (data: any) => {
          setCardData({
            payout_token: data.payout_token,
            first6: data.first6,
            last4: data.last4,
            card_type: data.card_type,
            issuer_name: data.issuer_name,
            issuer_country: data.issuer_country,
          })
          setWidgetError(null)
        },
        error_callback: (error: any) => {
          console.error('YooKassa widget error:', error)
          setWidgetError('Ошибка при обработке данных карты. Попробуйте снова.')
        }
      })
    } else {
      console.error('YooKassa PayoutsData widget not available')
      setWidgetError('Виджет YooKassa не загружен. Обновите страницу.')
    }
    return null
  }

  useEffect(() => {
    if (currentUser) {
      setEditForm({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        city: currentUser.city || "",
        deliveryAddress: currentUser.deliveryAddress || "",
        bio: currentUser.bio || "",
      })
    }
  }, [currentUser])

  useEffect(() => {
    if (!isSellerDialogOpen) {
      payoutRenderedRef.current = false
      return
    }
    if (typeof window !== 'undefined' && (window as any).PayoutsData && !payoutRenderedRef.current) {
      const widget = initializePayoutWidget()
      if (widget) {
        widget.render('yookassa-payout-form')
          .then(() => {
            payoutRenderedRef.current = true
          })
          .catch((error: any) => {
            console.error('Error rendering YooKassa widget:', error)
            setWidgetError('Ошибка при загрузке формы. Попробуйте снова.')
          })
      }
    }
  }, [isSellerDialogOpen])

  if (!telegramUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const userData: UserProfile = {
    id: currentUser?._id || "",
    name: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim(),
    avatar: currentUser?.avatar || "/placeholder.svg",
    trustLevel: currentUser.trustLevel || "bronze",
    rating: currentUser.rating || 0,
    joinDate: currentUser.registeredAt ? new Date(currentUser.registeredAt).toISOString().split('T')[0] : "",
    location: currentUser.city || "",
    totalSales: currentUser.soldCount || 0,
    activeListings: userPosts?.filter(p => p.isActive).length || 0,
    totalViews: currentUser.totalViews || userPosts?.reduce((sum, post) => sum + (post.views || 0), 0) || 0,
    bio: currentUser.bio || "",
    verificationStatus: currentUser.verificationStatus || "unverified",
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

  const stats = {
    activeListings: userPosts?.filter(p => p.isActive).length || 0,
    soldItems: userPosts?.filter(p => !p.isActive).length || 0,
    totalViews: currentUser?.totalViews || 0,
    rating: currentUser?.rating || 0,
  }

  const getProductsByStatus = (isActive: boolean) => {
    return userPosts?.filter(post => post.isActive === isActive) || []
  }

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

  const handleDeletePost = async (postId: string) => {
    if (!telegramUser?.userId) return
    
    try {
      await deletePost({ 
        postId: postId as Id<"posts">, 
        telegramId: telegramUser.userId 
      })
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  const handleSaveProfile = async () => {
    if (!telegramUser?.userId) return
    
    setIsSavingProfile(true)
    try {
      await updateUserProfile({
        telegramId: telegramUser.userId,
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName?.trim() || undefined,
        city: editForm.city?.trim() || "",
        deliveryAddress: editForm.deliveryAddress?.trim() || "",
        bio: editForm.bio?.trim() || undefined,
      })
      
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSaveSellerInfo = async () => {
    if (!cardData) {
      setWidgetError('Пожалуйста, добавьте банковскую карту')
      return
    }
    if (!telegramUser?.userId) return
    
    setIsSavingSellerInfo(true)
    try {
      await saveSellerPayoutInfo({
        telegramId: telegramUser.userId,
        payout_token: cardData.payout_token,
        first6: cardData.first6,
        last4: cardData.last4,
        card_type: cardData.card_type,
        issuer_name: cardData.issuer_name,
        issuer_country: cardData.issuer_country,
      })
      setIsSellerDialogOpen(false)
      setCardData(null)
      setWidgetError(null)
    } catch (error) {
      console.error("Error saving seller info:", error)
      setWidgetError('Ошибка при сохранении данных карты')
    } finally {
      setIsSavingSellerInfo(false)
    }
  }

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case "gold": return "text-yellow-600 bg-yellow-100"
      case "silver": return "text-gray-600 bg-gray-100"
      default: return "text-amber-600 bg-amber-100"
    }
  }

  const getVerificationStatusInfo = (status: string) => {
    switch (status) {
      case "verified":
        return { icon: CheckCircle, color: "text-green-600 bg-green-100", label: "Верифицирован" }
      case "pending":
        return { icon: Clock, color: "text-yellow-600 bg-yellow-100", label: "На проверке" }
      default:
        return { icon: XCircle, color: "text-gray-600 bg-gray-100", label: "Не верифицирован" }
    }
  }

  const verificationInfo = getVerificationStatusInfo(userData.verificationStatus)
  const VerificationIcon = verificationInfo.icon

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-6xl">
      {/* Profile Header */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="relative p-4 sm:p-6">
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push("/terms")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Пользовательское соглашение
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 ring-4 ring-white shadow-lg mx-auto md:mx-0">
              <AvatarImage src={userData.avatar} alt={userData.name} />
              <AvatarFallback className="text-sm sm:text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {userData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3 text-center md:text-left w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{userData.name}</h1>
                  <div className="flex items-center justify-center md:justify-start space-x-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm sm:text-base text-gray-600">{userData.location || "Местоположение не указано"}</span>
                  </div>
                </div>
                
                <div className="flex justify-center md:justify-end space-x-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Edit className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Редактировать</span>
                        <span className="sm:hidden">Изменить</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-md mx-auto">
                      <DialogHeader>
                        <DialogTitle>Редактировать профиль</DialogTitle>
                        <DialogDescription>
                          Обновите информацию о себе
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="firstName">Имя</Label>
                            <Input
                              id="firstName"
                              value={editForm.firstName}
                              onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                              placeholder="Ваше имя"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Фамилия</Label>
                            <Input
                              id="lastName"
                              value={editForm.lastName}
                              onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                              placeholder="Ваша фамилия"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="city">Город</Label>
                          <Input
                            id="city"
                            value={editForm.city}
                            onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                            placeholder="Ваш город"
                          />
                        </div>
                        <div>
                          <Label htmlFor="deliveryAddress">Адрес доставки</Label>
                          <Input
                            id="deliveryAddress"
                            value={editForm.deliveryAddress}
                            onChange={(e) => setEditForm({...editForm, deliveryAddress: e.target.value})}
                            placeholder="Адрес для доставки"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bio">О себе</Label>
                          <Textarea
                            id="bio"
                            value={editForm.bio}
                            onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                            placeholder="Расскажите о себе"
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                          Отмена
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                          {isSavingProfile ? "Сохранение..." : "Сохранить"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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

      {/* YooKassa Escrow Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Buyer Protection Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                Информация
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Защита покупателей</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                <p className="mb-1">✓ Деньги заморожены до получения товара</p>
                <p className="mb-1">✓ Возврат при проблемах</p>
                <p>✓ Поддержка споров через платформу</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seller Payout Card */}
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Bank className="h-5 w-5 text-green-600" />
              <span className="text-sm sm:text-base">Выплаты продавцам</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">Банковская карта</p>
                  <p className="text-xs text-gray-600">
                    {currentUser.sellerInfo 
                      ? `${currentUser.sellerInfo.card_type} ${currentUser.sellerInfo.first6}••••${currentUser.sellerInfo.last4}`
                      : 'Добавьте банковскую карту'
                    }
                  </p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={currentUser.sellerInfo 
                  ? "text-green-600 border-green-200"
                  : "text-amber-600 border-amber-200"
                }
              >
                {currentUser.sellerInfo ? 'Готово' : 'Требуется'}
              </Badge>
            </div>
            
            <div className="flex space-x-2">
              <Dialog open={isSellerDialogOpen} onOpenChange={setIsSellerDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    {currentUser.sellerInfo ? 'Изменить' : 'Настроить'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Банковская карта для выплат</DialogTitle>
                    <DialogDescription>
                      Добавьте банковскую карту для получения выплат через YooKassa
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <p className="text-sm font-medium mb-3">Введите данные банковской карты:</p>
                      <div 
                        id="yookassa-payout-form" 
                        className="border rounded-lg p-4 min-h-[200px] bg-gray-50"
                      />
                      {widgetError && (
                        <p className="text-red-500 text-xs mt-2">{widgetError}</p>
                      )}
                      {cardData && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            ✓ Карта добавлена: {cardData.card_type} {cardData.first6}••••{cardData.last4}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 bg-green-50 p-3 rounded-lg mb-3">
                      <p className="mb-2"><CreditCard className="h-3 w-3 inline mr-1" />Поддерживаемые карты:</p>
                      <p className="mb-1">• Российские банковские карты (Visa, MasterCard)</p>
                      <p className="mb-1">• Карты национальной платёжной системы МИР</p>
                      <p>• Карты, выпущенные российскими банками</p>
                    </div>
                    <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                      <p className="mb-2"><Lock className="h-3 w-3 inline mr-1" />Безопасность данных:</p>
                      <p className="mb-1">• Данные карты обрабатываются по стандарту PCI DSS</p>
                      <p className="mb-1">• YooKassa хранит данные в зашифрованном виде</p>
                      <p className="mb-1">• Мы получаем только синоним карты для выплат</p>
                      <p>• Полный номер карты недоступен нашему сервису</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsSellerDialogOpen(false)
                        setCardData(null)
                        setWidgetError(null)
                      }} 
                      className="w-full sm:w-auto"
                    >
                      Отмена
                    </Button>
                    <Button 
                      onClick={handleSaveSellerInfo} 
                      disabled={isSavingSellerInfo || !cardData} 
                      className="w-full sm:w-auto"
                    >
                      {isSavingSellerInfo ? "Сохранение..." : "Сохранить карту"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span className="text-lg sm:text-xl">Мои товары</span>
            </CardTitle>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Добавить товар</span>
              <span className="sm:hidden">Добавить</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
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
              <TabsTrigger value="liked" className="flex items-center justify-center space-x-1 p-2 text-xs sm:text-sm">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Избранное</span>
                <span className="sm:hidden">Избр.</span>
                <span>({userPosts?.filter(p => p.likedBy?.includes(currentUser?._id as any)).length || 0})</span>
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

            {["active", "sold", "liked"].map(tab => (
              <TabsContent key={tab} value={tab} className="mt-6">
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                      {tab === "liked" ? "Нет избранных товаров" : 
                       tab === "sold" ? "Нет проданных товаров" : 
                       "Нет активных товаров"}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
                      {tab === "liked" ? "Добавьте товары в избранное, чтобы они появились здесь" :
                       tab === "sold" ? "Проданные товары будут отображаться здесь" :
                       "Начните продавать, добавив свой первый товар"}
                    </p>
                    {tab === "active" && (
                      <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить первый товар
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {filteredPosts.map((post) => {
                      const mappedProduct = mapPostToProduct(post, true, isFavorited(post._id))
                      return (
                        <ProductCard
                          key={post._id}
                          product={mappedProduct}
                          onProductClick={() => setSelectedPostId(post._id)}
                          onToggleFavorite={handleToggleFavorite}
                          onDelete={handleDeletePost}
                          onEdit={(product: any) => {
                            setEditingPost(post)
                            setIsCreateDialogOpen(true)
                          }}
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

      {/* Create/Edit Product Modal */}
      <AddItemDialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false)
          setEditingPost(null)
        }}
        editingPost={editingPost}
      />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <OptimizedAuthGuard>
      <ProfilePageContent />
    </OptimizedAuthGuard>
  )
} 