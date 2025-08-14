"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  Ban,
  CheckCircle,
  X,
  Search,
  Clock,
  User,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Phone,
  CreditCard,
  Users,
  ExternalLink,
  UserX,
  Calendar,
  Hash,
  Unlock,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useUserStore } from "@/stores/userStore"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ModerationWarning {
  id: string
  messageId: string
  chatId: string
  senderId: string
  receiverId: string
  messageContent: string
  detectedKeywords: string[]
  riskLevel: "low" | "medium" | "high"
  warningType:
    | "external_communication"
    | "direct_payment"
    | "personal_meeting"
    | "bypass_platform"
    | "suspicious_contact"
  status: "pending" | "reviewed" | "dismissed" | "action_taken"
  reviewedBy?: string
  reviewedAt?: string
  actionTaken?: string
  notes?: string
  createdAt: string
  senderName: string
  senderAvatar: string
  receiverName: string
  receiverAvatar: string
  itemName: string
  lastSuspiciousMessage?: string
  lastSuspiciousTimestamp?: string
}

interface ModerationStats {}

interface ModerationPageProps {
  onBack?: () => void
}

const mockStats: ModerationStats = {}

const mockWarnings: ModerationWarning[] = [
  {
    id: "1",
    messageId: "msg1",
    chatId: "chat1",
    senderId: "user1",
    receiverId: "user2",
    messageContent: "Давайте встретимся лично, заплачу наличными без комиссии. Мой номер +7 999 123-45-67",
    detectedKeywords: ["наличные", "без комиссии", "+7 999 123-45-67", "встретимся лично"],
    riskLevel: "high",
    warningType: "direct_payment",
    status: "pending",
    createdAt: "2024-02-29T14:30:00",
    senderName: "Алексей М.",
    senderAvatar: "/placeholder.svg?height=40&width=40",
    receiverName: "Мария К.",
    receiverAvatar: "/placeholder.svg?height=40&width=40",
    itemName: "iPhone 15 Pro Max",
    lastSuspiciousMessage:
      "Можем встретиться завтра у метро, переведу деньги сразу на карту без всяких комиссий платформы",
    lastSuspiciousTimestamp: "2024-02-29T15:45:00",
  },
  {
    id: "2",
    messageId: "msg2",
    chatId: "chat2",
    senderId: "user3",
    receiverId: "user4",
    messageContent: "Напиши мне в WhatsApp, там удобнее общаться",
    detectedKeywords: ["WhatsApp"],
    riskLevel: "medium",
    warningType: "external_communication",
    status: "pending",
    createdAt: "2024-02-29T13:15:00",
    senderName: "Дмитрий П.",
    senderAvatar: "/placeholder.svg?height=40&width=40",
    receiverName: "Анна С.",
    receiverAvatar: "/placeholder.svg?height=40&width=40",
    itemName: "Сумка Louis Vuitton",
    lastSuspiciousMessage: "Скинь свой Telegram, в WhatsApp проще фотки отправлять",
    lastSuspiciousTimestamp: "2024-02-29T14:20:00",
  },
  {
    id: "3",
    messageId: "msg3",
    chatId: "chat3",
    senderId: "user5",
    receiverId: "user6",
    messageContent: "Можем встретиться на самовывоз, мой инста @user123",
    detectedKeywords: ["инста", "@user123", "самовывоз"],
    riskLevel: "low",
    warningType: "suspicious_contact",
    status: "reviewed",
    reviewedBy: "moderator1",
    reviewedAt: "2024-02-29T12:00:00",
    notes: "Обычное упоминание соцсетей для самовывоза",
    createdAt: "2024-02-29T11:45:00",
    senderName: "Елена В.",
    senderAvatar: "/placeholder.svg?height=40&width=40",
    receiverName: "Игорь Л.",
    receiverAvatar: "/placeholder.svg?height=40&width=40",
    itemName: "Кроссовки Nike",
    lastSuspiciousMessage: "Можем встретиться на самовывоз, мой инста @user123",
    lastSuspiciousTimestamp: "2024-02-29T11:45:00",
  },
]

export default function ModerationPage({ onBack }: ModerationPageProps) {
  const { userData } = useUserStore()
  const { toast } = useToast()
  const [selectedWarning, setSelectedWarning] = useState<ModerationWarning | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterRisk, setFilterRisk] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [reviewNotes, setReviewNotes] = useState("")
  const [actionType, setActionType] = useState<string>("")

  const cases = useQuery(api.moderation.getModerationCases, {
    status: filterStatus === "all" ? undefined : (filterStatus as any),
    riskLevel: filterRisk === "all" ? undefined : (filterRisk as any),
    limit: 200,
  })
  const stats = useQuery(api.moderation.getModerationStats, {})
  const chatMessages = useQuery(
    api.moderation.getChatMessages,
    selectedWarning ? { chatId: selectedWarning.chatId as any, limit: 50 } : "skip"
  )
  const resolveCase = useMutation(api.moderation.resolveModerationCase)
  const sendWarning = useMutation(api.moderation.sendWarningMessage)
  const blockUserPlatformWide = useMutation(api.moderation.blockUserPlatformWide)
  const unblockUserPlatformWide = useMutation(api.moderation.unblockUserPlatformWide)
  const getBlockedUsers = useQuery(api.moderation.getBlockedUsers, { limit: 100 })

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "reviewed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "dismissed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "action_taken":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getWarningTypeIcon = (type: string) => {
    switch (type) {
      case "external_communication":
        return <MessageSquare className="h-4 w-4" />
      case "direct_payment":
        return <CreditCard className="h-4 w-4" />
      case "personal_meeting":
        return <Users className="h-4 w-4" />
      case "bypass_platform":
        return <ExternalLink className="h-4 w-4" />
      case "suspicious_contact":
        return <Phone className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getWarningTypeLabel = (type: string) => {
    switch (type) {
      case "external_communication":
        return "Внешняя связь"
      case "direct_payment":
        return "Прямая оплата"
      case "personal_meeting":
        return "Личная встреча"
      case "bypass_platform":
        return "Обход платформы"
      case "suspicious_contact":
        return "Подозрительный контакт"
      default:
        return "Неизвестно"
    }
  }

  async function handlePrimaryAction() {
    if (!selectedWarning || !userData?._id || !actionType) return
    try {
      if (actionType === "warning_issued") {
        await sendWarning({ caseId: selectedWarning.id as any, moderatorId: userData._id as any, reason: reviewNotes || "Нарушение правил" })
        toast({ title: "Отправлено предупреждение" })
      } else if (actionType === "dismiss_case") {
        await resolveCase({ caseId: selectedWarning.id as any, moderatorId: userData._id as any, actionType: "dismiss_case", reason: reviewNotes || "Без действий", notes: reviewNotes })
        toast({ title: "Случай отклонен" })
      } else {
        await resolveCase({ caseId: selectedWarning.id as any, moderatorId: userData._id as any, actionType: actionType as any, reason: reviewNotes || "Обход платформы", notes: reviewNotes })
        toast({ title: "Действие применено" })
      }
      setSelectedWarning(null)
      setReviewNotes("")
      setActionType("")
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось выполнить действие" })
    }
  }

  async function handleBlockUser(userId?: string) {
    if (!userId || !userData?._id) return
    try {
      await blockUserPlatformWide({ userId: userId as any, moderatorId: userData._id as any, reason: reviewNotes || "Блокировка модератором" })
      toast({ title: "Пользователь заблокирован" })
    } catch (e: any) {
      if (e?.message && String(e.message).toLowerCase().includes("already blocked")) {
        toast({ title: "Пользователь уже заблокирован" })
        return
      }
      toast({ title: "Ошибка", description: e?.message || "Не удалось заблокировать пользователя" })
    }
  }

  async function handleUnblockUser(userId?: string) {
    if (!userId || !userData?._id) return
    try {
      await unblockUserPlatformWide({ userId: userId as any, moderatorId: userData._id as any, reason: reviewNotes || "Разблокировано модератором" })
      toast({ title: "Пользователь разблокирован" })
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось разблокировать пользователя" })
    }
  }

  const normalizedWarnings: ModerationWarning[] = useMemo(() => {
    const list = cases || []
    return list.map((c: any) => {
      const buyerName = `${c.buyer?.firstName || ""} ${c.buyer?.lastName || ""}`.trim() || c.buyer?.username || "Покупатель"
      const sellerName = `${c.seller?.firstName || ""} ${c.seller?.lastName || ""}`.trim() || c.seller?.username || "Продавец"
      return {
        id: c._id,
        messageId: c.messageId,
        chatId: c.chatId,
        senderId: c.buyer?.id,
        receiverId: c.seller?.id,
        messageContent: c.messageContent,
        detectedKeywords: c.detectedKeywords || [],
        riskLevel: c.riskLevel,
        warningType: c.warningType,
        status: c.status === "resolved" ? "reviewed" : c.status === "dismissed" ? "dismissed" : "pending",
        createdAt: new Date(c.createdAt).toISOString(),
        senderName: buyerName,
        senderAvatar: c.buyer?.avatar || "/placeholder.svg",
        receiverName: sellerName,
        receiverAvatar: c.seller?.avatar || "/placeholder.svg",
        itemName: c.post?.name || "",
      }
    })
  }, [cases])

  const filteredWarnings = normalizedWarnings.filter((warning) => {
    const matchesStatus = filterStatus === "all" || warning.status === filterStatus
    const matchesRisk = filterRisk === "all" || warning.riskLevel === filterRisk
    const matchesSearch =
      searchQuery === "" ||
      warning.messageContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warning.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warning.itemName.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesRisk && matchesSearch
  })

  function BlockedUsersTab() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserX className="h-5 w-5" />
            <span>Заблокированные пользователи ({getBlockedUsers?.length || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[65vh]">
            <div className="p-3 space-y-2">
              {(getBlockedUsers || []).map((b: any) => (
                <div key={b._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={b.blockedUser?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{(b.blockedUser?.firstName || "").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{`${b.blockedUser?.firstName || ""} ${b.blockedUser?.lastName || ""}`.trim()}</div>
                      <div className="text-xs text-gray-600 truncate">Причина: {b.reason}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleUnblockUser(b.blockedUser?.id)}>
                    Разблокировать
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return diffInMinutes < 1 ? "только что" : `${diffInMinutes} мин назад`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ч назад`
    } else {
      return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold">Система модерации</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4 space-y-4">
        <Tabs defaultValue="cases" className="w-full">
          <TabsList>
            <TabsTrigger value="cases">Предупреждения</TabsTrigger>
            <TabsTrigger value="blocked">Заблокированные</TabsTrigger>
          </TabsList>
          <TabsContent value="cases" className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Hash className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{stats?.totalCases ?? 0}</p>
                  <p className="text-[10px] text-gray-600">Всего</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{stats?.pendingCases ?? 0}</p>
                  <p className="text-[10px] text-gray-600">Ожидают</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{stats?.highRiskCases ?? 0}</p>
                  <p className="text-[10px] text-gray-600">Высокий риск</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по сообщению, пользователю или товару..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="pending">Ожидают</SelectItem>
                  <SelectItem value="resolved">Закрыты</SelectItem>
                  <SelectItem value="dismissed">Отклонены</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Риск" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все уровни</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="low">Низкий</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Warnings List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Предупреждения модерации ({filteredWarnings.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[65vh]">
              <div className="space-y-1 p-4">
                {filteredWarnings.map((warning) => (
                  <div
                    key={warning.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedWarning(warning)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Risk Level Indicator */}
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            warning.riskLevel === "high"
                              ? "bg-red-500"
                              : warning.riskLevel === "medium"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                        ></div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <Badge className={getRiskColor(warning.riskLevel)} variant="outline">
                              {warning.riskLevel === "high"
                                ? "Высокий"
                                : warning.riskLevel === "medium"
                                  ? "Средний"
                                  : "Низкий"}
                            </Badge>
                            <Badge className={getStatusColor(warning.status)} variant="outline">
                              {warning.status === "pending"
                                ? "Ожидает"
                                : warning.status === "reviewed"
                                  ? "Проверено"
                                  : warning.status === "dismissed"
                                    ? "Отклонено"
                                    : "Действие принято"}
                            </Badge>
                            <div className="flex items-center space-x-1 text-gray-500">
                              {getWarningTypeIcon(warning.warningType)}
                              <span className="text-xs hidden sm:inline">
                                {getWarningTypeLabel(warning.warningType)}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 flex-shrink-0">{formatTime(warning.createdAt)}</span>
                        </div>

                        <div className="flex items-center space-x-2 mb-2 text-sm">
                          <span className="font-medium truncate max-w-[100px]">{warning.senderName}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium truncate max-w-[100px]">{warning.receiverName}</span>
                          <span className="text-xs text-gray-500 truncate">• {warning.itemName}</span>
                        </div>

                        {/* Show only first few keywords */}
                        <div className="flex flex-wrap gap-1">
                          {warning.detectedKeywords.slice(0, 3).map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {warning.detectedKeywords.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{warning.detectedKeywords.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
          </TabsContent>
          <TabsContent value="blocked">
            <BlockedUsersTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Enhanced Warning Detail Modal - Mobile & Desktop Optimized */}
      <Dialog open={selectedWarning !== null} onOpenChange={() => setSelectedWarning(null)}>
        <DialogContent showCloseButton={false} className="w-[95vw] max-w-3xl h-[90vh] p-0 overflow-hidden rounded-lg">
          <DialogHeader className="sticky top-0 z-10 bg-background border-b px-4 py-3">
            <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <DialogTitle className="text-lg font-semibold truncate">Детали предупреждения</DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedWarning(null)}
                className="h-8 w-8 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {selectedWarning && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 sm:p-4 lg:p-6">
                {/* Status Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 rounded-lg p-2 sm:p-3 lg:p-4 gap-2 sm:gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <Badge className={getRiskColor(selectedWarning.riskLevel)} variant="outline">
                      {selectedWarning.riskLevel === "high"
                        ? "Высокий"
                        : selectedWarning.riskLevel === "medium"
                          ? "Средний"
                          : "Низкий"}
                    </Badge>
                    <Badge className={getStatusColor(selectedWarning.status)} variant="outline">
                      {selectedWarning.status === "pending"
                        ? "Ожидает"
                        : selectedWarning.status === "reviewed"
                          ? "Проверено"
                          : selectedWarning.status === "dismissed"
                            ? "Отклонено"
                            : "Действие принято"}
                    </Badge>
                    <div className="flex items-center space-x-1 text-gray-600">
                      {getWarningTypeIcon(selectedWarning.warningType)}
                      <span className="text-xs sm:text-sm">{getWarningTypeLabel(selectedWarning.warningType)}</span>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 self-start sm:self-center">
                    {formatTime(selectedWarning.createdAt)}
                  </span>
                </div>

                {/* Accordion for organized content */}
                <Accordion
                  type="multiple"
                  defaultValue={["participants", "message", "chat", "context"]}
                  className="w-full"
                >
                  {/* Participants Section */}
                  <AccordionItem value="participants">
                    <AccordionTrigger className="text-sm sm:text-base font-semibold">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Участники</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                        <Card>
                          <CardHeader className="pb-2 sm:pb-3 px-3 py-2 sm:px-4 sm:py-3">
                            <CardTitle className="text-sm sm:text-base flex items-center justify-between">
                              <span>Отправитель</span>
                              <Button size="icon" variant={selectedWarning?.senderId && getBlockedUsers?.some((b: any) => b.blockedUser?.id === selectedWarning.senderId) ? "default" : "outline"} className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => {
                                const isBlocked = getBlockedUsers?.some((b: any) => b.blockedUser?.id === selectedWarning.senderId)
                                if (isBlocked) handleUnblockUser(selectedWarning.senderId)
                                else handleBlockUser(selectedWarning.senderId)
                              }}>
                                {getBlockedUsers?.some((b: any) => b.blockedUser?.id === selectedWarning.senderId) ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                <span className="sr-only">{getBlockedUsers?.some((b: any) => b.blockedUser?.id === selectedWarning.senderId) ? "Разблокировать" : "Блокировать"}</span>
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                                <AvatarImage src={selectedWarning.senderAvatar || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">
                                  {selectedWarning.senderName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm sm:text-base font-medium truncate">
                                  {selectedWarning.senderName}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 truncate">
                                  ID: {selectedWarning.senderId}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2 sm:pb-3 px-3 py-2 sm:px-4 sm:py-3">
                            <CardTitle className="text-sm sm:text-base flex items-center justify-between">
                              <span>Получатель</span>
                              <Button size="icon" variant={selectedWarning?.receiverId && getBlockedUsers?.some((b: any) => b.blockedUser?.id === selectedWarning.receiverId) ? "default" : "outline"} className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => {
                                const isBlocked = getBlockedUsers?.some((b: any) => b.blockedUser?.id === selectedWarning.receiverId)
                                if (isBlocked) handleUnblockUser(selectedWarning.receiverId)
                                else handleBlockUser(selectedWarning.receiverId)
                              }}>
                                {getBlockedUsers?.some((b: any) => b.blockedUser?.id === selectedWarning.receiverId) ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                <span className="sr-only">{getBlockedUsers?.some((b: any) => b.blockedUser?.id === selectedWarning.receiverId) ? "Разблокировать" : "Блокировать"}</span>
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                                <AvatarImage src={selectedWarning.receiverAvatar || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">
                                  {selectedWarning.receiverName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm sm:text-base font-medium truncate">
                                  {selectedWarning.receiverName}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 truncate">
                                  ID: {selectedWarning.receiverId}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Message Content Section */}
                  <AccordionItem value="message">
                    <AccordionTrigger className="text-sm sm:text-base font-semibold">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span>Подозрительное сообщение</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2">
                        {/* Most Recent Suspicious Message */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-red-700">
                              Последнее подозрительное сообщение:
                            </span>
                            <span className="text-xs text-red-600">
                              {selectedWarning.lastSuspiciousTimestamp
                                ? formatTime(selectedWarning.lastSuspiciousTimestamp)
                                : formatTime(selectedWarning.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-red-800 leading-relaxed break-words whitespace-pre-wrap mb-3">
                            {selectedWarning.lastSuspiciousMessage || selectedWarning.messageContent}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs font-medium text-red-700 mr-2">Обнаруженные ключевые слова:</span>
                            {selectedWarning.detectedKeywords.map((keyword, index) => (
                              <Badge key={index} variant="destructive" className="text-xs px-2 py-1">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Chat History Section */}
                  <AccordionItem value="chat">
                    <AccordionTrigger className="text-sm sm:text-base font-semibold">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>История чата</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2">
                        <div className="bg-gray-50 border rounded-lg p-3 sm:p-4 max-h-80 overflow-y-auto">
                          <div className="space-y-3 sm:space-y-4">
                            {/* Mock chat messages with better styling */}
                            <div className="flex items-start space-x-3">
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <AvatarImage src={selectedWarning.senderAvatar || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">
                                  {selectedWarning.senderName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xs font-medium truncate">{selectedWarning.senderName}</span>
                                  <span className="text-xs text-gray-500 flex-shrink-0">
                                    {formatTime(selectedWarning.createdAt)}
                                  </span>
                                </div>
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm break-words leading-relaxed shadow-sm">
                                  <div className="flex items-start space-x-2">
                                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-red-800">{selectedWarning.messageContent}</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Additional mock messages */}
                            <div className="flex items-start space-x-3">
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <AvatarImage src={selectedWarning.receiverAvatar || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">
                                  {selectedWarning.receiverName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xs font-medium truncate">{selectedWarning.receiverName}</span>
                                  <span className="text-xs text-gray-500 flex-shrink-0">2 мин назад</span>
                                </div>
                                <div className="p-3 bg-white rounded-lg border text-sm shadow-sm">
                                  Хорошо, давайте обсудим детали
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start space-x-3">
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <AvatarImage src={selectedWarning.senderAvatar || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">
                                  {selectedWarning.senderName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xs font-medium truncate">{selectedWarning.senderName}</span>
                                  <span className="text-xs text-gray-500 flex-shrink-0">1 мин назад</span>
                                </div>
                                <div className="p-3 bg-white rounded-lg border text-sm shadow-sm">
                                  Отлично! Жду ваших предложений
                                </div>
                              </div>
                            </div>

                            {/* Show full chat button */}
                            <div className="text-center pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs bg-transparent"
                                onClick={() => console.log("Open full chat for:", selectedWarning.chatId)}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Открыть полный чат
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Context Section */}
                  <AccordionItem value="context">
                    <AccordionTrigger className="text-sm sm:text-base font-semibold">
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4" />
                        <span>Контекст и детали</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg min-h-[64px]">
                              <span className="text-sm text-gray-600 font-medium">Товар:</span>
                              <span className="text-sm font-semibold text-gray-900 truncate ml-2 max-w-[60%]">
                                {selectedWarning.itemName}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg min-h-[64px]">
                              <span className="text-sm text-gray-600 font-medium">Чат ID:</span>
                              <span className="font-mono text-sm text-gray-800 truncate ml-2 max-w-[60%]">
                                {selectedWarning.chatId}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg min-h-[64px]">
                              <span className="text-sm text-gray-600 font-medium">Тип нарушения:</span>
                              <span className="text-sm font-semibold text-gray-900">
                                {getWarningTypeLabel(selectedWarning.warningType)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg min-h-[64px]">
                              <span className="text-sm text-gray-600 font-medium">Уровень риска:</span>
                              <Badge className={getRiskColor(selectedWarning.riskLevel)} variant="outline">
                                {selectedWarning.riskLevel === "high"
                                  ? "Высокий"
                                  : selectedWarning.riskLevel === "medium"
                                    ? "Средний"
                                    : "Низкий"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Review History - visible always, richer details */}
                  <AccordionItem value="history">
                      <AccordionTrigger className="text-sm sm:text-base font-semibold">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>История проверки</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                      <div className="pt-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center space-x-3">
                              <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-blue-900">Проверено модератором:</span>
                                <span className="text-sm text-blue-800 ml-2">
                                  {selectedWarning.reviewedBy || "—"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-blue-900">Дата проверки:</span>
                                <span className="text-sm text-blue-800 ml-2">
                                  {selectedWarning.reviewedAt ? formatTime(selectedWarning.reviewedAt) : "—"}
                                </span>
                              </div>
                            </div>
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <div>
                              <span className="text-sm font-medium text-blue-900">Принятое действие:</span>
                              <span className="text-sm text-blue-800 ml-2">{selectedWarning.actionTaken || "—"}</span>
                            </div>
                          </div>
                          <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                            <span className="text-sm font-medium text-blue-900 block mb-2">Заметки модератора:</span>
                            <p className="text-sm text-blue-800 leading-relaxed break-words">{selectedWarning.notes || "—"}</p>
                          </div>
                          </div>
                      </div>
                      </AccordionContent>
                  </AccordionItem>

                  {/* Actions Section for pending cases */}
                  {selectedWarning.status === "pending" && (
                    <AccordionItem value="actions">
                      <AccordionTrigger className="text-sm sm:text-base font-semibold">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>Действия модератора</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-2 space-y-4">
                          {/* Action Type Selection */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Тип действия</label>
                            <Select value={actionType} onValueChange={setActionType}>
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Выберите действие" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="warning_issued">Предупреждение в чат</SelectItem>
                                <SelectItem value="block_buyer">Блокировать покупателя</SelectItem>
                                <SelectItem value="block_seller">Блокировать продавца</SelectItem>
                                <SelectItem value="block_both">Блокировать обоих</SelectItem>
                                <SelectItem value="dismiss_case">Отклонить</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Заметки</label>
                            <Textarea
                              placeholder="Добавьте заметки о проверке..."
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              rows={3}
                              className="text-sm resize-none"
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-3">
                            <Button onClick={handlePrimaryAction} className="w-full bg-red-600 hover:bg-red-700 text-sm" disabled={!actionType}>
                              <Ban className="h-4 w-4 mr-2" />
                              Принять меры
                            </Button>

                            <div className="grid grid-cols-2 gap-3">
                              <Button onClick={async () => { setActionType("warning_issued"); await handlePrimaryAction() }} className="bg-green-600 hover:bg-green-700 text-sm">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Предупредить
                              </Button>
                              <Button variant="outline" onClick={async () => { setActionType("dismiss_case"); await handlePrimaryAction() }} className="text-sm bg-transparent">
                                <X className="h-4 w-4 mr-2" />
                                Отклонить
                              </Button>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
