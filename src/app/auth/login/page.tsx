"use client"

import type React from "react"
import { useState } from "react"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Home, FileText, ArrowRight, ArrowLeft, User } from "lucide-react"
import { useTelegramUser } from "@/hooks/useTelegramUser"
import { api } from "../../../../convex/_generated/api"

const cities = [
  "Москва",
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
  "Нижний Новгород",
  "Челябинск",
  "Самара",
  "Омск",
  "Ростов-на-Дону",
  "Уфа",
  "Красноярск",
  "Воронеж",
  "Пермь",
  "Волгоград",
  "Смоленск",
]

interface FormData {
  city: string
  address: string
  agreedToTerms: boolean
}

export default function LoginPage() {
  const { user, userId, userFirstName, userLastName, userName, userLanguage, isUserAvailable } = useTelegramUser()
  const [step, setStep] = useState<"details" | "agreement">("details")
  const [formData, setFormData] = useState<FormData>({
    city: "",
    address: "",
    agreedToTerms: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const createUser = useMutation(api.users.createUser)

  console.log(user)

  if (!isUserAvailable || !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm max-w-md w-full">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-600">Загружаем...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep("agreement")
  }

  const handleFinalSubmit = async () => {
    if (!userId || !userFirstName) return
    
    setIsLoading(true)
    try {
      await createUser({
        telegramId: userId,
        firstName: userFirstName,
        lastName: userLastName || "",
        username: userName || "",
        languageCode: userLanguage || "",
        city: formData.city,
        deliveryAddress: formData.address,
      })
      router.push("/")
    } catch (error) {
      console.error("Error creating user:", error)
      setIsLoading(false)
    }
  }

  const renderDetailsStep = () => (
    <form onSubmit={handleDetailsSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-blue-900">Привет, {userFirstName}!</p>
            <p className="text-sm text-blue-700">Давайте настроим ваш профиль</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Город проживания</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
            <SelectTrigger className="pl-10">
              <SelectValue placeholder="Выберите ваш город" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-gray-500">Это поможет показывать товары рядом с вами</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Адрес доставки</Label>
        <div className="relative">
          <Home className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <Textarea
            id="address"
            placeholder="Укажите полный адрес для доставки товаров&#10;Например: ул. Тверская, д. 1, кв. 10"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="pl-10 min-h-[100px] resize-none"
            required
          />
        </div>
        <p className="text-xs text-gray-500">Этот адрес будет использоваться для доставки</p>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={!formData.city || !formData.address.trim()}>
        <div className="flex items-center space-x-2">
          <span>Продолжить</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </Button>
    </form>
  )

  const renderAgreementStep = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto border">
        <h3 className="font-semibold mb-4 flex items-center text-lg">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          Пользовательское соглашение
        </h3>
        <div className="text-sm text-gray-700 space-y-4 leading-relaxed">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">1. Общие положения</h4>
            <p>
              Настоящее соглашение регулирует отношения между пользователем и сервисом BrandSwap при использовании
              платформы для торговли брендовыми вещами через Telegram-бот.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">2. Безопасность сделок</h4>
            <p>
              Все платежи проходят через систему эскроу. Средства передаются продавцу только после подтверждения
              получения товара покупателем.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">3. Комиссия сервиса</h4>
            <p>При успешной продаже взимается комиссия в размере 8% от суммы сделки.</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={formData.agreedToTerms}
            onCheckedChange={(checked) => setFormData({ ...formData, agreedToTerms: !!checked })}
            className="mt-1"
          />
          <Label htmlFor="terms" className="text-sm leading-relaxed text-blue-900">
            Я согласен(на) с условиями пользовательского соглашения
          </Label>
        </div>
      </div>

      <Button onClick={handleFinalSubmit} className="w-full" size="lg" disabled={!formData.agreedToTerms || isLoading}>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Завершаем...</span>
          </div>
        ) : (
          "Согласен"
        )}
      </Button>

      <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("details")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm max-w-md w-full">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <div className={`w-3 h-3 rounded-full ${step === "details" ? "bg-blue-600" : "bg-green-500"}`} />
            <div className="w-8 h-0.5 bg-gray-300">
              <div
                className={`h-full bg-blue-600 transition-all duration-300 ${step === "agreement" ? "w-full" : "w-0"}`}
              />
            </div>
            <div className={`w-3 h-3 rounded-full ${step === "agreement" ? "bg-blue-600" : "bg-gray-300"}`} />
          </div>
          <CardTitle className="text-2xl font-bold">{step === "details" ? "Добро пожаловать!" : "Соглашение"}</CardTitle>
          <CardDescription className="text-gray-600">
            {step === "details" ? "Укажите город и адрес" : "Ознакомьтесь с условиями"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === "details" && renderDetailsStep()}
          {step === "agreement" && renderAgreementStep()}
        </CardContent>
      </Card>
    </div>
  )
}