"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { useTelegramUser } from "@/hooks/useTelegramUser"

import {
  Search,
  SlidersHorizontal,
  User,
  MessageCircle,
} from "lucide-react"

import ProductDetail from "@/components/widgets/product-detail"
import ProductCard from "@/components/widgets/product-card"
import { AppSidebar, SidebarTrigger } from "@/components/widgets/sidebar"
import { AuthGuard } from '@/components/AuthGuard'
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import AddItemDialog from "@/components/widgets/create-post"

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
  defects: {
    description: string
    location: string
  }[]
  sellerName?: string
  sellerCity?: string
  likesCount?: number
  views?: number
}

function MarketplaceContent() {
  const telegramUser = useTelegramUser()
  const allPosts = useQuery(api.posts.getAllActivePosts) || []
  const currentUser = useQuery(
    api.users.getUserByTelegramId, 
    telegramUser?.userId ? { telegramId: telegramUser.userId } : "skip"
  )
  
  const likePost = useMutation(api.posts.likePost)
  const unlikePost = useMutation(api.posts.unlikePost)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [priceRange, setPriceRange] = useState<number[]>([0, 500000])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [yearRange, setYearRange] = useState<number[]>([2015, 2024])
  const [selectedPostId, setSelectedPostId] = useState<Id<"posts"> | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState("")
  const [distanceRadius, setDistanceRadius] = useState<number[]>([5])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = allPosts.map(post => ({
      id: post._id,
      name: post.name,
      brand: post.brand,
      price: post.price,
      images: post.images,
      condition: post.condition,
      year: post.year,
      description: post.description,
      defects: post.defects.map(d => ({
        description: d.description,
        location: d.location,
      })),
      isFavorite: currentUser && post.likedBy?.includes(currentUser._id) || false,
      aiRating: post.aiRating,
      aiRecommendation: post.aiRecommendation,
      aiExplanation: post.aiExplanation,
      sellerName: post.sellerName,
      sellerCity: post.sellerCity,
      likesCount: post.likesCount,
      views: post.views,
    }))

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply brand filter
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(product => selectedBrands.includes(product.brand))
    }

    // Apply condition filter
    if (selectedConditions.length > 0) {
      filtered = filtered.filter(product => selectedConditions.includes(product.condition))
    }

    // Apply price range filter
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    )

    // Apply year range filter
    filtered = filtered.filter(product => 
      product.year >= yearRange[0] && product.year <= yearRange[1]
    )

    // Apply category filter (basic implementation)
    if (selectedCategories.length > 0) {
      // For now, we'll filter by category field if it exists
      // This would need to be expanded based on the actual category structure
    }

    // Apply sorting
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "ai-rating":
        filtered.sort((a, b) => (b.aiRating || 0) - (a.aiRating || 0))
        break
      case "newest":
      default:
        // Posts are already sorted by creation date from the query
        break
    }

    return filtered
  }, [allPosts, searchQuery, selectedBrands, selectedConditions, priceRange, yearRange, selectedCategories, sortBy, currentUser])

  const toggleFavorite = async (productId: string) => {
    if (!telegramUser?.userId) return
    
    const product = filteredAndSortedProducts.find(p => p.id === productId)
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

  return (
    <SidebarProvider>
      <AppSidebar
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        selectedBrands={selectedBrands}
        setSelectedBrands={setSelectedBrands}
        selectedConditions={selectedConditions}
        setSelectedConditions={setSelectedConditions}
        yearRange={yearRange}
        setYearRange={setYearRange}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        distanceRadius={distanceRadius}
        setDistanceRadius={setDistanceRadius}
      />
      
      <div className="flex-1 min-h-screen bg-gray-50">
        <div className="bg-white border-b hidden md:block">
          <div className="flex items-center justify-between p-4">
                          <h1 className="text-xl font-bold text-gray-900 my-1">Маркетплейс</h1>
                          <div className="hidden md:flex items-center gap-3">
                <Button variant="outline" size="sm" className="border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-700 shadow-sm transition-all duration-200">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Сообщения
                </Button>
                <Button variant="outline" size="sm" className="border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-700 shadow-sm transition-all duration-200">
                  <User className="h-4 w-4 mr-2" />
                  Профиль
                </Button>
              </div>
          </div>
        </div>
        <div className="bg-white border-b sticky top-0 z-40">
          <div className="p-4">
            {/* Desktop Layout */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по названию, бренду..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Сначала новые</SelectItem>
                  <SelectItem value="price-asc">По цене: по возрастанию</SelectItem>
                  <SelectItem value="price-desc">По цене: по убыванию</SelectItem>
                  <SelectItem value="ai-rating">По оценке ИИ</SelectItem>
                </SelectContent>
              </Select>

              <SidebarTrigger />
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden space-y-3">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Поиск по названию, бренду..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <SidebarTrigger />
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Сначала новые</SelectItem>
                  <SelectItem value="price-asc">По цене: по возрастанию</SelectItem>
                  <SelectItem value="price-desc">По цене: по убыванию</SelectItem>
                  <SelectItem value="ai-rating">По оценке ИИ</SelectItem>
                </SelectContent>
                            </Select>
            </div>
          </div>
        </div>

        <div className="p-4">
          {allPosts === undefined ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Загружаем товары...</p>
              </div>
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-gray-600 mb-2">Товары не найдены</p>
                <p className="text-sm text-gray-500">Попробуйте изменить фильтры поиска</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAndSortedProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onProductClick={(product) => setSelectedPostId(product.id as Id<"posts">)}
                  onToggleFavorite={toggleFavorite}
                  priority={index === 0}
                />
              ))}
            </div>
          )}
        </div>
        
        <ProductDetail
          postId={selectedPostId}
          isOpen={selectedPostId !== null}
          onClose={() => setSelectedPostId(null)}
        />

        <AddItemDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        />

        <FloatingActionButton 
          onClick={() => setIsCreateDialogOpen(true)}
        />
      </div>
    </SidebarProvider>
  )
}

export default function Home() {
  return (
    <AuthGuard>
      <MarketplaceContent />
    </AuthGuard>
  )
}