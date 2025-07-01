"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { X, Plus, Camera, Upload } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useTelegramUser } from "@/hooks/useTelegramUser"
import { Id } from "../../../../convex/_generated/dataModel"
import Image from "next/image"

interface AddItemDialogProps {
  isOpen: boolean
  onClose: () => void
  onPostCreated?: () => void
  editingPost?: {
    id: string
    name: string
    brand: string
    price: number
    images: string[]
    condition: string
    year: number
    description: string
    category: string
    subcategory?: string
    defects: { description: string; location: string }[]
  } | null
}

interface ItemFormData {
  name: string
  brand: string | null
  price: string
  condition: string
  year: string
  description: string
  category: string
  subcategory: string
  images: Array<{
    file: File
    preview: string
    storageId?: Id<"_storage">
    uploading?: boolean
    isExisting?: boolean
    originalUrl?: string
  }>
  defects: Array<{
    description: string
    location: string
  }>
}


const conditions = ["Новое", "Как новое", "С дефектами"]



export default function AddItemDialog({ isOpen, onClose, onPostCreated, editingPost }: AddItemDialogProps) {
  const telegramUser = useTelegramUser()
  const createPost = useMutation(api.posts.createPost)
  const updatePost = useMutation(api.posts.updatePost)
  const updatePostWithMixedImages = useMutation(api.posts.updatePostWithMixedImages)
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl)
  const brands = useQuery(api.posts.getAllBrands) || []
  const categoryTree = useQuery(api.categories.getCategoryTree) || []
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<ItemFormData>({
    name: "",
    brand: null,
    price: "",
    condition: "",
    year: "",
    description: "",
    category: "",
    subcategory: "",
    images: [],
    defects: [],
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomBrand, setShowCustomBrand] = useState(false)
  const totalSteps = 4

  // Initialize form with editing data
  useEffect(() => {
    if (editingPost) {
      setFormData({
        name: editingPost.name,
        brand: editingPost.brand === "Без бренда" ? null : editingPost.brand,
        price: editingPost.price.toString(),
        condition: editingPost.condition,
        year: editingPost.year.toString(),
        description: editingPost.description,
        category: editingPost.category || "",
        subcategory: editingPost.subcategory || "",
        images: editingPost.images.map((url, index) => ({
          file: new File([], `existing-${index}`),
          preview: url,
          storageId: undefined,
          uploading: false,
          isExisting: true,
          originalUrl: url
        })),
        defects: editingPost.defects,
      })
    } else {
      setFormData({
        name: "",
        brand: null,
        price: "",
        condition: "",
        year: "",
        description: "",
        category: "",
        subcategory: "",
        images: [],
        defects: [],
      })
      setShowCustomBrand(false)
    }
  }, [editingPost])

  // Handle custom brand visibility when brands data changes
  useEffect(() => {
    if (editingPost && brands.length > 0) {
      setShowCustomBrand(editingPost.brand !== "Без бренда" && !brands.includes(editingPost.brand))
    }
  }, [editingPost, brands])

  const handleInputChange = (field: keyof ItemFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleBrandChange = (value: string) => {
    if (value === "custom") {
      setShowCustomBrand(true)
      setFormData(prev => ({ ...prev, brand: "" }))
    } else if (value === "no-brand") {
      setShowCustomBrand(false)
      setFormData(prev => ({ ...prev, brand: null }))
    } else {
      setShowCustomBrand(false)
      setFormData(prev => ({ ...prev, brand: value }))
    }
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return

    const newImages = Array.from(files).slice(0, 6 - formData.images.length).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: true
    }))

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }))

    for (let i = 0; i < newImages.length; i++) {
      const imageIndex = formData.images.length + i
      await uploadImage(newImages[i].file, imageIndex)
    }
  }

  const uploadImage = async (file: File, index: number) => {
    try {
      const uploadUrl = await generateUploadUrl()
      
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`)
      }

      const { storageId } = await result.json()

      setFormData(prev => ({
        ...prev,
        images: prev.images.map((img, i) => 
          i === index 
            ? { ...img, storageId: storageId as Id<"_storage">, uploading: false }
            : img
        )
      }))
    } catch (error) {
      console.error("Error uploading image:", error)
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }))
    }
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const addDefect = () => {
    setFormData((prev) => ({
      ...prev,
      defects: [...prev.defects, { description: "", location: "" }],
    }))
  }

  const updateDefect = (index: number, field: "description" | "location", value: string) => {
    setFormData((prev) => ({
      ...prev,
      defects: prev.defects.map((defect, i) => (i === index ? { ...defect, [field]: value } : defect)),
    }))
  }

  const removeDefect = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      defects: prev.defects.filter((_, i) => i !== index),
    }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const resetForm = () => {
    formData.images.forEach(img => {
      URL.revokeObjectURL(img.preview)
    })
    
    setFormData({
      name: "",
      brand: null,
      price: "",
      condition: "",
      year: "",
      description: "",
      category: "",
      subcategory: "",
      images: [],
      defects: [],
    })
    setShowCustomBrand(false)
    setCurrentStep(1)
  }

  const handleSubmit = async () => {
    if (!telegramUser?.userId) {
      console.error("No Telegram user found")
      return
    }

    const hasValidImages = editingPost 
      ? formData.images.length > 0
      : formData.images.some(img => img.storageId && !img.uploading)

    if (!hasValidImages) {
      console.error("No valid images found")
      return
    }

    setIsSubmitting(true)
    
    try {
      if (editingPost) {
        const newImageStorageIds = formData.images
          .filter(img => img.storageId && !img.isExisting && !img.uploading)
          .map(img => img.storageId!) as Id<"_storage">[]
        
        const existingImageUrls = formData.images
          .filter(img => img.isExisting && img.originalUrl)
          .map(img => img.originalUrl!)
        
        await updatePostWithMixedImages({
          postId: editingPost.id as Id<"posts">,
          telegramId: telegramUser.userId,
          name: formData.name,
          brand: formData.brand ?? undefined,
          price: parseInt(formData.price),
          condition: formData.condition,
          year: parseInt(formData.year),
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory || undefined,
          newImageStorageIds,
          existingImageUrls,
          defects: formData.defects.filter(defect => defect.description && defect.location),
        })
      } else {
        const uploadedImages = formData.images.filter(img => img.storageId && !img.uploading)
        const postId = await createPost({
          telegramId: telegramUser.userId,
          name: formData.name,
          brand: formData.brand ?? undefined,
          price: parseInt(formData.price),
          condition: formData.condition,
          year: parseInt(formData.year),
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory || undefined,
          images: uploadedImages.map(img => img.storageId!).filter(Boolean) as Id<"_storage">[],
          defects: formData.defects.filter(defect => defect.description && defect.location),
        })
        console.log("Post created successfully with ID:", postId)
        
        onPostCreated?.()
      }
      
      onClose()
      resetForm()
    } catch (error) {
      console.error("Error saving post:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceedStep1 = formData.name && (formData.brand === null || (formData.brand && formData.brand.trim() !== "")) && formData.category
  const canProceedStep2 = formData.price && formData.condition && formData.year
  const canProceedStep3 = editingPost 
    ? formData.images.length > 0 
    : formData.images.some(img => img.storageId && !img.uploading)
  const canSubmit = canProceedStep1 && canProceedStep2 && canProceedStep3 && formData.description

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl w-[95vw] h-[90vh] max-h-[90vh] p-0"
        style={{ 
          overflow: 'hidden', 
          wordWrap: 'break-word', 
          overflowWrap: 'break-word' 
        }}
      >
        <DialogHeader className="p-6 pb-3 border-b">
          <DialogTitle className="text-xl font-bold">
            {editingPost ? "Редактировать товар" : "Добавить товар на продажу"}
          </DialogTitle>
          <DialogDescription>
            {editingPost ? "Внесите изменения в информацию о товаре" : "Заполните информацию о товаре для публикации объявления"}
          </DialogDescription>
          <div className="flex items-center space-x-2 mt-4">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full ${index + 1 <= currentStep ? "bg-blue-600" : "bg-gray-200"}`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Шаг {currentStep} из {totalSteps}
          </p>
        </DialogHeader>

        <ScrollArea 
          className="flex-1 px-6 max-h-[calc(90vh-200px)]"
          style={{ overflowX: 'hidden' }}
        >
          <div 
            className=""
            style={{ 
              wordWrap: 'break-word', 
              overflowWrap: 'break-word',
              maxWidth: '100%',
              overflow: 'hidden'
            }}
          >
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Основная информация</h3>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="name">Название товара *</Label>
                      <Input
                        id="name"
                        placeholder="Например: Классическая сумка"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="w-full"
                        style={{ 
                          wordWrap: 'break-word', 
                          overflowWrap: 'break-word',
                          width: '100%',
                          maxWidth: '100%',
                          minWidth: '0'
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="brand">Бренд</Label>
                      
                      {!showCustomBrand ? (
                        <Select 
                          value={formData.brand === null ? "no-brand" : formData.brand || ""} 
                          onValueChange={handleBrandChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Выберите бренд" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-brand">Без бренда</SelectItem>
                            <SelectItem value="custom">Другой бренд</SelectItem>
                            {brands.map((brand) => (
                              <SelectItem key={brand} value={brand}>
                                {brand}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div>
                          <Input
                            placeholder="Введите название бренда"
                            value={formData.brand || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value || null }))}
                            className="w-full"
                          />
                          <div className="flex justify-end mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowCustomBrand(false)
                                setFormData(prev => ({ ...prev, brand: null }))
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 h-6 px-2"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Отменить
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="category">Категория *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => {
                          handleInputChange("category", value)
                          handleInputChange("subcategory", "")
                        }}
                      >
                        <SelectTrigger className="w-full" style={{ width: '100%', maxWidth: '100%', minWidth: '0' }}>
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryTree.map((category) => (
                            <SelectItem key={category._id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.category && (
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="subcategory">Подкатегория</Label>
                        <Select
                          value={formData.subcategory}
                          onValueChange={(value) => handleInputChange("subcategory", value)}
                        >
                          <SelectTrigger className="w-full" style={{ width: '100%', maxWidth: '100%', minWidth: '0' }}>
                            <SelectValue placeholder="Выберите подкатегорию" />
                          </SelectTrigger>
                          <SelectContent>
                            {(() => {
                              const selectedCategory = categoryTree.find(cat => cat.name === formData.category);
                              return selectedCategory?.children?.map((subcategory: any) => (
                                <SelectItem key={subcategory._id} value={subcategory.name}>
                                  {subcategory.name}
                                </SelectItem>
                              )) || [];
                            })()}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Price and Condition */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Цена и состояние</h3>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="price">Цена продажи (₽) *</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="85000"
                        value={formData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        className="w-full"
                        style={{ 
                          width: '100%',
                          maxWidth: '100%',
                          minWidth: '0'
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="condition">Состояние *</Label>
                      <Select
                        value={formData.condition}
                        onValueChange={(value) => handleInputChange("condition", value)}
                      >
                        <SelectTrigger className="w-full" style={{ width: '100%', maxWidth: '100%', minWidth: '0' }}>
                          <SelectValue placeholder="Выберите состояние" />
                        </SelectTrigger>
                        <SelectContent>
                          {conditions.map((condition) => (
                            <SelectItem key={condition} value={condition}>
                              {condition}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="year">Год покупки *</Label>
                      <Select value={formData.year} onValueChange={(value) => handleInputChange("year", value)}>
                        <SelectTrigger className="w-full" style={{ width: '100%', maxWidth: '100%', minWidth: '0' }}>
                          <SelectValue placeholder="Выберите год" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: new Date().getFullYear() - 1980 + 1 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Images and Defects */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Фотографии и дефекты</h3>

                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <Label>Фотографии товара *</Label>
                      <p className="text-xs text-gray-500 mb-3">Добавьте минимум 1 фотографию (макс. 6)</p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                      />

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={image.preview}
                              alt={`Фото ${index + 1}`}
                              width={200}
                              height={200}
                              className="w-full aspect-square object-cover rounded-lg border"
                            />
                            {image.uploading && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                <Upload className="h-6 w-6 text-white animate-pulse" />
                              </div>
                            )}
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                              onClick={() => removeImage(index)}
                              disabled={image.uploading}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}

                        {formData.images.length < 6 && (
                          <button
                            onClick={handleImageUpload}
                            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors"
                          >
                            <Camera className="h-6 w-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Добавить фото</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between mb-3">
                        <Label>Описание дефектов</Label>
                        <Button variant="outline" size="sm" onClick={addDefect}>
                          <Plus className="h-4 w-4 mr-1" />
                          Добавить дефект
                        </Button>
                      </div>

                      {formData.defects.length === 0 && (
                        <p className="text-sm text-gray-500 italic">Дефекты не указаны</p>
                      )}

                      <div className="max-h-80 overflow-y-auto space-y-3">
                        {formData.defects.map((defect, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <h4 className="font-medium">Дефект {index + 1}</h4>
                                <Button variant="ghost" size="sm" onClick={() => removeDefect(index)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="space-y-3">
                                <div className="flex flex-col gap-2">
                                  <Label>Расположение</Label>
                                  <Input
                                    placeholder="Например: Нижние углы сумки"
                                    value={defect.location}
                                    onChange={(e) => updateDefect(index, "location", e.target.value)}
                                    className="w-full"
                                    style={{ 
                                      width: '100%',
                                      maxWidth: '100%',
                                      minWidth: '0'
                                    }}
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label>Описание</Label>
                                  <Textarea
                                    placeholder="Например: Небольшие потертости на углах"
                                    value={defect.description}
                                    onChange={(e) => updateDefect(index, "description", e.target.value)}
                                    rows={2}
                                    className="resize-none w-full"
                                    style={{ 
                                      wordBreak: 'break-word',
                                      overflowWrap: 'break-word', 
                                      whiteSpace: 'pre-wrap',
                                      width: '100%',
                                      maxWidth: '100%',
                                      minWidth: '0',
                                      boxSizing: 'border-box'
                                    }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Description and Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Описание и проверка</h3>

                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="description">Подробное описание *</Label>
                      <Textarea
                        id="description"
                        placeholder="Расскажите подробнее о товаре: особенности, история покупки, причина продажи..."
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        rows={4}
                        className="resize-none w-full"
                        style={{ 
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                          width: '100%',
                          maxWidth: '100%',
                          minWidth: '0',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <h4 className="font-medium mb-3">Проверьте информацию</h4>
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-600 flex-shrink-0">Название:</span>
                            <span 
                              className="font-medium text-right min-w-0 max-w-[60%]"
                              style={{ 
                                wordWrap: 'break-word', 
                                overflowWrap: 'break-word',
                                hyphens: 'auto'
                              }}
                            >
                              {formData.name}
                            </span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-600 flex-shrink-0">Бренд:</span>
                            <span 
                              className="font-medium text-right min-w-0 max-w-[60%]"
                              style={{ 
                                wordWrap: 'break-word', 
                                overflowWrap: 'break-word',
                                hyphens: 'auto'
                              }}
                            >
                              {formData.brand || "Без бренда"}
                            </span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-600 flex-shrink-0">Цена:</span>
                            <span className="font-medium text-right min-w-0">
                              {formData.price ? `${Number.parseInt(formData.price).toLocaleString()} ₽` : "-"}
                            </span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-600 flex-shrink-0">Состояние:</span>
                            <span 
                              className="font-medium text-right min-w-0 max-w-[60%]"
                              style={{ 
                                wordWrap: 'break-word', 
                                overflowWrap: 'break-word',
                                hyphens: 'auto'
                              }}
                            >
                              {formData.condition}
                            </span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-600 flex-shrink-0">Фотографий:</span>
                            <span className="font-medium text-right">{formData.images.filter(img => img.storageId).length}</span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-600 flex-shrink-0">Дефектов:</span>
                            <span className="font-medium text-right">{formData.defects.length}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t">
          <div className="flex justify-between">
            <Button variant="outline" onClick={currentStep === 1 ? onClose : handlePrevious}>
              {currentStep === 1 ? "Отмена" : "Назад"}
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !canProceedStep1) ||
                  (currentStep === 2 && !canProceedStep2) ||
                  (currentStep === 3 && !canProceedStep3)
                }
              >
                Далее
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
                {isSubmitting 
                  ? (editingPost ? "Сохраняем..." : "Публикуем...") 
                  : (editingPost ? "Сохранить изменения" : "Опубликовать товар")
                }
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}  