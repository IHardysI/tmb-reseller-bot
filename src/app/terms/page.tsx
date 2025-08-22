"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  Users,
  CreditCard,
  MessageSquare,
  Ban,
  Scale,
  FileText,
  Clock,
  Eye,
  ChevronRight,
  ChevronDown,
  Mail,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function TermsPage() {
  const router = useRouter()
  const [expandedSections, setExpandedSections] = useState<string[]>(["overview"])

  const handleBack = () => {
    router.back()
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    )
  }

  const lastUpdated = "1 марта 2024 г."

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold">Пользовательское соглашение</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2 ml-11">Последнее обновление: {lastUpdated}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-600" />
              <span>Краткий обзор</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 leading-relaxed mb-3">
                Добро пожаловать на платформу торговли брендовыми товарами! Мы создали безопасную среду для покупки и продажи оригинальных вещей.
              </p>
              <div className="flex justify-between items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700">Эскроу-платежи</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700">Система рейтингов</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="space-y-1">
              <Collapsible open={expandedSections.includes("general")} onOpenChange={() => toggleSection("general")}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Scale className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <h3 className="font-semibold">1. Общие положения</h3>
                        <p className="text-sm text-gray-600">Основные условия использования платформы</p>
                      </div>
                    </div>
                    {expandedSections.includes("general") ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">1.1 Принятие условий</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Используя нашу платформу, вы соглашаетесь соблюдать настоящие условия использования. Если вы не согласны с какими-либо условиями, пожалуйста, не используйте наш сервис.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">1.2 Возрастные ограничения</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Для использования платформы вам должно быть не менее 18 лет. Лица младше 18 лет могут использовать сервис только под наблюдением родителей или законных представителей.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">1.3 Изменения условий</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Мы оставляем за собой право изменять эти условия в любое время. Об изменениях мы уведомим вас через платформу или по электронной почте за 7 дней до вступления в силу.
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible
                open={expandedSections.includes("responsibilities")}
                onOpenChange={() => toggleSection("responsibilities")}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-t">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-green-600" />
                      <div className="text-left">
                        <h3 className="font-semibold">2. Обязанности пользователей</h3>
                        <p className="text-sm text-gray-600">Что вы должны делать при использовании платформы</p>
                      </div>
                    </div>
                    {expandedSections.includes("responsibilities") ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-green-800">2.1 Для продавцов</h4>
                      <ul className="space-y-2 text-sm text-green-700">
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Продавать только оригинальные брендовые товары</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Предоставлять точные описания и фотографии товаров</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Указывать все дефекты и особенности товара</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Отправлять товар в течение 3 рабочих дней после оплаты</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Предоставлять документы подтверждения подлинности при запросе</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-blue-800">2.2 Для покупателей</h4>
                      <ul className="space-y-2 text-sm text-blue-700">
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Внимательно изучать описания товаров перед покупкой</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Подтверждать получение товара в течение 3 дней</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Сообщать о проблемах с товаром немедленно</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Оставлять честные отзывы о сделках</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-3">2.3 Общие обязанности</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Предоставлять достоверную информацию о себе</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Поддерживать вежливое общение с другими пользователями</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Соблюдать законодательство Российской Федерации</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Защищать свои учетные данные от несанкционированного доступа</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible
                open={expandedSections.includes("prohibited")}
                onOpenChange={() => toggleSection("prohibited")}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-t">
                    <div className="flex items-center space-x-3">
                      <Ban className="h-5 w-5 text-red-600" />
                      <div className="text-left">
                        <h3 className="font-semibold">3. Запрещенные действия</h3>
                        <p className="text-sm text-gray-600">Что категорически нельзя делать на платформе</p>
                      </div>
                    </div>
                    {expandedSections.includes("prohibited") ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-red-800">3.1 Запрещенные товары</h4>
                      <ul className="space-y-2 text-sm text-red-700">
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Подделки и контрафактные товары</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Товары с поддельными документами</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Украденные или незаконно полученные вещи</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Товары, запрещенные к продаже в РФ</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-orange-800">3.2 Запрещенные действия</h4>
                      <ul className="space-y-2 text-sm text-orange-700">
                        <li className="flex items-start space-x-2">
                          
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Обход эскроу-системы и прямые платежи</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Перевод общения в внешние мессенджеры</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Организация встреч без использования платформы</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Создание фальшивых отзывов и рейтингов</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Использование чужих фотографий товаров</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Спам, реклама сторонних ресурсов</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-purple-800">3.3 Мошеннические схемы</h4>
                      <ul className="space-y-2 text-sm text-purple-700">
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Попытки получения личных данных других пользователей</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Создание множественных аккаунтов для обмана</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Попытки взлома или нарушения работы системы</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Угрозы, шантаж, вымогательство</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={expandedSections.includes("payments")} onOpenChange={() => toggleSection("payments")}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-t">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      <div className="text-left">
                        <h3 className="font-semibold">4. Платежи и эскроу</h3>
                        <p className="text-sm text-gray-600">Правила проведения безопасных платежей</p>
                      </div>
                    </div>
                    {expandedSections.includes("payments") ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-blue-800">4.1 Эскроу-система</h4>
                      <p className="text-sm text-blue-700 leading-relaxed mb-3">
                        Платежи на платформе проходят через эскроу-систему — это означает, что деньги временно удерживаются до получения товара покупателем.
                      </p>
                      <ul className="space-y-2 text-sm text-blue-700">
                        <li className="flex items-start space-x-2">
                          <CreditCard className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Средства блокируются до подтверждения получения товара</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CreditCard className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Перевод продавцу происходит после подтверждения покупателем</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CreditCard className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Возможность возврата при обоснованных претензиях</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-amber-800">4.2 Важные ограничения</h4>
                      <p className="text-sm text-amber-700 leading-relaxed mb-3">
                        Эскроу снижает риски, но не исключает их полностью:
                      </p>
                      <ul className="space-y-2 text-sm text-amber-700">
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Не защищает от всех видов мошенничества</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Споры решаются на основе предоставленных доказательств</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Возврат средств возможен не во всех случаях</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Тщательно проверяйте товар перед подтверждением получения</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-3">4.3 Комиссии и сроки</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start space-x-2">
                          <CreditCard className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Комиссия эскроу: 3% от суммы сделки</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CreditCard className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Комиссия взимается с покупателя при оплате</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Срок для подтверждения получения: 3 дня</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Автоматический перевод продавцу при отсутствии претензий</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-red-800">4.4 Ваша ответственность</h4>
                      <p className="text-sm text-red-700 leading-relaxed">
                        Помните: эскроу — это инструмент, а не гарантия. Всегда проявляйте осторожность, изучайте продавца, задавайте вопросы и внимательно проверяйте товар при получении.
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible
                open={expandedSections.includes("communication")}
                onOpenChange={() => toggleSection("communication")}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-t">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-5 w-5 text-indigo-600" />
                      <div className="text-left">
                        <h3 className="font-semibold">5. Правила общения</h3>
                        <p className="text-sm text-gray-600">Как правильно общаться на платформе</p>
                      </div>
                    </div>
                    {expandedSections.includes("communication") ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-indigo-800">5.1 Обязательные правила</h4>
                      <ul className="space-y-2 text-sm text-indigo-700">
                        <li className="flex items-start space-x-2">
                          <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Все переговоры должны вестись через встроенный чат</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Запрещено передавать контакты внешних мессенджеров</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Соблюдайте вежливость и уважение к собеседнику</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Не используйте нецензурную лексику</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-red-800">5.2 Автоматическая модерация</h4>
                      <p className="text-sm text-red-700 leading-relaxed mb-3">
                        Наша система автоматически отслеживает подозрительные сообщения:
                      </p>
                      <ul className="space-y-2 text-sm text-red-700">
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Упоминания внешних мессенджеров (WhatsApp, Telegram, и др.)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Номера телефонов и email-адреса</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Предложения прямых платежей</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Организация встреч вне платформы</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible
                open={expandedSections.includes("consequences")}
                onOpenChange={() => toggleSection("consequences")}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-t">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div className="text-left">
                        <h3 className="font-semibold">6. Последствия нарушений</h3>
                        <p className="text-sm text-gray-600">Что происходит при нарушении правил</p>
                      </div>
                    </div>
                    {expandedSections.includes("consequences") ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-yellow-800">6.1 Система предупреждений</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            1-е нарушение
                          </Badge>
                          <span className="text-sm text-yellow-700">Предупреждение и объяснение правил</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                            2-е нарушение
                          </Badge>
                          <span className="text-sm text-orange-700">Временная блокировка на 7 дней</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                            3-е нарушение
                          </Badge>
                          <span className="text-sm text-red-700">Постоянная блокировка аккаунта</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-red-800">6.2 Серьезные нарушения</h4>
                      <p className="text-sm text-red-700 leading-relaxed">
                        За следующие нарушения блокировка применяется немедленно:
                      </p>
                      <ul className="space-y-2 text-sm text-red-700">
                        <li className="flex items-start space-x-2">
                          <Ban className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Продажа подделок и контрафакта</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Ban className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Мошенничество и обман покупателей</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Ban className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Угрозы и шантаж других пользователей</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Ban className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Попытки взлома системы</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-blue-800">6.3 Процедура обжалования</h4>
                      <ul className="space-y-2 text-sm text-blue-700">
                        <li className="flex items-start space-x-2">
                          <Scale className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Право подать апелляцию в течение 7 дней</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Scale className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Рассмотрение жалобы в течение 3-5 рабочих дней</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Scale className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Возможность предоставить доказательства невиновности</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={expandedSections.includes("rights")} onOpenChange={() => toggleSection("rights")}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-t">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-gray-600" />
                      <div className="text-left">
                        <h3 className="font-semibold">7. Права и ограничения</h3>
                        <p className="text-sm text-gray-600">Ваши права и ограничения ответственности</p>
                      </div>
                    </div>
                    {expandedSections.includes("rights") ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-green-800">7.1 Ваши права</h4>
                      <ul className="space-y-2 text-sm text-green-700">
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Безопасные платежи через эскроу-систему</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Защита персональных данных</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Техническая поддержка пользователей</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Возврат средств при проблемах с товаром</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-3">7.2 Ограничения ответственности</h4>
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        Платформа выступает посредником между покупателями и продавцами. Мы не несем ответственности за:
                      </p>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Качество товаров (ответственность продавца)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Действия пользователей вне платформы</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Технические сбои интернет-провайдеров</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Форс-мажорные обстоятельства</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span>Контактная информация</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 leading-relaxed mb-3">
                По всем вопросам, связанным с пользовательским соглашением, обращайтесь:
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">support@reseller-market.ru</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Время работы: Пн-Пт 9:00-18:00 (МСК)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
      </div>
    </div>
  )
}
