"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Lock, ArrowLeft, Shield, Truck, CreditCard, Info } from 'lucide-react'
import { PLATFORM_FEE_RATE, computePlatformFee } from "@/config/fees"
import { useCart } from "@/contexts/CartContext"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useTelegramUser } from "@/hooks/useTelegramUser"

type DeliveryOption = {
  code: string
  label: string
  description: string
  cost: number
  eta: string
}

const DELIVERY_OPTIONS: DeliveryOption[] = [
  { code: "courier", label: "Курьером", description: "Доставка до двери", cost: 500, eta: "1-3 дня" },
  { code: "pickup", label: "Самовывоз", description: "Пункт выдачи рядом с вами", cost: 0, eta: "Сегодня/завтра" },
  { code: "post", label: "Почта РФ", description: "Отправление 1 класса", cost: 350, eta: "3-7 дней" },
]

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams<{ orderId: string }>()
  const searchParams = useSearchParams()
  const quantity = Math.max(1, Number.parseInt(searchParams.get("quantity") || "1"))

  const { cartItems } = useCart()
  const item = useMemo(() => cartItems.find((i) => i.postId === params.orderId), [cartItems, params.orderId])

  // Current user for prefill
  const telegramUser = useTelegramUser()
  const currentUser = useQuery(
    api.users.getUserByTelegramId,
    telegramUser?.userId ? { telegramId: telegramUser.userId } : "skip"
  )

  // Simple buyer form state
  const [buyerName, setBuyerName] = useState("")
  const [buyerPhone, setBuyerPhone] = useState("")
  const [city, setCity] = useState("")
  const [address, setAddress] = useState("")
  const [deliveryCode, setDeliveryCode] = useState<DeliveryOption["code"]>("courier")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isCdekOpen, setIsCdekOpen] = useState(false)
  const [cdekPoint, setCdekPoint] = useState<null | { code: string; address: string; city: string; pvzId?: string }>(null)

  const delivery = DELIVERY_OPTIONS.find((d) => d.code === deliveryCode) || DELIVERY_OPTIONS[0]

  const subtotal = item ? item.price * quantity : 0
  const platformFee = computePlatformFee(subtotal)
  const deliveryCost = deliveryCode === 'pickup' && cdekPoint ? 0 : delivery.cost
  const total = subtotal + platformFee + deliveryCost

  // Prefill from current user but keep fields editable
  useEffect(() => {
    if (!currentUser) return
    if (!buyerName) {
      const fullName = `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
      if (fullName) setBuyerName(fullName)
    }
    if (!city && currentUser.city) setCity(currentUser.city)
    if (!address && currentUser.deliveryAddress) setAddress(currentUser.deliveryAddress)
  }, [currentUser])

  // Debug: log delivery method selection
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[CDEK] delivery method selected:', deliveryCode)
    if (deliveryCode === 'pickup') {
      // eslint-disable-next-line no-console
      console.log('[CDEK] pickup selected; PVZ button should be visible')
    }
  }, [deliveryCode])

  // Initialize widget when overlay opens
  useEffect(() => {
    if (!isCdekOpen) return
    const WidgetCtor = (window as any).CDEKWidget
    if (!WidgetCtor) {
      console.error('[CDEK] CDEKWidget not found on window')
      return
    }
    try {
      const apiKey: string | undefined = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY as any
      // Use PHP service.php if provided, otherwise fallback to internal API route
      const servicePath: string | undefined = process.env.NEXT_PUBLIC_CDEK_SERVICE_PATH || '/api/cdek/service'
      if (!apiKey) console.error('[CDEK] Missing NEXT_PUBLIC_YANDEX_MAPS_API_KEY')
      if (!servicePath) console.error('[CDEK] Missing servicePath')
      console.log('[CDEK] init', { apiKey: !!apiKey, servicePath })
      // eslint-disable-next-line no-unused-vars
      const widgetInstance = new WidgetCtor({
        root: 'cdek-widget-container',
        apiKey: apiKey || '',
        servicePath: servicePath || '',
        defaultLocation: city || 'Москва',
        from: 'Москва',
        country: 'rus',
        goods: [{ length: 10, width: 10, height: 10, weight: 500 }],
        onChoose: (point: any) => {
          setCdekPoint({
            code: point.code || point.id || '',
            address: point.address || point.PVZ?.Address || '',
            city: point.city || point.cityName || (city || ''),
            pvzId: point.id || point.PVZ?.Code,
          })
          setIsCdekOpen(false)
        },
      })
      console.log('[CDEK] widgetInstance created')
    } catch (e) {
      console.error('CDEK widget init failed', e)
    }
  }, [isCdekOpen, city])

  const canPay =
    !!item &&
    buyerName.trim().length > 1 &&
    buyerPhone.trim().length >= 10 &&
    city.trim().length > 1 &&
    address.trim().length > 5

  const handlePay = () => {
    if (!item) return
    // Here you would trigger your payment flow with escrow.
    console.log("Initiating escrow payment:", {
      postId: item.postId,
      quantity,
      buyerName,
      buyerPhone,
      city,
      address,
      delivery: deliveryCode,
      paymentMethod,
      amount: total,
    })
    // Navigate to messages with the seller or an order confirmation page
    router.push(`/messages`)
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Оформление заказа</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Товар не найден</p>
                  <p className="text-sm text-gray-600">
                    Похоже, этого товара нет в вашей корзине. Вернитесь и добавьте его снова.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => router.push("/")}>На главную</Button>
                    <Button variant="outline" onClick={() => router.push("/cart")}>
                      Корзина
                    </Button>
                  </div>
                </div>
                
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (<>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Оформление заказа</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Item and Buyer info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Item Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Товар</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-lg overflow-hidden border">
                  {/* Use native img for Next.js consistency */}
                  <img
                    src={item.image || "/placeholder.svg?height=160&width=160&query=product"}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.brand}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-semibold">{item.price.toLocaleString()} ₽</span>
                    <Badge variant="secondary" className="text-xs">
                      x{quantity}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{(item.price * quantity).toLocaleString()} ₽</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buyer Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Данные покупателя</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Имя и фамилия</label>
                  <Input
                    placeholder="Например: Анна Козлова"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Телефон</label>
                  <Input
                    placeholder="+7 999 123-45-67"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Город</label>
                  <Input placeholder="Москва" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Адрес</label>
                  <Input placeholder="Улица, дом, квартира" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Способ доставки</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Выберите способ</label>
                  <Select value={deliveryCode} onValueChange={(v) => setDeliveryCode(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Способ доставки" />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIVERY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.code} value={opt.code}>
                          {opt.label} • {opt.eta} {opt.cost > 0 ? `• ${opt.cost.toLocaleString()} ₽` : "• бесплатно"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="border rounded-md p-3 bg-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Truck className="h-4 w-4" />
                    <span>{DELIVERY_OPTIONS.find((d) => d.code === deliveryCode)?.label}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {DELIVERY_OPTIONS.find((d) => d.code === deliveryCode)?.description} •{" "}
                    {delivery.eta}
                  </div>
                  <div className="font-medium mt-2">{delivery.cost.toLocaleString()} ₽</div>
                </div>
              </div>

              {deliveryCode === 'pickup' && (
                <div className="mt-3 space-y-2">
                  <Button variant="outline" onClick={() => { console.log('[CDEK] opening widget overlay'); setIsCdekOpen(true) }}>
                    Выбрать пункт выдачи CDEK
                  </Button>
                  <div className="text-sm text-gray-700">
                    {cdekPoint ? (
                      <>
                        <div>ПВЗ: <span className="font-medium">{cdekPoint.address}</span></div>
                        {cdekPoint.city && (<div>Город: <span className="font-medium">{cdekPoint.city}</span></div>)}
                        {cdekPoint.pvzId && (<div>Код ПВЗ: <span className="font-medium">{cdekPoint.pvzId}</span></div>)}
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">Пункт выдачи не выбран</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Summary and payment */}
        <div className="space-y-4">
          {/* Escrow Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Безопасная сделка</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-2">
                  <Shield className="h-4 w-4 text-green-700" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Средства замораживаются на эскроу-счёте до подтверждения получения товара. После подтверждения деньги
                  автоматически переводятся продавцу.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Способ оплаты</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите способ оплаты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Банковская карта</SelectItem>
                  <SelectItem value="sbp">СБП</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <div className="flex items-center justify-center h-8 px-2 rounded bg-blue-600 text-white text-xs font-bold">
                  VISA
                </div>
                <div className="flex items-center justify-center h-8 px-2 rounded bg-red-600 text-white text-xs font-bold">
                  MC
                </div>
                <div className="flex items-center justify-center h-8 px-2 rounded bg-yellow-500 text-white text-xs font-bold">
                  МИР
                </div>
                <div className="flex items-center justify-center h-8 px-2 rounded bg-purple-600 text-white text-xs font-bold">
                  SBP
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Итого</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Товары ({quantity})</span>
                <span className="font-medium">{subtotal.toLocaleString()} ₽</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  Комиссия платформы ({Math.round(PLATFORM_FEE_RATE * 100)}%)
                </span>
                <span className="font-medium">{platformFee.toLocaleString()} ₽</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Доставка</span>
                <span className="font-medium">{deliveryCost.toLocaleString()} ₽</span>
              </div>
              <div className="border-t pt-2 mt-2 flex items-center justify-between">
                <span className="font-semibold">К оплате</span>
                <span className="text-lg font-bold">{total.toLocaleString()} ₽</span>
              </div>

              <Button
                className="w-full mt-3"
                size="lg"
                onClick={handlePay}
                disabled={!canPay}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Оплатить
              </Button>
             
              {!canPay && (
                <p className="text-xs text-gray-500 mt-2">
                  Заполните имя, телефон, город и адрес доставки, чтобы продолжить.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    {isCdekOpen && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setIsCdekOpen(false)}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Выбор пункта выдачи CDEK</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsCdekOpen(false)}>Закрыть</Button>
          </div>
          <div id="cdek-widget-container" className="w-full h-[560px] border rounded" />
        </div>
      </div>
    )}
  </>)
}

