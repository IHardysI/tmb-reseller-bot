"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { useTelegramUser } from "@/hooks/useTelegramUser"

import {
  Search,
  SlidersHorizontal,
  User,
  MessageCircle,
  Home as HomeIcon,
  ShoppingCart,
} from "lucide-react"
import Link from "next/link"

import ProductDetail from "@/components/widgets/product-detail"
import ProductCard from "@/components/widgets/product-card"
import { SidebarTrigger } from "@/components/widgets/sidebar"
import { OptimizedAuthGuard } from '@/components/OptimizedAuthGuard'
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { useFilters } from "@/contexts/FilterContext"
import AddItemDialog from "@/components/widgets/create-post"
import { PageLoader } from "@/components/ui/loader"

interface Product {
  id: string
  sellerId?: string
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
}

function MarketplaceContent() {
  const telegramUser = useTelegramUser()
  const allPosts = useQuery(api.posts.getAllActivePosts)
  const currentUser = useQuery(
    api.users.getUserByTelegramId, 
    telegramUser?.userId ? { telegramId: telegramUser.userId } : "skip"
  )
  const priceRangeData = useQuery(api.posts.getPriceRange)
  const yearRangeData = useQuery(api.posts.getYearRange)
  
  const likePost = useMutation(api.posts.likePost)
  const unlikePost = useMutation(api.posts.unlikePost)
  const deletePost = useMutation(api.posts.deletePost)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedPostId, setSelectedPostId] = useState<Id<"posts"> | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  
  const filters = useFilters()
  const [editingPost, setEditingPost] = useState<Product | null>(null)

  const handlePostCreated = () => {
    console.log("Post created successfully!")
  }

  // Initialize ranges when data loads
  useEffect(() => {
    if (priceRangeData && filters.priceRange.length === 0) {
      filters.setPriceRange([priceRangeData.min, priceRangeData.max])
    }
  }, [priceRangeData, filters.priceRange.length])

  useEffect(() => {
    if (yearRangeData && filters.yearRange.length === 0) {
      filters.setYearRange([yearRangeData.min, yearRangeData.max])
    }
  }, [yearRangeData, filters.yearRange.length])

  const filteredAndSortedProducts = useMemo(() => {
    if (!allPosts) return []
    
    let filtered = allPosts.map(post => ({
      id: post._id,
      sellerId: post.userId,
      name: post.name,
      brand: (post.brand || "Без бренда") as string,
      price: post.price,
      images: post.images,
      condition: post.condition,
      year: post.year,
      description: post.description,
      category: post.category || "",
      subcategory: post.subcategory,
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
      isOwned: currentUser && post.telegramId === telegramUser?.userId || false,
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
    if (filters.selectedBrands.length > 0) {
      filtered = filtered.filter(product => filters.selectedBrands.includes(product.brand))
    }

    // Apply condition filter
    if (filters.selectedConditions.length > 0) {
      filtered = filtered.filter(product => filters.selectedConditions.includes(product.condition))
    }

    // Apply price range filter
    if (filters.priceRange.length === 2) {
      filtered = filtered.filter(product => 
        product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
      )
    }

    // Apply year range filter
    if (filters.yearRange.length === 2) {
      filtered = filtered.filter(product => 
        product.year >= filters.yearRange[0] && product.year <= filters.yearRange[1]
      )
    }

    // Apply category filter (basic implementation)
    if (filters.selectedCategories.length > 0) {
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
  }, [allPosts, searchQuery, filters.selectedBrands, filters.selectedConditions, filters.priceRange, filters.yearRange, filters.selectedCategories, sortBy, currentUser])

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

  const handleDeletePost = async (productId: string) => {
    if (!telegramUser?.userId) return
    
    try {
      await deletePost({ postId: productId as Id<"posts">, telegramId: telegramUser.userId })
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  const handleEditPost = (product: Product) => {
    setEditingPost(product)
    setIsCreateDialogOpen(true)
  }

  return (
      <div className="flex-1 min-h-screen bg-gray-50">
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
            <PageLoader text="Загружаем товары..." />
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
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                  priority={index === 0}
                />
              ))}
            </div>
          )}
        </div>
        
        <ProductDetail
          postId={selectedPostId}
          isOpen={selectedPostId !== null}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
          onClose={() => setSelectedPostId(null)}
        />

        <AddItemDialog
          isOpen={isCreateDialogOpen}
          onClose={() => {
            setIsCreateDialogOpen(false)
            setEditingPost(null)
          }}
          onPostCreated={handlePostCreated}
          editingPost={editingPost}
        />

        <FloatingActionButton 
          onClick={() => setIsCreateDialogOpen(true)}
        />
      </div>
  )
}

export default function Home() {
  return (
    <OptimizedAuthGuard>
      <MarketplaceContent />
    </OptimizedAuthGuard>
  )
}