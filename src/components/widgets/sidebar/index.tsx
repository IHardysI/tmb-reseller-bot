import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"

const brands = [
  "Louis Vuitton", "Chanel", "Gucci", "Prada", "Hermès", "Dior", "Balenciaga", "Bottega Veneta",
  "Saint Laurent", "Valentino", "Givenchy", "Versace", "Fendi", "Céline", "Loewe", "Burberry",
  "Nike", "Adidas", "Jordan", "Yeezy", "Off-White", "Supreme", "Stone Island", "Moncler",
  "Canada Goose", "The North Face", "Patagonia", "Arc'teryx", "Rolex", "Cartier", "Omega",
  "TAG Heuer", "Breitling", "Patek Philippe", "Audemars Piguet", "Vacheron Constantin",
  "Jaeger-LeCoultre", "IWC", "Chopard", "Bulgari", "Tiffany & Co.", "Van Cleef & Arpels"
]

const conditions = [
  "Новое",
  "Как новое", 
  "С дефектами",
]
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
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [brandSearch, setBrandSearch] = useState("")
  const { isMobile } = useSidebar()

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
    setPriceRange([0, 500000])
    setSelectedBrands([])
    setSelectedConditions([])
    setYearRange([2015, 2024])
    setSelectedCategories([])
    setSelectedCity("")
    setDistanceRadius([5])
    setBrandSearch("")
  }

  const hasActiveFilters = 
    selectedBrands.length > 0 ||
    selectedConditions.length > 0 ||
    selectedCategories.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 500000 ||
    yearRange[0] > 2015 ||
    yearRange[1] < 2024 ||
    selectedCity.length > 0 ||
    distanceRadius[0] !== 5

  const filteredBrands = brands.filter(brand => 
    brand.toLowerCase().includes(brandSearch.toLowerCase())
  )

  return (
    <Sidebar>
      <SidebarHeader className="px-6 py-4 border-b bg-white shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Peer Swap</h2>
        {isMobile && (
          <div className="flex gap-3 mt-4 pb-2 border-gray-200">
            <Button variant="outline" className="flex-1 aspect-square justify-center border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 text-gray-700 hover:text-blue-700 shadow-sm transition-all duration-200 p-3">
              <MessageCircle className="h-6 w-6" />
            </Button>
            <Button variant="outline" className="flex-1 aspect-square justify-center border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 text-gray-700 hover:text-blue-700 shadow-sm transition-all duration-200 p-3">
              <User className="h-6 w-6" />
            </Button>
          </div>
        )}
      </SidebarHeader>
      
                    <SidebarContent className="scrollbar-hide">
        <div className="py-4 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <SlidersHorizontal className="h-4 w-4 mr-2 text-gray-600" />
                <span className="font-semibold text-gray-900">Фильтры</span>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAllFilters}
                  className="border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 text-red-700 hover:text-red-800 text-xs px-3 py-2 font-medium shadow-sm transition-all duration-200"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Сбросить всё
                </Button>
              )}
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Активные фильтры:</h4>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const allFilters = [
                      ...selectedBrands.map((brand) => ({
                        type: 'brand',
                        label: `${brand}`,
                        onRemove: () => setSelectedBrands(selectedBrands.filter(b => b !== brand))
                      })),
                      ...selectedConditions.map((condition) => ({
                        type: 'condition',
                        label: `${condition}`,
                        onRemove: () => setSelectedConditions(selectedConditions.filter(c => c !== condition))
                      })),
                      ...selectedCategories.map((category) => ({
                        type: 'category',
                        label: `${category}`,
                        onRemove: () => setSelectedCategories(selectedCategories.filter(c => c !== category))
                      })),
                      ...((priceRange[0] > 0 || priceRange[1] < 500000) ? [{
                        type: 'price',
                        label: `${priceRange[0].toLocaleString()}-${priceRange[1].toLocaleString()} ₽`,
                        onRemove: () => setPriceRange([0, 500000])
                      }] : []),
                      ...((yearRange[0] > 2015 || yearRange[1] < 2024) ? [{
                        type: 'year',
                        label: `${yearRange[0]}-${yearRange[1]}`,
                        onRemove: () => setYearRange([2015, 2024])
                      }] : []),
                      ...(selectedCity.length > 0 ? [{
                        type: 'city',
                        label: `${selectedCity}`,
                        onRemove: () => setSelectedCity("")
                      }] : []),
                      ...(distanceRadius[0] !== 5 ? [{
                        type: 'distance',
                        label: `${distanceRadius[0]} км`,
                        onRemove: () => setDistanceRadius([5])
                      }] : [])
                    ]

                    return allFilters.map((filter, index) => (
                      <Badge 
                        key={`${filter.type}-${index}`} 
                        variant="secondary" 
                        className="text-xs py-1 px-2 bg-white border border-blue-300 text-blue-800 hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1"
                        onClick={() => filter.onRemove()}
                      >
                        <span className="truncate max-w-[120px]">{filter.label}</span>
                        <X className="h-3 w-3 flex-shrink-0 hover:text-red-600 transition-colors" />
                      </Badge>
                    ))
                  })()}
                </div>
              </div>
            )}

            <SidebarGroup>
              <SidebarGroupLabel>
          <span className="w-1 h-5 bg-blue-500 rounded-full mr-3"></span>
          Категории
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="bg-gray-50 rounded-lg p-4">
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
                            <div key={item} className="flex items-center gap-2">
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
              </SidebarGroupContent>
            </SidebarGroup>

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
                      placeholder="Поиск бренда..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="pl-10 h-8 text-sm bg-white"
                    />
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredBrands.length > 0 ? (
                      filteredBrands.map((brand) => (
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
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-2">
                        Бренд не найден
                      </div>
                    )}
                  </div>
                  {selectedBrands.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">Выбрано: {selectedBrands.length}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBrands([])}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 h-auto"
                      >
                        Очистить выбор
                      </Button>
        </div>
                  )}
      </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>
          <span className="w-1 h-5 bg-green-500 rounded-full mr-3"></span>
          Цена
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="bg-gray-50 rounded-lg p-4">
        <div className="px-2">
          <Slider 
            value={priceRange} 
            onValueChange={setPriceRange} 
                      defaultValue={[0, 500000]}
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
              </SidebarGroupContent>
            </SidebarGroup>

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

            <SidebarGroup>
              <SidebarGroupLabel>
          <span className="w-1 h-5 bg-red-500 rounded-full mr-3"></span>
          Год покупки
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="bg-gray-50 rounded-lg p-4">
        <div className="px-2">
          <Slider 
            value={yearRange} 
            onValueChange={setYearRange} 
                      defaultValue={[2015, 2024]}
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
              </SidebarGroupContent>
            </SidebarGroup>

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
                          onChange={(e) => setSelectedCity(e.target.value)}
                          className="pl-10 h-9 text-sm bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">Радиус поиска</label>
                      <div className="px-2">
                        <Slider 
                          value={distanceRadius} 
                          onValueChange={setDistanceRadius} 
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
      </SidebarContent>
    </Sidebar>
  )
}

export { SidebarTrigger } from "@/components/ui/sidebar" 