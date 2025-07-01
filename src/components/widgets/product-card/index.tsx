import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Lock, Star, ShoppingCart, Award, Eye, Edit, Trash2 } from "lucide-react"
import Image from "next/image"
import { useCart } from "@/contexts/CartContext"

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
}

interface ProductCardProps {
  product: Product
  onProductClick: (product: Product) => void
  onToggleFavorite: (productId: string) => void
  onEdit?: (product: Product) => void
  onDelete?: (productId: string) => void
  priority?: boolean
}

export default function ProductCard({ product, onProductClick, onToggleFavorite, onEdit, onDelete, priority = false }: ProductCardProps) {
  const { addToCart } = useCart()
  
  const getTrustIcon = () => {
    return <Award className="h-4 w-4 text-amber-600" />
  }

  const getTrustLabel = () => {
    return "Новый"
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.images[0] || "/placeholder.svg",
      condition: product.condition,
      year: product.year,
      sellerName: product.sellerName || "Продавец",
      sellerAvatar: "/placeholder.svg",
      sellerTrust: "bronze",
      sellerRating: 4.5
    })
  }

  return (
    <Card
      key={product.id}
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer p-0! gap-0!"
      onClick={() => onProductClick(product)}
    >
      <div className="relative">
        <Image
          src={product.images[0] || "/placeholder.svg"}
          alt={product.name}
          width={400}
          height={300}
          className="w-full aspect-[4/3] object-cover"
          priority={priority}
        />
        {product.isOwned ? (
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/80 hover:bg-white h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(product)
              }}
            >
              <Edit className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/80 hover:bg-white h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(product.id)
              }}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite(product.id)
            }}
          >
            <Heart
              className={`h-4 w-4 ${product.isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`}
            />
          </Button>
        )}
      </div>

      <CardContent className="p-2">
        <div className="space-y-1">
          <div>
            <h3 className="font-medium text-xs line-clamp-1">{product.name}</h3>
            <p className="text-xs text-gray-600">{product.brand}</p>
          </div>

          <div className="flex items-center space-x-1">
            <span className="font-bold text-xs">{product.price.toLocaleString()} ₽</span>
            <Lock className="h-2 w-2 text-green-600" />
          </div>

          {product.aiRating && product.aiRecommendation && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-2 w-2 ${i < Math.floor(product.aiRating!) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <span className="text-green-600 text-xs truncate">{product.aiRecommendation}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              {getTrustIcon()}
              <span className="truncate">{getTrustLabel()}</span>
            </div>
            <span className="text-gray-600 truncate">{product.sellerName || 'Продавец'}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Eye className="h-2 w-2" />
                <span>{product.views || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="h-2 w-2" />
                <span>{product.likesCount || 0}</span>
              </div>
            </div>
          </div>

          <div className="h-7">
            {!product.isOwned && (
              <Button 
                size="sm" 
                className="w-full text-xs h-7"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-2 w-2 mr-1" />В корзину
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 