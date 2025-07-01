"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SidebarTrigger } from "@/components/widgets/sidebar"
import {
  Award,
  Edit,
  MapPin,
  Package,
  Camera,
  Save,
  Star,
} from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { useTelegramUser } from "@/hooks/useTelegramUser"
import { useRouter } from "next/navigation"
import { AuthGuard } from '@/components/AuthGuard'
import Link from "next/link"
import Header from "@/components/widgets/header"
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

interface Product {
  id: string
  name: string
  brand: string
  price: number
  images: string[]
  condition: string
  year: number
  aiRating?: number
  aiRecommendation?: string
  aiExplanation?: string
  isFavorite: boolean
  description: string
  category: string
  subcategory?: string
  defects: {
    description: string
    location: string
  }[]
  sellerName?: string
  sellerCity?: string
  likesCount?: number
  views?: number
  isOwned?: boolean
  status?: "active" | "sold" | "draft"
}

function ProfilePageContent() {
  const router = useRouter()
  const telegramUser = useTelegramUser()
  const currentUser = useQuery(
    api.users.getUserByTelegramId, 
    telegramUser?.userId ? { telegramId: telegramUser.userId } : "skip"
  )
  const userPosts = useQuery(
    api.posts.getUserPosts,
    telegramUser?.userId ? { telegramId: telegramUser.userId } : "skip"
  ) || []
  const likedPosts = useQuery(
    api.posts.getLikedPosts,
    telegramUser?.userId ? { telegramId: telegramUser.userId } : "skip"
  ) || []
  
  const deletePost = useMutation(api.posts.deletePost)
  const updateUserProfile = useMutation(api.users.updateUserProfile)
  const generateUploadUrl = useMutation(api.users.generateUploadUrl)
  const updateUserAvatar = useMutation(api.users.updateUserAvatar)
  const refreshUserAvatarUrl = useMutation(api.users.refreshUserAvatarUrl)
  const likePost = useMutation(api.posts.likePost)
  const unlikePost = useMutation(api.posts.unlikePost)
  
  const [activeTab, setActiveTab] = useState("active")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<Id<"posts"> | null>(null)
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    city: "",
    deliveryAddress: "",
    bio: "",
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  if (!currentUser) {
    return <PageLoader text="Загрузка профиля..." />
  }

  const userData: UserProfile = {
    id: currentUser._id,
    name: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim(),
    avatar: currentUser.avatar || "/placeholder.svg",
    trustLevel: currentUser.trustLevel || "bronze",
    rating: currentUser.rating || 0,
    joinDate: new Date(currentUser.registeredAt).toISOString().split('T')[0],
    location: currentUser.city || "",
    totalSales: currentUser.soldCount || 0,
    activeListings: userPosts.filter(p => p.isActive).length,
    totalViews: currentUser.totalViews || userPosts.reduce((sum, post) => sum + (post.views || 0), 0),
    bio: currentUser.bio || "",
    verificationStatus: currentUser.verificationStatus || "unverified",
  }

  const userItems: Product[] = userPosts.map(post => ({
    id: post._id,
    name: post.name,
    brand: post.brand || "Без бренда",
    price: post.price,
    images: post.images,
    condition: post.condition,
    year: post.year,
    aiRating: post.aiRating || 0,
    aiRecommendation: post.aiRecommendation || "Цена адекватна",
    views: post.views || 0,
    likesCount: post.likesCount || 0,
    status: post.isActive ? "active" : post.soldAt ? "sold" : "draft",
    description: post.description,
    category: post.category || "",
    subcategory: post.subcategory,
    defects: post.defects || [],
    isFavorite: currentUser && post.likedBy?.includes(currentUser._id) || false,
    isOwned: true,
    sellerName: currentUser?.firstName,
    sellerCity: currentUser?.city,
  }))

  const likedItems: Product[] = likedPosts.map(post => ({
    id: post._id,
    name: post.name,
    brand: post.brand || "Без бренда",
    price: post.price,
    images: post.images,
    condition: post.condition,
    year: post.year,
    aiRating: post.aiRating || 0,
    aiRecommendation: post.aiRecommendation || "Цена адекватна",
    views: post.views || 0,
    likesCount: post.likesCount || 0,
    status: post.isActive ? "active" : post.soldAt ? "sold" : "draft",
    description: post.description,
    category: post.category || "",
    subcategory: post.subcategory,
    defects: post.defects || [],
    isFavorite: true,
    isOwned: currentUser && post.telegramId === telegramUser?.userId || false,
    sellerName: currentUser && post.telegramId === telegramUser?.userId 
      ? currentUser.firstName 
      : "Продавец",
    sellerCity: currentUser && post.telegramId === telegramUser?.userId 
      ? currentUser.city || "Город"
      : "Город",
  }))

  const getFilteredItems = () => {
    switch (activeTab) {
      case "liked":
        return likedItems
      case "active":
        return userItems.filter(item => item.status === "active")
      case "sold":
        return userItems.filter(item => item.status === "sold")
      default:
        return userItems.filter(item => item.status === "active")
    }
  }

  const filteredItems = getFilteredItems()

  const handleProductClick = (product: Product) => {
    setSelectedPostId(product.id as Id<"posts">)
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

  const handleEditItem = (product: Product) => {
    console.log("Edit item:", product.id)
  }

  const handleDeleteItem = async (productId: string) => {
    if (!telegramUser?.userId) return
    try {
      await deletePost({ postId: productId as any, telegramId: telegramUser.userId })
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  const handleBack = () => {
    router.push("/")
  }

  const handleEditProfile = () => {
    setEditForm({
      firstName: currentUser.firstName,
      lastName: currentUser.lastName || "",
      city: currentUser.city || "",
      deliveryAddress: currentUser.deliveryAddress || "",
      bio: currentUser.bio || "",
    })
    setAvatarFile(null)
    setAvatarPreview(null)
    setIsEditDialogOpen(true)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const uploadAvatar = async () => {
    if (!avatarFile || !telegramUser?.userId) return null

    try {
      setIsUploadingAvatar(true)
      console.log("Starting avatar upload...")
      
      const uploadUrl = await generateUploadUrl()
      console.log("Got upload URL:", uploadUrl)
      
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": avatarFile.type },
        body: avatarFile,
      })

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`)
      }

      const { storageId } = await result.json()
      console.log("File uploaded, storage ID:", storageId)
      
      const updateResult = await updateUserAvatar({ telegramId: telegramUser.userId, avatarStorageId: storageId })
      console.log("Avatar updated in database:", updateResult)
      
      // Try to refresh the avatar URL as a fallback
      try {
        await refreshUserAvatarUrl({ telegramId: telegramUser.userId })
        console.log("Avatar URL refreshed successfully")
      } catch (error) {
        console.log("Error refreshing avatar URL:", error)
      }
      
      return storageId
    } catch (error) {
      console.error("Error uploading avatar:", error)
      throw error
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!telegramUser?.userId) return
    
    try {
      setIsSavingProfile(true)
      
      // Upload avatar first if there's a new one
      if (avatarFile) {
        await uploadAvatar()
      }

      await updateUserProfile({
        telegramId: telegramUser.userId,
        firstName: editForm.firstName,
        lastName: editForm.lastName || undefined,
        city: editForm.city,
        deliveryAddress: editForm.deliveryAddress,
        bio: editForm.bio || undefined,
      })
      
      // Clear avatar preview and file to show updated avatar from database
      setAvatarFile(null)
      setAvatarPreview(null)
      
      // Small delay to allow Convex query to refresh with new data
      setTimeout(() => {
        setIsEditDialogOpen(false)
        setIsSavingProfile(false)
      }, 1000)
      
    } catch (error) {
      console.error("Error updating profile:", error)
      setIsSavingProfile(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Мой профиль" />

      <div className="max-w-6xl mx-auto p-2 md:p-4 space-y-4 md:space-y-6">
        <Card className="overflow-hidden py-0!">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-20 md:h-32"></div>
          <CardContent className="relative pt-0 pb-4 md:pb-6 px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end md:gap-6 -mt-10 md:-mt-16">
              <div className="relative mx-auto md:mx-0">
                <Avatar className="h-20 w-20 md:h-32 md:w-32 border-4 border-white shadow-lg">
                  <AvatarImage 
                    src={userData.avatar || "/placeholder.svg"} 
                    className="object-cover object-center w-full h-full"
                  />
                  <AvatarFallback className="text-lg md:text-2xl font-bold">
                    {userData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {userData.verificationStatus === "verified" && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 mt-6 md:mt-0 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="space-y-3">
                    <h2 className="text-xl md:text-3xl font-bold text-gray-900">{userData.name}</h2>
                    <div className="flex items-center justify-center md:justify-start space-x-2">
                      <Award className="h-5 w-5 text-amber-600" />
                      <span className="text-xs md:text-sm font-medium text-gray-600">
                        {userData.trustLevel === "bronze" ? "Бронзовый продавец" : 
                         userData.trustLevel === "silver" ? "Серебряный продавец" : 
                         "Золотой продавец"}
                      </span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start space-x-4 text-xs md:text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 md:h-4 md:w-4 ${i < Math.floor(userData.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="font-medium">{userData.rating > 0 ? userData.rating : "Нет оценок"}</span>
                      </div>
                    </div>
                  </div>

                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="mt-4 md:mt-0 w-full md:w-auto" size="sm" onClick={handleEditProfile}>
                        <Edit className="h-4 w-4 mr-2" />
                        Редактировать профиль
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Редактировать профиль</DialogTitle>
                        <DialogDescription>
                          Обновите информацию о себе, загрузите аватар и укажите контактные данные
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <div className="relative">
                            <Avatar className="h-20 w-20">
                              <AvatarImage 
                                src={avatarPreview || userData.avatar || "/placeholder.svg"} 
                                className="object-cover object-center w-full h-full"
                              />
                              <AvatarFallback>{userData.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                            </Avatar>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                              id="avatar-upload"
                            />
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                              onClick={() => document.getElementById('avatar-upload')?.click()}
                              disabled={isUploadingAvatar}
                            >
                              {isUploadingAvatar ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                              ) : (
                                <Camera className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="firstName">Имя</Label>
                            <Input
                              id="firstName"
                              value={editForm.firstName}
                              onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Фамилия</Label>
                            <Input
                              id="lastName"
                              value={editForm.lastName}
                              onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="city">Город</Label>
                          <Input
                            id="city"
                            value={editForm.city}
                            placeholder="Укажите ваш город"
                            onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="address">Адрес доставки</Label>
                          <Input
                            id="address"
                            value={editForm.deliveryAddress}
                            placeholder="Укажите адрес для доставки"
                            onChange={(e) => setEditForm({...editForm, deliveryAddress: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="bio">О себе</Label>
                          <Textarea
                            id="bio"
                            value={editForm.bio}
                            onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                            placeholder="Расскажите о себе, опыте продаж, условиях доставки..."
                            rows={3}
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            className="flex-1" 
                            onClick={() => setIsEditDialogOpen(false)}
                            disabled={isSavingProfile}
                          >
                            Отмена
                          </Button>
                          <Button 
                            className="flex-1" 
                            onClick={handleSaveProfile}
                            disabled={isSavingProfile}
                          >
                            {isSavingProfile ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Сохраняем...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Сохранить
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            <div className="mt-4 md:mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                <div className="text-lg md:text-2xl font-bold text-gray-900">{userData.totalSales}</div>
                <div className="text-xs md:text-sm text-gray-600">Продано товаров</div>
              </div>
              <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                <div className="text-lg md:text-2xl font-bold text-gray-900">{userData.activeListings}</div>
                <div className="text-xs md:text-sm text-gray-600">Активных объявлений</div>
              </div>
              <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                <div className="text-lg md:text-2xl font-bold text-gray-900">{userData.totalViews.toLocaleString()}</div>
                <div className="text-xs md:text-sm text-gray-600">Просмотров</div>
              </div>
              <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center space-x-1">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
                  <span className="text-xs md:text-sm font-medium text-gray-900">
                    {userData.location || "Город не указан"}
                  </span>
                </div>
                <div className="text-xs md:text-sm text-gray-600 mt-1">
                  На платформе с {new Date(userData.joinDate).toLocaleDateString("ru-RU")}
                </div>
              </div>
            </div>

            {userData.bio ? (
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">О продавце</h3>
                <p className="text-gray-700 leading-relaxed text-sm md:text-base">{userData.bio}</p>
              </div>
            ) : (
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">О продавце</h3>
                <p className="text-gray-500 leading-relaxed text-sm md:text-base italic">
                  Расскажите потенциальным покупателям о себе. Нажмите "Редактировать профиль" чтобы добавить информацию.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Мои товары</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="active" className="text-xs md:text-sm p-2 md:p-3">
                  <span className="hidden md:inline">Активные ({userItems.filter((item) => item.status === "active").length})</span>
                  <span className="md:hidden">Активные</span>
                </TabsTrigger>
                <TabsTrigger value="liked" className="text-xs md:text-sm p-2 md:p-3">
                  <span className="hidden md:inline">Понравившиеся ({likedItems.length})</span>
                  <span className="md:hidden">❤️</span>
                </TabsTrigger>
                <TabsTrigger value="sold" className="text-xs md:text-sm p-2 md:p-3">
                  <span className="hidden md:inline">Проданные ({userItems.filter((item) => item.status === "sold").length})</span>
                  <span className="md:hidden">Проданные</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Нет товаров</h3>
                    <p className="text-gray-600">В этой категории пока нет товаров</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredItems.map((item, index) => (
                      <ProductCard
                        key={item.id}
                        product={item}
                        onProductClick={handleProductClick}
                        onToggleFavorite={handleToggleFavorite}
                        onEdit={handleEditItem}
                        onDelete={handleDeleteItem}
                        priority={index === 0}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <ProductDetail
        postId={selectedPostId}
        isOpen={selectedPostId !== null}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        onClose={() => setSelectedPostId(null)}
      />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfilePageContent />
    </AuthGuard>
  )
} 