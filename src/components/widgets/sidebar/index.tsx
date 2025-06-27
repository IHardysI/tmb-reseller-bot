import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import {
  ChevronRight,
  User,
  MessageCircle,
  Menu,
  SlidersHorizontal,
} from "lucide-react"

const brands = ["Louis Vuitton", "Chanel", "Gucci", "Prada", "Nike", "Adidas", "Rolex", "Cartier"]
const conditions = ["Новое", "Как новое", "С дефектами"]
const categories = {
  Одежда: {
    "Женская одежда": [
      "Платья",
      "Блузки",
      "Юбки",
      "Брюки",
      "Джинсы",
      "Костюмы",
      "Пальто",
      "Куртки",
      "Свитера",
      "Кардиганы",
    ],
    "Мужская одежда": [
      "Рубашки",
      "Футболки",
      "Брюки",
      "Джинсы",
      "Костюмы",
      "Пиджаки",
      "Пальто",
      "Куртки",
      "Свитера",
      "Худи",
    ],
    "Детская одежда": ["Для мальчиков", "Для девочек", "Для малышей", "Школьная форма"],
  },
  Обувь: {
    "Женская обувь": [
      "Туфли",
      "Сапоги",
      "Ботинки",
      "Кроссовки",
      "Балетки",
      "Босоножки",
      "Сандалии",
      "Угги",
    ],
    "Мужская обувь": ["Туфли", "Ботинки", "Кроссовки", "Сапоги", "Мокасины", "Сандалии"],
    "Детская обувь": ["Для мальчиков", "Для девочек", "Спортивная обувь"],
  },
  Аксессуары: {
    Сумки: ["Женские сумки", "Мужские сумки", "Рюкзаки", "Клатчи", "Портфели"],
    Украшения: ["Кольца", "Серьги", "Браслеты", "Цепочки", "Броши"],
    Часы: ["Мужские часы", "Женские часы", "Спортивные часы", "Умные часы"],
    Очки: ["Солнцезащитные", "Оптические", "Спортивные"],
  },
}

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
  isMobileSidebarOpen: boolean
  setIsMobileSidebarOpen: (open: boolean) => void
}

export default function Sidebar({
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
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
}: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

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

  const FilterContent = () => (
    <div className="space-y-8">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-4 text-gray-900 flex items-center">
          <span className="w-1 h-5 bg-blue-500 rounded-full mr-3"></span>
          Категории
        </h3>
        <div className="space-y-3">
          {Object.entries(categories).map(([mainCategory, subCategories]) => (
            <div key={mainCategory} className="border-l-2 border-gray-200 pl-3">
              <button
                onClick={() => toggleCategory(mainCategory)}
                className="flex items-center justify-between w-full text-left text-sm font-medium py-2 text-gray-800 hover:text-blue-600 transition-colors"
              >
                {mainCategory}
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${expandedCategories.includes(mainCategory) ? "rotate-90" : ""}`}
                />
              </button>
              {expandedCategories.includes(mainCategory) && (
                <div className="ml-4 mt-2 space-y-2 border-l border-gray-100 pl-3">
                  {Object.entries(subCategories).map(([subCategory, items]) => (
                    <div key={subCategory}>
                      <button
                        onClick={() => toggleCategory(`${mainCategory}-${subCategory}`)}
                        className="flex items-center justify-between w-full text-left text-xs font-medium py-1 text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        {subCategory}
                        <ChevronRight
                          className={`h-3 w-3 transition-transform ${expandedCategories.includes(`${mainCategory}-${subCategory}`) ? "rotate-90" : ""}`}
                        />
                      </button>
                      {expandedCategories.includes(`${mainCategory}-${subCategory}`) && (
                        <div className="ml-4 mt-2 space-y-2">
                          {items.map((item) => (
                            <div key={item} className="flex items-center space-x-2">
                              <Checkbox
                                id={item}
                                checked={selectedCategories.includes(item)}
                                onCheckedChange={() => toggleCategorySelection(item)}
                              />
                              <Label htmlFor={item} className="text-xs text-gray-600 hover:text-gray-900 cursor-pointer">
                                {item}
                              </Label>
                            </div>
                          ))}
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

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-4 text-gray-900 flex items-center">
          <span className="w-1 h-5 bg-purple-500 rounded-full mr-3"></span>
          Бренд
        </h3>
        <div className="space-y-3">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center gap-2">
              <Checkbox
                id={brand}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
              />
              <Label htmlFor={brand} className="text-sm text-gray-700 hover:text-gray-900 cursor-pointer font-medium">
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-4 text-gray-900 flex items-center">
          <span className="w-1 h-5 bg-green-500 rounded-full mr-3"></span>
          Цена
        </h3>
        <div className="px-2">
          <Slider 
            value={priceRange} 
            onValueChange={setPriceRange} 
            min={0}
            max={500000} 
            step={5000} 
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-gray-600 font-medium">
            <span className="bg-white px-2 py-1 rounded shadow-sm">{priceRange[0].toLocaleString()} ₽</span>
            <span className="bg-white px-2 py-1 rounded shadow-sm">{priceRange[1].toLocaleString()} ₽</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-4 text-gray-900 flex items-center">
          <span className="w-1 h-5 bg-orange-500 rounded-full mr-3"></span>
          Состояние
        </h3>
        <div className="space-y-3">
          {conditions.map((condition) => (
            <div key={condition} className="flex items-center space-x-3">
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

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-4 text-gray-900 flex items-center">
          <span className="w-1 h-5 bg-red-500 rounded-full mr-3"></span>
          Год покупки
        </h3>
        <div className="px-2">
          <Slider 
            value={yearRange} 
            onValueChange={setYearRange} 
            min={2015} 
            max={2024} 
            step={1} 
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-gray-600 font-medium">
            <span className="bg-white px-2 py-1 rounded shadow-sm">{yearRange[0]}</span>
            <span className="bg-white px-2 py-1 rounded shadow-sm">{yearRange[1]}</span>
          </div>
        </div>
      </div>
    </div>
  )

    return (
    <>
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen} modal={true}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden border-2 border-gray-400 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 shadow-sm"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="h-full flex flex-col">
            <SheetHeader className="px-6 py-4 border-b bg-white shadow-sm">
              <SheetTitle className="text-lg font-semibold text-gray-900">Peer Swap</SheetTitle>
              <SheetDescription className="sr-only">
                Мобильное меню с навигацией и фильтрами для поиска товаров
              </SheetDescription>
            </SheetHeader>
            
            <ScrollArea className="flex-1 px-6 py-4" style={{ height: "calc(100vh - 80px)" }}>
              <div className="space-y-6 pb-3">
                <div className="pb-6 border-b-2 border-gray-200">
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start hover:bg-gray-100" size="lg">
                      <MessageCircle className="h-5 w-5 mr-3 text-gray-600" />
                      <span className="text-gray-700">Сообщения</span>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start hover:bg-gray-100" size="lg">
                      <User className="h-5 w-5 mr-3 text-gray-600" />
                      <span className="text-gray-700">Профиль</span>
                    </Button>
                  </div>
                </div>

              

                <div>
                  <h3 className="font-semibold mb-4 text-gray-900 flex items-center">
                    <SlidersHorizontal className="h-4 w-4 mr-2 text-gray-600" />
                    Фильтры
                  </h3>
                  <FilterContent />
                </div>
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden lg:block w-80 bg-white border-r border-gray-200">
        <div className="p-6 sticky top-20">
          <h2 className="font-semibold text-lg mb-6 text-gray-900">Фильтры</h2>
          <ScrollArea className="h-[calc(100vh-200px)]" style={{ height: "calc(100vh - 200px)" }}>
            <div className="pr-4 pb-8">
              <FilterContent />
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  )
} 