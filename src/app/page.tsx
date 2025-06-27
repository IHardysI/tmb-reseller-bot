"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
  Search,
  SlidersHorizontal,
  X,
  User,
  MessageCircle,
} from "lucide-react"

import ProductDetail from "@/components/widgets/product-detail"
import ProductCard from "@/components/widgets/product-card"
import Sidebar from "@/components/widgets/sidebar"
import { AuthGuard } from '@/components/AuthGuard'

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
  defects: {
    description: string
    image: string
    location: string
  }[]
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Классическая сумка",
    brand: "Louis Vuitton",
    price: 85000,
    originalPrice: 150000,
    images: [
      "https://picsum.photos/400/400?random=1",
      "https://picsum.photos/400/400?random=2",
      "https://picsum.photos/400/400?random=3",
    ],
    condition: "Как новое",
    year: 2022,
    aiRating: 4.5,
    aiRecommendation: "Отличная цена",
    aiExplanation:
      "Цена соответствует рыночной стоимости аналогичных товаров в данном состоянии. Учитывая год покупки и состояние, стоимость оправдана.",
    sellerTrust: "gold",
    sellerName: "Анна К.",
    sellerAvatar: "https://picsum.photos/48/48?random=10",
    sellerRating: 4.8,
    sellerReviews: 127,
    isFavorite: false,
    description: "Классическая сумка Louis Vuitton в отличном состоянии",
    defects: [
      {
        description: "Небольшие потертости на углах",
        image: "https://picsum.photos/60/60?random=15",
        location: "Нижние углы сумки",
      },
    ],
  },
  {
    id: "2",
    name: "Кроссовки Air Jordan 1",
    brand: "Nike",
    price: 25000,
    originalPrice: 35000,
    images: [
      "https://picsum.photos/400/400?random=4",
      "https://picsum.photos/400/400?random=5",
      "https://picsum.photos/400/400?random=6",
    ],
    condition: "С дефектами",
    year: 2021,
    aiRating: 3.8,
    aiRecommendation: "Можно снизить",
    aiExplanation: "Наличие дефектов снижает стоимость. Рекомендуется запросить дополнительную скидку у продавца.",
    sellerTrust: "silver",
    sellerName: "Максим П.",
    sellerAvatar: "https://picsum.photos/48/48?random=11",
    sellerRating: 4.2,
    sellerReviews: 64,
    isFavorite: true,
    description: "Кроссовки Air Jordan 1 в хорошем состоянии, но с небольшими дефектами.",
    defects: [
      {
        description: "Небольшая царапина на коже",
        image: "https://picsum.photos/60/60?random=16",
        location: "Боковая часть кроссовка",
      },
    ],
  },
  {
    id: "3",
    name: "Платье коктейльное",
    brand: "Chanel",
    price: 120000,
    originalPrice: 200000,
    images: [
      "https://picsum.photos/400/400?random=7",
      "https://picsum.photos/400/400?random=8",
      "https://picsum.photos/400/400?random=9",
    ],
    condition: "Новое",
    year: 2023,
    aiRating: 4.8,
    aiRecommendation: "Отличная цена",
    aiExplanation: "Платье новое, текущая цена значительно ниже первоначальной. Это выгодное предложение.",
    sellerTrust: "gold",
    sellerName: "Елена В.",
    sellerAvatar: "https://picsum.photos/48/48?random=12",
    sellerRating: 4.9,
    sellerReviews: 212,
    isFavorite: false,
    description: "Элегантное коктейльное платье от Chanel, абсолютно новое.",
    defects: [],
  },
  {
    id: "4",
    name: "Часы Submariner",
    brand: "Rolex",
    price: 450000,
    originalPrice: 800000,
    images: [
      "https://picsum.photos/400/400?random=13",
      "https://picsum.photos/400/400?random=14",
      "https://picsum.photos/400/400?random=15",
    ],
    condition: "Как новое",
    year: 2020,
    aiRating: 4.2,
    aiRecommendation: "Цена адекватна",
    aiExplanation: "Цена соответствует состоянию и году выпуска часов. Рекомендуется проверить подлинность.",
    sellerTrust: "bronze",
    sellerName: "Дмитрий С.",
    sellerAvatar: "https://picsum.photos/48/48?random=13",
    sellerRating: 3.5,
    sellerReviews: 32,
    isFavorite: false,
    description: "Часы Rolex Submariner в отличном состоянии, полный комплект.",
    defects: [],
  },
]

function MarketplaceContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [priceRange, setPriceRange] = useState([0, 500000])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [yearRange, setYearRange] = useState([2020, 2024])
  const [products, setProducts] = useState(mockProducts)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const toggleFavorite = (productId: string) => {
    setProducts(
      products.map((product) => (product.id === productId ? { ...product, isFavorite: !product.isFavorite } : product)),
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b hidden md:block">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">Маркетплейс</h1>
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Сообщения
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4 mr-2" />
              Профиль
            </Button>
          </div>
        </div>
      </div>
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Поиск по названию, бренду..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="lg:hidden">
              <Sidebar
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
                isMobileSidebarOpen={isMobileSidebarOpen}
                setIsMobileSidebarOpen={setIsMobileSidebarOpen}
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <div className="flex-1 lg:mr-4">
              <div className="flex items-center flex-wrap gap-2">
                {(() => {
                  const allFilters = [
                    ...selectedBrands.map((brand) => ({
                      type: 'brand',
                      label: `Бренд: ${brand}`,
                      onRemove: () => setSelectedBrands(selectedBrands.filter(b => b !== brand))
                    })),
                    ...selectedConditions.map((condition) => ({
                      type: 'condition',
                      label: `Состояние: ${condition}`,
                      onRemove: () => setSelectedConditions(selectedConditions.filter(c => c !== condition))
                    })),
                    ...selectedCategories.map((category) => ({
                      type: 'category',
                      label: `Категория: ${category}`,
                      onRemove: () => setSelectedCategories(selectedCategories.filter(c => c !== category))
                    })),
                    ...((priceRange[0] > 0 || priceRange[1] < 500000) ? [{
                      type: 'price',
                      label: `Цена: ${priceRange[0].toLocaleString()}-${priceRange[1].toLocaleString()} ₽`,
                      onRemove: () => setPriceRange([0, 500000])
                    }] : []),
                    ...((yearRange[0] > 2020 || yearRange[1] < 2024) ? [{
                      type: 'year',
                      label: `Год: ${yearRange[0]}-${yearRange[1]}`,
                      onRemove: () => setYearRange([2020, 2024])
                    }] : [])
                  ]
                  
                  const maxVisible = 3
                  const visibleFilters = allFilters.slice(0, maxVisible)
                  const hiddenCount = allFilters.length - maxVisible
                  
                  return (
                    <>
                      {visibleFilters.map((filter, index) => (
                        <Badge key={`${filter.type}-${index}`} variant="secondary" className="text-xs whitespace-nowrap flex-shrink-0 filter-badge">
                          <span className="truncate">{filter.label}</span>
                          <X className="h-3 w-3 ml-1 cursor-pointer flex-shrink-0" onClick={filter.onRemove} />
                        </Badge>
                      ))}
                      {hiddenCount > 0 && (
                        <Badge variant="outline" className="text-xs whitespace-nowrap flex-shrink-0">
                          +{hiddenCount} еще
                        </Badge>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48 border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 flex-shrink-0">
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

      <div className="flex">
        <div className="hidden lg:block">
          <Sidebar
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
            isMobileSidebarOpen={isMobileSidebarOpen}
            setIsMobileSidebarOpen={setIsMobileSidebarOpen}
          />
        </div>
        <div className="flex-1 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={setSelectedProduct}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      </div>
      <ProductDetail
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  )
}

export default function Home() {
  return (
    <AuthGuard>
      <MarketplaceContent />
    </AuthGuard>
  )
}