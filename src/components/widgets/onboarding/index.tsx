"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronRight, MapPin, FileText, CheckCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTelegramUser } from "@/hooks/useTelegramUser"
import { api } from "../../../../convex/_generated/api"
import { FullScreenLoader } from "@/components/shared/loader"

interface OnboardingData {
  city: string
  address: string
  agreed: boolean
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingData>({
    city: "",
    address: "",
    agreed: false,
  })
  const [isCompleting, setIsCompleting] = useState(false)

  const router = useRouter()
  const { userId, userFirstName, userLastName, userName, userLanguage } = useTelegramUser()
  
  const existingUser = useQuery(
    api.users.getUserByTelegramId,
    userId ? { telegramId: userId } : 'skip'
  )
  
  const completeOnboarding = useMutation(api.users.completeOnboarding)

  useEffect(() => {
    if (existingUser?.onboardingCompleted) {
      router.push("/")
    }
  }, [existingUser, router])

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleInputChange = (field: keyof OnboardingData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCompleteOnboarding = async () => {
    if (!userId || !userFirstName || !canProceedFromStep3) return
    
    setIsCompleting(true)
    try {
      await completeOnboarding({
        telegramId: userId,
        firstName: userFirstName,
        lastName: userLastName,
        username: userName,
        languageCode: userLanguage,
        city: formData.city,
        deliveryAddress: formData.address,
      })
      setCurrentStep(4)
    } catch (error) {
      console.error("Failed to complete onboarding:", error)
    } finally {
      setIsCompleting(false)
    }
  }

  const handleFinish = () => {
    router.push("/")
  }

  if (!userId || !userFirstName) {
    return <FullScreenLoader text="Инициализация..." />
  }

  if (existingUser === undefined) {
    return <FullScreenLoader text="Загрузка профиля..." />
  }

  const canProceedFromStep2 = formData.city.trim() !== "" && formData.address.trim() !== ""
  const canProceedFromStep3 = formData.agreed

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <Progress value={(currentStep / 4) * 100} className="h-2" />
          <p className="mt-2 text-center text-sm text-gray-600">Шаг {currentStep} из 4</p>
        </div>

        {currentStep === 1 && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <ChevronRight className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Добро пожаловать!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-gray-600">
                Добро пожаловать в маркетплейс брендовых вещей! Давайте настроим ваш профиль для удобных покупок и
                продаж.
              </p>
              <Button onClick={handleNext} className="w-full" size="lg">
                Начать регистрацию
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Укажите ваше местоположение</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="city">Город проживания</Label>
                <Select value={formData.city} onValueChange={(value) => handleInputChange("city", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите ваш город" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Смоленск">Смоленск</SelectItem>
                    <SelectItem value="Москва">Москва</SelectItem>
                    <SelectItem value="Санкт-Петербург">Санкт-Петербург</SelectItem>
                    <SelectItem value="Новосибирск">Новосибирск</SelectItem>
                    <SelectItem value="Екатеринбург">Екатеринбург</SelectItem>
                    <SelectItem value="Казань">Казань</SelectItem>
                    <SelectItem value="Нижний Новгород">Нижний Новгород</SelectItem>
                    <SelectItem value="Челябинск">Челябинск</SelectItem>
                    <SelectItem value="Самара">Самара</SelectItem>
                    <SelectItem value="Омск">Омск</SelectItem>
                    <SelectItem value="Ростов-на-Дону">Ростов-на-Дону</SelectItem>
                    <SelectItem value="Уфа">Уфа</SelectItem>
                    <SelectItem value="Красноярск">Красноярск</SelectItem>
                    <SelectItem value="Воронеж">Воронеж</SelectItem>
                    <SelectItem value="Пермь">Пермь</SelectItem>
                    <SelectItem value="Волгоград">Волгоград</SelectItem>
                    <SelectItem value="Краснодар">Краснодар</SelectItem>
                    <SelectItem value="Саратов">Саратов</SelectItem>
                    <SelectItem value="Тюмень">Тюмень</SelectItem>
                    <SelectItem value="Тольятти">Тольятти</SelectItem>
                    <SelectItem value="Ижевск">Ижевск</SelectItem>
                    <SelectItem value="Другой город">Другой город</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Адрес доставки</Label>
                <Textarea
                  id="address"
                  placeholder="Укажите полный адрес для доставки товаров"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <Button onClick={handleNext} className="w-full" size="lg" disabled={!canProceedFromStep2}>
                Продолжить
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Пользовательское соглашение</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-48 rounded-lg border bg-gray-50 p-4">
                <div className="text-sm text-gray-700">
                  <h4 className="mb-2 font-semibold">Условия использования</h4>
                  <p className="mb-3">
                    Добро пожаловать на платформу торговли брендовыми вещами. Используя наш сервис, вы соглашаетесь с
                    следующими условиями:
                  </p>
                  <ul className="mb-3 list-disc space-y-1 pl-4">
                    <li>Все товары проходят проверку на подлинность</li>
                    <li>Платежи осуществляются через эскроу-сервис</li>
                    <li>Продавец несет ответственность за качество товара</li>
                    <li>Возврат возможен в течение 3 дней после получения</li>
                    <li>Запрещена продажа подделок и контрафакта</li>
                  </ul>
                  <h4 className="mb-2 font-semibold">Обработка персональных данных</h4>
                  <p className="mb-3">
                    Мы обрабатываем ваши персональные данные в соответствии с законодательством РФ для обеспечения
                    работы сервиса.
                  </p>
                  <p>Полный текст соглашения доступен на нашем сайте.</p>
                </div>
              </ScrollArea>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="agreement"
                  checked={formData.agreed}
                  onCheckedChange={(checked) => handleInputChange("agreed", checked as boolean)}
                />
                <Label htmlFor="agreement" className="text-sm">
                  Я согласен(на) с условиями пользовательского соглашения
                </Label>
              </div>
              <Button 
                onClick={handleCompleteOnboarding} 
                className="w-full" 
                size="lg" 
                disabled={!canProceedFromStep3 || isCompleting}
              >
                {isCompleting ? "Сохранение..." : "Согласен(на)"}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Регистрация завершена!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-1">
                    <p>
                      <strong>Город:</strong> {formData.city}
                    </p>
                    <p>
                      <strong>Адрес:</strong> {formData.address}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
              <p className="text-center text-gray-600">
                Теперь вы можете покупать и продавать брендовые вещи на нашей платформе!
              </p>
              <Button onClick={handleFinish} className="w-full" size="lg">
                Перейти к покупкам
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
