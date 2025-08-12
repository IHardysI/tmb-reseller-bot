"use client"

import { useState, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/contexts/CartContext"
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Slider } from "@/components/ui/slider"
import {
  ChevronRight,
  User,
  MessageCircle,
  SlidersHorizontal,
  RotateCcw,
  Search,
  X,
  MapPin,
  Home,
  ShoppingCart,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useOptimizedTelegramUser } from "@/hooks/useOptimizedTelegramUser"

const conditions = [
  "Новое",
  "Как новое", 
  "С дефектами",
]

interface SidebarProps {
  priceRange: number[]
  setPriceRange: (range: number[]) => void
  selectedBrands: string[]
  setSelectedBrands: (brands: string[]) => void
  selectedConditions: string[]
  setSelectedConditions: (conditions: string[]) => void
  yearRange: number[]
  setYearRange: (range: number[]) => void
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  selectedCity: string
  setSelectedCity: (city: string) => void
  distanceRadius: number[]
  setDistanceRadius: (radius: number[]) => void
}

export function AppSidebar({
  priceRange,
  setPriceRange,
  selectedBrands,
  setSelectedBrands,
  selectedConditions,
  setSelectedConditions,
  yearRange,
  setYearRange,
  selectedCategories,
  setSelectedCategories,
  selectedCity,
  setSelectedCity,
  distanceRadius,
  setDistanceRadius,
}: SidebarProps) {
  const brands = useQuery(api.posts.getBrands) || []
  const popularBrands = useQuery(api.posts.getPopularBrands) || []
  const priceRangeData = useQuery(api.posts.getPriceRange)
  const yearRangeData = useQuery(api.posts.getYearRange)
  const stableBrands = useMemo(() => brands || [], [brands])
  const stablePopularBrands = useMemo(() => popularBrands || [], [popularBrands])
  const categoryTree = useQuery(api.categories.getCategoryTree) || []
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [brandSearch, setBrandSearch] = useState("")
  const { isMobile, setOpen, setOpenMobile } = useSidebar()
  const router = useRouter()
  const { getCartItemsCount } = useCart()
  const cartItemsCount = getCartItemsCount()
  const telegramUser = useOptimizedTelegramUser()
  
  // Get notification counts
  const activeCases = useQuery(api.moderation.getModerationCases, { status: "pending" })
  const currentUser = telegramUser.userData
  const userChats = useQuery(api.chats.getUserChats, 
    (currentUser?.userId && telegramUser.isInitialized) 
      ? { userId: currentUser.userId as any } 
      : 'skip'
  )
  
  const activeCasesCount = activeCases?.length || 0
  const unreadMessagesCount = userChats?.reduce((total, chat) => {
    return total + (chat.unreadCount || 0)
  }, 0) || 0


  const handleNavigate = (path: string) => {
    if (isMobile) {
      setOpenMobile(false)
    } else {
      setOpen(false)
    }
    router.push(path)
  }
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const defaultPriceRange = useMemo(() => (
    priceRangeData ? [priceRangeData.min, priceRangeData.max] : [0, 500000]
  ), [priceRangeData])
  const defaultYearRange = useMemo(() => (
    yearRangeData ? [yearRangeData.min, yearRangeData.max] : [2015, 2024]
  ), [yearRangeData])

  const clearSelectedBrands = () => {
    setSelectedBrands([])
  }

  const hasActiveFilters = useMemo(() => {
    const priceInitialized = priceRange.length === 2 && !!priceRangeData
    const yearInitialized = yearRange.length === 2 && !!yearRangeData
    const priceActive = priceInitialized && (priceRange[0] > defaultPriceRange[0] || priceRange[1] < defaultPriceRange[1])
    const yearActive = yearInitialized && (yearRange[0] > defaultYearRange[0] || yearRange[1] < defaultYearRange[1])
    return (
      selectedBrands.length > 0 ||
      selectedConditions.length > 0 ||
      selectedCategories.length > 0 ||
      priceActive ||
      yearActive ||
      selectedCity.length > 0 ||
      distanceRadius[0] !== 5
    )
  }, [selectedBrands.length, selectedConditions.length, selectedCategories.length, priceRange, yearRange, selectedCity.length, distanceRadius, defaultPriceRange, defaultYearRange, priceRangeData, yearRangeData])

  const filteredBrands = useMemo(() => {
    if (brandSearch) {
      return stableBrands.filter(brand => 
        brand.toLowerCase().includes(brandSearch.toLowerCase())
      ).slice(0, 5)
    } else {
      return stableBrands.slice(0, 3)
    }
  }, [stableBrands, brandSearch])

  const toggleBrand = (brand: string) => {
    setSelectedBrands(selectedBrands.includes(brand) ? selectedBrands.filter((b) => b !== brand) : [...selectedBrands, brand])
  }

  const toggleCondition = (condition: string) => {
    setSelectedConditions(
      selectedConditions.includes(condition) ? selectedConditions.filter((c) => c !== condition) : [...selectedConditions, condition]
    )
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  const toggleCategorySelection = (category: string) => {
    setSelectedCategories(
      selectedCategories.includes(category) ? selectedCategories.filter((c) => c !== category) : [...selectedCategories, category]
    )
  }

  const resetAllFilters = () => {
    setPriceRange(defaultPriceRange)
    setSelectedBrands([])
    setSelectedConditions([])
    setYearRange(defaultYearRange)
    setSelectedCategories([])
    setSelectedCity("")
    setDistanceRadius([5])
    setBrandSearch("")
  }

  const handlePriceRangeChange = (range: number[]) => {
    setPriceRange(range)
  }

  const handleYearRangeChange = (range: number[]) => {
    setYearRange(range)
  }

  const handleCityChange = (value: string) => {
    setSelectedCity(value)
  }

  const handleDistanceChange = (range: number[]) => {
    setDistanceRadius(range)
  }

  return (
    <Sidebar>
      <SidebarHeader className="px-6 py-4 border-b bg-white shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Peer Swap</h2>
        {isMobile && (
                      <div className={`grid ${telegramUser.isAdmin ? 'grid-cols-5' : 'grid-cols-4'} gap-2 mt-4 pb-2 border-gray-200`}>
            <div className="flex-1">
              <Button 
                variant="outline" 
                className="w-full aspect-square justify-center border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 text-gray-700 hover:text-blue-700 shadow-sm transition-all duration-200 p-2"
                onClick={() => handleNavigate("/")}
              >
                <Home className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1">
              <Button 
                variant="outline" 
                className="w-full aspect-square justify-center border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 text-gray-700 hover:text-blue-700 shadow-sm transition-all duration-200 p-2"
                onClick={() => handleNavigate("/profile")}
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1">
              <Button 
                variant="outline" 
                className="w-full aspect-square justify-center border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 text-gray-700 hover:text-blue-700 shadow-sm transition-all duration-200 p-2 relative"
                onClick={() => handleNavigate("/cart")}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs bg-red-500 text-white flex items-center justify-center border border-white">
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </Badge>
                )}
            </Button>
            </div>
            <div className="flex-1">
              <Button 
                variant="outline" 
                className="w-full aspect-square justify-center border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 text-gray-700 hover:text-blue-700 shadow-sm transition-all duration-200 p-2 relative"
                onClick={() => handleNavigate("/messages")}
              >
                <MessageCircle className="h-5 w-5" />
                {unreadMessagesCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs bg-red-500 text-white flex items-center justify-center border border-white">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </Badge>
                )}
            </Button>
            </div>
                          {telegramUser.isAdmin && (
              <div className="flex-1">
                <Button 
                  variant="outline" 
                  className="w-full aspect-square justify-center border-gray-200 bg-gray-50 hover:bg-red-50 hover:border-red-200 text-gray-700 hover:text-red-700 shadow-sm transition-all duration-200 p-2 relative"
                  onClick={() => handleNavigate("/moderation")}
                >
                  <Shield className="h-5 w-5" />
                  {activeCasesCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs bg-red-500 text-white flex items-center justify-center border border-white">
                      {activeCasesCount > 99 ? '99+' : activeCasesCount}
                    </Badge>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent className="p-0">
        <ScrollArea 
          ref={scrollAreaRef} 
          className="h-full"
        >
          <div className="p-6 space-y-6">
            {/* Filters Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center flex-shrink-0">
                <SlidersHorizontal className="h-4 w-4 mr-2 text-gray-600" />
                <span className="font-semibold text-gray-900 text-sm">Фильтры</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                disabled={!hasActiveFilters}
                className={`text-xs px-2 py-1 h-7 font-medium shadow-sm transition-all duration-200 flex-shrink-0 ${
                  hasActiveFilters 
                    ? "border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 text-red-700 hover:text-red-800" 
                    : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                }`}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Очистить
              </Button>
            </div>

            {/* Categories */}
            <SidebarGroup>
              <SidebarGroupLabel>
          <span className="w-1 h-5 bg-blue-500 rounded-full mr-3"></span>
          Категории
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="bg-gray-50 rounded-lg p-4">
        <div className="space-y-3">
          {categoryTree.map((mainCategory) => (
            <div key={mainCategory._id} className="border-l-2 border-gray-200 pl-3">
              <button
                onClick={() => toggleCategory(mainCategory._id)}
                className="flex items-center justify-between w-full text-left text-sm font-medium py-2 text-gray-800 hover:text-blue-600 transition-colors"
              >
                {mainCategory.name}
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${expandedCategories.includes(mainCategory._id) ? "rotate-90" : ""}`}
                />
              </button>
              {expandedCategories.includes(mainCategory._id) && (
                <div className="ml-4 mt-2 space-y-2 border-l border-gray-100 pl-3">
                  {mainCategory.children.map((subCategory: any) => (
                    <div key={subCategory._id}>
                      {subCategory.children.length > 0 ? (
                        // If subcategory has children, show as expandable button only
                        <>
                          <button
                            onClick={() => toggleCategory(subCategory._id)}
                            className="flex items-center justify-between w-full text-left text-xs font-medium py-1 text-gray-700 hover:text-blue-600 transition-colors"
                          >
                            {subCategory.name}
                            <ChevronRight
                              className={`h-3 w-3 transition-transform ${expandedCategories.includes(subCategory._id) ? "rotate-90" : ""}`}
                            />
                          </button>
                          {expandedCategories.includes(subCategory._id) && (
                            <div className="ml-4 mt-2 space-y-2">
                              {subCategory.children.map((item: any) => (
                                <div key={item._id} className="flex items-center gap-2">
                                  <Checkbox
                                    id={item._id}
                                    checked={selectedCategories.includes(item.name)}
                                    onCheckedChange={() => toggleCategorySelection(item.name)}
                                  />
                                  <Label htmlFor={item._id} className="text-xs text-gray-600 hover:text-gray-900 cursor-pointer">
                                    {item.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        // If subcategory has no children, show as selectable checkbox
                        <div className="flex items-center gap-2 py-1">
                          <Checkbox
                            id={subCategory._id}
                            checked={selectedCategories.includes(subCategory.name)}
                            onCheckedChange={() => toggleCategorySelection(subCategory.name)}
                          />
                          <Label htmlFor={subCategory._id} className="text-xs text-gray-600 hover:text-gray-900 cursor-pointer">
                            {subCategory.name}
                          </Label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Brands */}
            <SidebarGroup>
              <SidebarGroupLabel>
          <span className="w-1 h-5 bg-purple-500 rounded-full mr-3"></span>
          Бренд
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={brands.length > 3 ? `Поиск среди ${brands.length} брендов...` : "Поиск бренда..."}
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="pl-10 h-8 text-sm bg-white"
                    />
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredBrands.length > 0 ? (
                      filteredBrands.map((brand) => {
                        const brandData = stablePopularBrands.find(b => b.name === brand);
                        return (
                          <div key={brand} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
              <Checkbox
                id={brand}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
              />
              <Label htmlFor={brand} className="text-sm text-gray-700 hover:text-gray-900 cursor-pointer font-medium">
                {brand}
              </Label>
            </div>
                            {brandData && (
                              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                                {brandData.postsCount}
                              </Badge>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-4">
                        {brandSearch ? (
                          <div>
                            <span className="block">Бренд не найден</span>
                            <span className="text-xs mt-1 block">Попробуйте другой запрос</span>
                          </div>
                        ) : brands.length === 0 ? (
                          <div>
                            <span className="block">Пока нет брендов</span>
                            <span className="text-xs mt-1 block">Бренды появятся после добавления товаров</span>
                          </div>
                        ) : brands.length > 3 ? (
                          <div>
                            <span className="block text-xs text-gray-400">Показаны топ-3 бренда</span>
                            <span className="text-xs mt-1 block">Используйте поиск для других</span>
                          </div>
                        ) : (
                          "Загрузка брендов..."
                        )}
                      </div>
                    )}
                  </div>
                  {selectedBrands.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">Выбрано: {selectedBrands.length}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSelectedBrands}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 h-auto"
                      >
                        Очистить выбор
                      </Button>
        </div>
                  )}
      </div>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Price */}
            <SidebarGroup>
              <SidebarGroupLabel>
          <span className="w-1 h-5 bg-green-500 rounded-full mr-3"></span>
          Цена
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  {priceRangeData ? (
                    <>
          <Slider 
                        value={priceRange.length === 2 ? priceRange : defaultPriceRange} 
            onValueChange={handlePriceRangeChange} 
                        defaultValue={defaultPriceRange}
                        min={defaultPriceRange[0]}
                        max={defaultPriceRange[1]} 
                        step={Math.max(100, Math.min(1000, Math.round((defaultPriceRange[1] - defaultPriceRange[0]) / 200)))} 
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-gray-600 font-medium">
                        <span className="bg-white px-2 py-1 rounded shadow-sm">{priceRange[0]?.toLocaleString() || '0'} ₽</span>
                        <span className="bg-white px-2 py-1 rounded shadow-sm">{priceRange[1]?.toLocaleString() || '0'} ₽</span>
          </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">Загрузка диапазона цен...</div>
                  )}
      </div>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Condition */}
            <SidebarGroup>
              <SidebarGroupLabel>
          <span className="w-1 h-5 bg-orange-500 rounded-full mr-3"></span>
          Состояние
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="bg-gray-50 rounded-lg p-4">
        <div className="space-y-3">
          {conditions.map((condition) => (
            <div key={condition} className="flex items-center gap-2">
              <Checkbox
                id={condition}
                checked={selectedConditions.includes(condition)}
                onCheckedChange={() => toggleCondition(condition)}
              />
              <Label htmlFor={condition} className="text-sm text-gray-700 hover:text-gray-900 cursor-pointer font-medium">
                {condition}
              </Label>
            </div>
          ))}
        </div>
      </div>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Year */}
            <SidebarGroup>
              <SidebarGroupLabel>
          <span className="w-1 h-5 bg-red-500 rounded-full mr-3"></span>
          Год покупки
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  {yearRangeData ? (
                    <>
          <Slider 
                        value={yearRange.length === 2 ? yearRange : defaultYearRange} 
            onValueChange={handleYearRangeChange} 
                        defaultValue={defaultYearRange}
                        min={defaultYearRange[0]} 
                        max={defaultYearRange[1]} 
            step={1} 
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-gray-600 font-medium">
                        <span className="bg-white px-2 py-1 rounded shadow-sm">{yearRange[0] || 2015}</span>
                        <span className="bg-white px-2 py-1 rounded shadow-sm">{yearRange[1] || 2024}</span>
          </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">Загрузка диапазона лет...</div>
                  )}
      </div>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Location */}
            <SidebarGroup>
              <SidebarGroupLabel>
          <span className="w-1 h-5 bg-teal-500 rounded-full mr-3"></span>
          По удалённости продавца
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Город</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Введите город..."
                          value={selectedCity}
                          onChange={(e) => handleCityChange(e.target.value)}
                          className="pl-10 h-9 text-sm bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">Радиус поиска</label>
                      <div className="px-2">
                        <Slider 
                          value={distanceRadius} 
                          onValueChange={handleDistanceChange} 
                          defaultValue={[5]}
                          min={1} 
                          max={100} 
                          step={1} 
                          className="mb-4"
                        />
                        <div className="flex justify-center">
                          <span className="bg-white px-3 py-1.5 rounded shadow-sm text-sm text-gray-600 font-medium">
                            {distanceRadius[0]} км
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
    </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}

export { SidebarTrigger } from "@/components/ui/sidebar" 