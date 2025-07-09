"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
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
  Eye,
  Unlock,
  MessageCircleWarning,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { useOptimizedTelegramUser } from "@/hooks/useOptimizedTelegramUser";

const BLOCK_REASONS = [
  { value: "spam", label: "Спам и навязчивые сообщения", color: "bg-yellow-100 text-yellow-800" },
  { value: "fraud", label: "Мошенничество", color: "bg-red-100 text-red-800" },
  { value: "bypass_platform", label: "Обход платформы", color: "bg-orange-100 text-orange-800" },
  { value: "inappropriate_behavior", label: "Неподобающее поведение", color: "bg-purple-100 text-purple-800" },
  { value: "fake_products", label: "Фальшивые товары", color: "bg-pink-100 text-pink-800" },
  { value: "harassment", label: "Домогательства", color: "bg-red-100 text-red-800" },
  { value: "external_deals", label: "Внешние сделки", color: "bg-blue-100 text-blue-800" },
  { value: "policy_violation", label: "Нарушение политики", color: "bg-gray-100 text-gray-800" },
];

const WARNING_REASONS = [
  { value: "first_warning", label: "Первое предупреждение о нарушении правил" },
  { value: "platform_bypass", label: "Попытка обхода платформы" },
  { value: "external_communication", label: "Попытка общения вне платформы" },
  { value: "inappropriate_content", label: "Неподобающее содержание сообщений" },
  { value: "suspicious_behavior", label: "Подозрительное поведение" },
];

const DISMISS_REASONS = [
  { value: "false_positive", label: "Ложное срабатывание системы" },
  { value: "insufficient_evidence", label: "Недостаточно доказательств" },
  { value: "user_clarification", label: "Пользователь предоставил разъяснения" },
  { value: "minor_violation", label: "Незначительное нарушение" },
  { value: "resolved_independently", label: "Решено самостоятельно пользователями" },
];

const UNBLOCK_REASONS = [
  { value: "appeal_successful", label: "Успешная апелляция пользователя" },
  { value: "mistaken_block", label: "Ошибочная блокировка" },
  { value: "resolved_issue", label: "Проблема решена" },
  { value: "technical_error", label: "Техническая ошибка" },
  { value: "policy_change", label: "Изменение политики" },
  { value: "other", label: "Другая причина" },
];

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "resolved":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "dismissed":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getWarningTypeIcon = (type: string) => {
  switch (type) {
    case "external_communication":
      return <MessageSquare className="h-4 w-4" />;
    case "direct_payment":
      return <CreditCard className="h-4 w-4" />;
    case "personal_meeting":
      return <Users className="h-4 w-4" />;
    case "bypass_platform":
      return <ExternalLink className="h-4 w-4" />;
    case "suspicious_contact":
      return <Phone className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

const getWarningTypeLabel = (type: string) => {
  switch (type) {
    case "external_communication":
      return "Внешняя связь";
    case "direct_payment":
      return "Прямая оплата";
    case "personal_meeting":
      return "Личная встреча";
    case "bypass_platform":
      return "Обход платформы";
    case "suspicious_contact":
      return "Подозрительный контакт";
    default:
      return "Неизвестно";
  }
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return diffInMinutes < 1 ? "только что" : `${diffInMinutes} мин назад`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} ч назад`;
  } else {
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
};

export default function ModerationPage() {
  const telegramUser = useOptimizedTelegramUser();
  const currentUser = telegramUser.userData;
  const userRole = telegramUser.isAdmin ? { isAdmin: true, role: 'admin' } : { isAdmin: false, role: 'user' };

  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [selectedBlockReason, setSelectedBlockReason] = useState("");
  const [selectedUserToBlock, setSelectedUserToBlock] = useState<any>(null);
  const [showChatMessages, setShowChatMessages] = useState(false);
  const [selectedWarningReason, setSelectedWarningReason] = useState("");
  const [selectedDismissReason, setSelectedDismissReason] = useState("");
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);
  const [selectedUnblockReason, setSelectedUnblockReason] = useState("");
  const [selectedUserToUnblock, setSelectedUserToUnblock] = useState<any>(null);

  const activeCases = useQuery(api.moderation.getModerationCases, { status: "pending" });
  const resolvedCases = useQuery(api.moderation.getModerationCases, { status: "resolved" });
  const blockedUsers = useQuery(api.moderation.getBlockedUsers, { limit: 100 });
  const chatMessages = useQuery(
    api.moderation.getChatMessages,
    selectedCase ? { chatId: selectedCase.chatId, limit: 100 } : "skip"
  );
  
  const resolveCaseMutation = useMutation(api.moderation.resolveModerationCase);
  const unblockUserMutation = useMutation(api.moderation.unblockUserPlatformWide);
  const blockUserMutation = useMutation(api.moderation.blockUserPlatformWide);
  const sendWarningMutation = useMutation(api.moderation.sendWarningMessage);

  const stats = {
    pendingWarnings: activeCases?.length || 0,
    highRiskWarnings: activeCases?.filter(c => c.highestRiskLevel === "high").length || 0,
    resolvedCases: resolvedCases?.length || 0,
    blockedUsers: blockedUsers?.length || 0,
  };

  if (!telegramUser.isInitialized || telegramUser.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!telegramUser.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Доступ запрещен</h2>
          <p className="text-gray-600">У вас нет прав доступа к странице модерации</p>
        </div>
      </div>
    );
  }

  // Debug case counts
  console.log("CURRENT CASE COUNTS:");
  console.log("- Active cases:", activeCases?.length || 0);
  console.log("- Resolved cases:", resolvedCases?.length || 0);
  console.log("- Active case IDs:", activeCases?.map(c => c._id) || []);
  console.log("- Resolved case IDs:", resolvedCases?.map(c => c._id) || []);



  const filteredActiveCases = (activeCases || []).filter((case_) => {
    const matchesRisk = filterRisk === "all" || case_.highestRiskLevel === filterRisk;
    const matchesSearch =
      searchQuery === "" ||
      case_.buyer?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.seller?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.post?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRisk && matchesSearch;
  });

  const filteredResolvedCases = (resolvedCases || []).filter((case_) => {
    const matchesRisk = filterRisk === "all" || case_.highestRiskLevel === filterRisk;
    const matchesSearch =
      searchQuery === "" ||
      case_.buyer?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.seller?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.post?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRisk && matchesSearch;
  });

  const filteredBlockedUsers = (blockedUsers || []).filter((block) => {
    const matchesSearch =
      searchQuery === "" ||
      block.blockedUser?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.blockedUser?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.blockedUser?.username?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const handleBlockUser = async (user: any, reason: string) => {
    if (!selectedBlockReason) {
      alert("Выберите причину блокировки");
      return;
    }

    if (!currentUser?._id) {
      alert("Ошибка: не удалось определить модератора");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Blocking user:", user.id, "for case:", selectedCase?._id);
      const selectedReason = BLOCK_REASONS.find(r => r.value === selectedBlockReason);
      const result = await blockUserMutation({
        userId: user.id,
        moderatorId: currentUser._id! as any,
        reason: selectedReason?.label || selectedBlockReason,
        caseId: selectedCase?._id,
      });
      
      console.log("User blocked, result:", result);
      
      // Close block dialog but keep case dialog open for manual case closure
      setShowBlockDialog(false);
      setSelectedBlockReason("");
      setSelectedUserToBlock(null);
      
      alert("Пользователь заблокирован");
    } catch (error: any) {
      console.error("Error blocking user:", error);
      if (error?.message === "User is already blocked") {
        alert("Пользователь уже заблокирован");
      } else {
        alert("Ошибка при блокировке пользователя");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWarning = async () => {
    if (!selectedWarningReason) {
      alert("Выберите причину предупреждения");
      return;
    }

    if (!currentUser?._id) {
      alert("Ошибка: не удалось определить модератора");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Sending warning for case:", selectedCase._id);
      const selectedReason = WARNING_REASONS.find(r => r.value === selectedWarningReason);
      const result = await sendWarningMutation({
        caseId: selectedCase._id,
        moderatorId: currentUser._id! as any,
        reason: selectedReason?.label || selectedWarningReason,
      });
      
      console.log("Warning sent, result:", result);
      
      // Wait a moment for the query to refresh before closing
      setTimeout(() => {
        setSelectedCase(null);
        setSelectedWarningReason("");
      }, 500);
      
      alert("Предупреждение отправлено в чат");
    } catch (error) {
      console.error("Error sending warning:", error);
      alert("Ошибка при отправке предупреждения");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissCase = async () => {
    if (!selectedDismissReason) {
      alert("Выберите причину отклонения");
      return;
    }

    if (!currentUser?._id) {
      alert("Ошибка: не удалось определить модератора");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Dismissing case:", selectedCase._id);
      const selectedReason = DISMISS_REASONS.find(r => r.value === selectedDismissReason);
      const result = await resolveCaseMutation({
        caseId: selectedCase._id,
        moderatorId: currentUser._id! as any,
        actionType: "dismiss_case",
        reason: selectedReason?.label || selectedDismissReason,
      });
      
      console.log("Case dismissed, result:", result);
      
      // Wait a moment for the query to refresh before closing
      setTimeout(() => {
        setSelectedCase(null);
        setSelectedDismissReason("");
      }, 500);
    } catch (error) {
      console.error("Error dismissing case:", error);
      alert("Ошибка при отклонении дела");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnblockUser = async (userId: Id<"users">, userName: string) => {
    setSelectedUserToUnblock({ id: userId, name: userName });
    setShowUnblockDialog(true);
  };

  const handleUnblockConfirm = async () => {
    if (!selectedUnblockReason || !selectedUserToUnblock) return;

    if (!currentUser?._id) {
      alert("Ошибка: не удалось определить модератора");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedReason = UNBLOCK_REASONS.find(r => r.value === selectedUnblockReason);
      await unblockUserMutation({
        userId: selectedUserToUnblock.id,
        moderatorId: currentUser._id! as any,
        reason: selectedReason?.label || selectedUnblockReason,
      });
      setShowUnblockDialog(false);
      setSelectedUnblockReason("");
      setSelectedUserToUnblock(null);
    } catch (error: any) {
      console.error("Error unblocking user:", error);
      if (error?.message === "User is not blocked") {
        alert("Пользователь не заблокирован");
      } else if (error?.message === "Block record not found") {
        alert("Запись о блокировке не найдена");
      } else {
        alert("Ошибка при разблокировке пользователя");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCaseItem = (case_: any, showActions = true) => (
    <div
      key={case_._id}
      className="p-2 md:p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => setSelectedCase(case_)}
    >
      <div className="flex items-start space-x-2 md:space-x-4">
        <div className="flex-shrink-0 mt-1">
          <div
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${
              case_.highestRiskLevel === "high"
                ? "bg-red-500"
                : case_.highestRiskLevel === "medium"
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
          ></div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 md:mb-2 gap-1 md:gap-2">
            <div className="flex flex-wrap items-center gap-1">
              <Badge className={getRiskColor(case_.highestRiskLevel)} variant="outline">
                {case_.highestRiskLevel === "high"
                  ? "Высокий"
                  : case_.highestRiskLevel === "medium"
                    ? "Средний"
                    : "Низкий"}
              </Badge>
              <Badge className={getStatusColor(case_.status)} variant="outline">
                {case_.status === "pending"
                  ? "Ожидает"
                  : case_.status === "resolved"
                    ? "Решено"
                    : "Отклонено"}
              </Badge>
              <div className="flex items-center space-x-1 text-gray-500">
                {getWarningTypeIcon(case_.primaryWarningType)}
                <span className="text-xs hidden sm:inline">{getWarningTypeLabel(case_.primaryWarningType)}</span>
              </div>
            </div>
            <span className="text-xs text-gray-500">{formatTime(case_.createdAt)}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-1 md:mb-2 gap-1 md:gap-2">
            <div className="flex items-center space-x-1 md:space-x-2">
              <Avatar className="h-4 w-4 md:h-6 md:w-6">
                <AvatarImage src={case_.buyer?.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">{case_.buyer?.firstName?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs md:text-sm font-medium truncate">{case_.buyer?.firstName} {case_.buyer?.lastName}</span>
            </div>
            <span className="text-gray-400 hidden sm:inline">↔</span>
            <div className="flex items-center space-x-1 md:space-x-2">
              <Avatar className="h-4 w-4 md:h-6 md:w-6">
                <AvatarImage src={case_.seller?.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">{case_.seller?.firstName?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs md:text-sm font-medium truncate">{case_.seller?.firstName} {case_.seller?.lastName}</span>
            </div>
            <span className="text-xs text-gray-500 truncate">• {case_.post?.name}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-gray-600">{case_.totalWarnings} предупреждений</span>
            {showActions && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCase(case_);
                }}
                className="ml-1 md:ml-2 h-6 md:h-8 px-2 md:px-3"
              >
                <Eye className="h-3 w-3 md:h-4 md:w-4 sm:mr-1" />
                <span className="hidden sm:inline text-xs">Просмотр</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-6xl mx-auto p-2 md:p-4 lg:p-6 space-y-3 md:space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2  bg-orange-100 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-lg md:text-2xl font-bold">{stats.pendingWarnings}</p>
                  <p className="text-xs text-gray-600">Активные дела</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2  bg-red-100 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-lg md:text-2xl font-bold">{stats.highRiskWarnings}</p>
                  <p className="text-xs text-gray-600">Высокий риск</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2  bg-green-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-lg md:text-2xl font-bold">{stats.resolvedCases}</p>
                  <p className="text-xs text-gray-600">Решенные дела</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2  bg-purple-100 rounded-lg">
                  <Ban className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-lg md:text-2xl font-bold">{stats.blockedUsers}</p>
                  <p className="text-xs text-gray-600">Заблокированные</p>
                </div>
              </div>
            </CardContent>
          </Card> 
        </div>

        {/* Filters */}
        <Card className="py-0!">
          <CardContent className="p-2 md:p-4">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по пользователю или товару..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-8 md:h-10"
                />
              </div>
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger className="w-full md:w-48 h-8 md:h-10">
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

        {/* Tabs */}
        <Tabs defaultValue="active-cases" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="active-cases" className="text-xs md:text-sm">Активные дела</TabsTrigger>
            <TabsTrigger value="resolved-cases" className="text-xs md:text-sm">Решенные дела</TabsTrigger>
            <TabsTrigger value="blocked-users" className="text-xs md:text-sm">Заблокированные</TabsTrigger>
          </TabsList>
          <TabsContent value="active-cases">
            <Card>
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm md:text-lg">
                  <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Активные дела ({filteredActiveCases.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] md:h-[700px]">
                  <div className="space-y-1 p-2 md:p-4">
                    {filteredActiveCases.length > 0 ? (
                      filteredActiveCases.map((case_) => renderCaseItem(case_))
                    ) : (
                      <div className="text-center py-6 md:py-8 text-gray-500">
                        <AlertCircle className="w-6 h-6 md:w-12 md:h-12 mx-auto mb-2 md:mb-4 text-gray-400" />
                        <p className="text-sm">Активных дел нет</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="resolved-cases">
            <Card>
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm md:text-lg">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Решенные дела ({filteredResolvedCases.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] md:h-[700px]">
                  <div className="space-y-1 p-2 md:p-4">
                    {filteredResolvedCases.length > 0 ? (
                      filteredResolvedCases.map((case_) => renderCaseItem(case_, false))
                    ) : (
                      <div className="text-center py-6 md:py-8 text-gray-500">
                        <CheckCircle className="w-6 h-6 md:w-12 md:h-12 mx-auto mb-2 md:mb-4 text-gray-400" />
                        <p className="text-sm">Решенных дел нет</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="blocked-users">
            <Card>
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm md:text-lg">
                  <UserX className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Заблокированные пользователи ({filteredBlockedUsers.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] md:h-[700px]">
                  <div className="space-y-2 md:space-y-3 p-2 md:p-4">
                    {filteredBlockedUsers.length > 0 ? (
                      filteredBlockedUsers.map((block) => (
                        <div key={block._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 md:p-4 border rounded-lg gap-2 md:gap-3">
                          <div className="flex items-center space-x-2 md:space-x-3">
                            <Avatar className="h-6 w-6 md:h-10 md:w-10">
                              <AvatarImage src={block.blockedUser?.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">{block.blockedUser?.firstName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm md:text-base font-medium truncate">{block.blockedUser?.firstName} {block.blockedUser?.lastName}</p>
                              <p className="text-xs md:text-sm text-gray-500 truncate">@{block.blockedUser?.username}</p>
                              <p className="text-xs text-gray-400">Заблокирован {formatTime(block.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                            <div className="text-left sm:text-right sm:mr-4">
                              <p className="text-xs md:text-sm font-medium">Причина:</p>
                              <p className="text-xs text-gray-600 max-w-xs truncate">{block.reason}</p>
                            </div>
                            {block.canBeReversed && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnblockUser(block.blockedUser?.id as Id<"users">, `${block.blockedUser?.firstName} ${block.blockedUser?.lastName}`)}
                                className="w-full sm:w-auto h-7 md:h-8 px-2 md:px-3"
                              >
                                <Unlock className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                <span className="text-xs">Разблокировать</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 md:py-8 text-gray-500">
                        <UserX className="w-6 h-6 md:w-12 md:h-12 mx-auto mb-2 md:mb-4 text-gray-400" />
                        <p className="text-sm">Заблокированных пользователей нет</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Enhanced Case Detail Dialog */}
      <Dialog open={selectedCase !== null} onOpenChange={() => {
        setSelectedCase(null);
        setSelectedWarningReason("");
        setSelectedDismissReason("");
        setSelectedBlockReason("");
      }}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-sm md:text-lg">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
              <span>Детали дела модерации</span>
            </DialogTitle>
          </DialogHeader>

          {selectedCase && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 bg-gray-50 rounded-lg gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getRiskColor(selectedCase.highestRiskLevel)} variant="outline">
                    Риск: {selectedCase.highestRiskLevel === "high" ? "Высокий" : selectedCase.highestRiskLevel === "medium" ? "Средний" : "Низкий"}
                  </Badge>
                  <Badge className={getStatusColor(selectedCase.status)} variant="outline">
                    {selectedCase.status === "pending" ? "Ожидает проверки" : selectedCase.status === "resolved" ? "Решено" : "Отклонено"}
                  </Badge>
                  <div className="flex items-center space-x-1 text-gray-600">
                    {getWarningTypeIcon(selectedCase.primaryWarningType)}
                    <span className="text-xs md:text-sm">{getWarningTypeLabel(selectedCase.primaryWarningType)}</span>
                  </div>
                </div>
                <span className="text-xs md:text-sm text-gray-500">{formatTime(selectedCase.createdAt)}</span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Left Column - Case Info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          Покупатель
                          {selectedCase.buyer?.isBlocked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="h-6 px-2 text-xs bg-red-50 text-red-700 border-red-200"
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Заблокирован
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUserToBlock(selectedCase.buyer);
                                setShowBlockDialog(true);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Блок
                            </Button>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={selectedCase.buyer?.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{selectedCase.buyer?.firstName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{selectedCase.buyer?.firstName} {selectedCase.buyer?.lastName}</p>
                            <p className="text-xs text-gray-600 truncate">@{selectedCase.buyer?.username}</p>
                            {selectedCase.buyer?.isBlocked && (
                              <div className="mt-1">
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                  Заблокирован
                                </Badge>
                                {selectedCase.buyer?.blockReason && (
                                  <p className="text-xs text-red-600 mt-1 truncate">{selectedCase.buyer.blockReason}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          Продавец
                          {selectedCase.seller?.isBlocked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="h-6 px-2 text-xs bg-red-50 text-red-700 border-red-200"
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Заблокирован
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUserToBlock(selectedCase.seller);
                                setShowBlockDialog(true);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Блок
                            </Button>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={selectedCase.seller?.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{selectedCase.seller?.firstName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{selectedCase.seller?.firstName} {selectedCase.seller?.lastName}</p>
                            <p className="text-xs text-gray-600 truncate">@{selectedCase.seller?.username}</p>
                            {selectedCase.seller?.isBlocked && (
                              <div className="mt-1">
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                  Заблокирован
                                </Badge>
                                {selectedCase.seller?.blockReason && (
                                  <p className="text-xs text-red-600 mt-1 truncate">{selectedCase.seller.blockReason}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Товар</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-3">
                        <img 
                          src={selectedCase.post?.image || "/placeholder.svg"} 
                          alt={selectedCase.post?.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{selectedCase.post?.name}</p>
                          <p className="text-xs text-gray-600">{selectedCase.post?.price} ₽</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Подозрительное сообщение</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-800">{selectedCase.messageContent}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {selectedCase.detectedKeywords?.map((keyword: string, index: number) => (
                            <Badge key={index} variant="outline" className="bg-red-100 text-red-700 text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Chat Messages */}
                <div>
                  <Card className="h-[400px]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        История чата
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[350px] p-4">
                        {chatMessages && chatMessages.length > 0 ? (
                          <div className="space-y-3">
                            {chatMessages.map((message: any) => (
                              <div key={message._id} className="flex items-start space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={message.sender?.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs">{message.sender?.firstName?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-medium">{message.sender?.firstName}</span>
                                    <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
                                  </div>
                                  <p className="text-sm text-gray-700 mt-1">{message.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">Сообщения загружаются...</p>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Action Section */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Действия модератора</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Warning Action */}
                    <Card className="border-yellow-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-yellow-700 flex items-center">
                          <MessageCircleWarning className="h-4 w-4 mr-2" />
                          Отправить предупреждение
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Причина предупреждения</label>
                          <Select value={selectedWarningReason} onValueChange={setSelectedWarningReason}>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите причину..." />
                            </SelectTrigger>
                            <SelectContent>
                              {WARNING_REASONS.map((reason) => (
                                <SelectItem key={reason.value} value={reason.value}>
                                  {reason.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={handleSendWarning}
                          disabled={isSubmitting || !selectedWarningReason}
                          className="w-full bg-yellow-600 hover:bg-yellow-700"
                        >
                          <MessageCircleWarning className="h-4 w-4 mr-2" />
                          Отправить предупреждение
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Dismiss Action */}
                    <Card className="border-gray-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-700 flex items-center">
                          <X className="h-4 w-4 mr-2" />
                          Отклонить дело
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Причина отклонения</label>
                          <Select value={selectedDismissReason} onValueChange={setSelectedDismissReason}>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите причину..." />
                            </SelectTrigger>
                            <SelectContent>
                              {DISMISS_REASONS.map((reason) => (
                                <SelectItem key={reason.value} value={reason.value}>
                                  {reason.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={handleDismissCase}
                          disabled={isSubmitting || !selectedDismissReason}
                          variant="outline"
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Отклонить дело
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Manual Close Case Action - shown when users are blocked */}
                  {(selectedCase.buyer?.isBlocked || selectedCase.seller?.isBlocked) && selectedCase.status === "pending" && (
                    <Card className="border-blue-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-blue-700 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Закрыть дело вручную
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-gray-600">
                          {selectedCase.buyer?.isBlocked && selectedCase.seller?.isBlocked
                            ? "Оба пользователя заблокированы. Дело может быть закрыто."
                            : selectedCase.buyer?.isBlocked
                            ? "Покупатель заблокирован. Дело может быть закрыто."
                            : "Продавец заблокирован. Дело может быть закрыто."
                          }
                        </p>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Причина закрытия</label>
                          <Select value={selectedDismissReason} onValueChange={setSelectedDismissReason}>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите причину..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="users_blocked">Пользователи заблокированы</SelectItem>
                              <SelectItem value="issue_resolved">Проблема решена</SelectItem>
                              <SelectItem value="manual_review_complete">Ручная проверка завершена</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={handleDismissCase}
                          disabled={isSubmitting || !selectedDismissReason}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Закрыть дело
                        </Button>
                      </CardContent>
                    </Card>
                  )}


                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Block Reason Selection Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Выберите причину блокировки</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Пользователь: <strong>{selectedUserToBlock?.firstName} {selectedUserToBlock?.lastName}</strong>
            </p>
            
            <div className="text-sm text-gray-600 mb-4">
              Выберите одну из предустановленных причин блокировки:
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {BLOCK_REASONS.map((reason) => (
                <Button
                  key={reason.value}
                  variant={selectedBlockReason === reason.value ? "default" : "outline"}
                  className={`justify-start h-auto p-4 text-left ${
                    selectedBlockReason === reason.value 
                      ? "bg-red-600 text-white border-red-600" 
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedBlockReason(reason.value)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      selectedBlockReason === reason.value 
                        ? "bg-white border-white" 
                        : "border-gray-300"
                    }`} />
                    <div>
                      <div className="font-medium">{reason.label}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowBlockDialog(false);
                setSelectedBlockReason("");
              }}>
                Отмена
              </Button>
              <Button 
                onClick={() => handleBlockUser(selectedUserToBlock, selectedBlockReason)}
                disabled={!selectedBlockReason || isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? "Блокировка..." : "Заблокировать пользователя"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unblock Reason Selection Dialog */}
      <Dialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Выберите причину разблокировки</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Пользователь: <strong>{selectedUserToUnblock?.name}</strong>
            </p>
            
            <div className="text-sm text-gray-600 mb-4">
              Выберите одну из предустановленных причин разблокировки:
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {UNBLOCK_REASONS.map((reason) => (
                <Button
                  key={reason.value}
                  variant={selectedUnblockReason === reason.value ? "default" : "outline"}
                  className={`justify-start h-auto p-4 text-left ${
                    selectedUnblockReason === reason.value 
                      ? "bg-green-600 text-white border-green-600" 
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedUnblockReason(reason.value)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      selectedUnblockReason === reason.value 
                        ? "bg-white border-white" 
                        : "border-gray-300"
                    }`} />
                    <div>
                      <div className="font-medium">{reason.label}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowUnblockDialog(false);
                setSelectedUnblockReason("");
              }}>
                Отмена
              </Button>
              <Button 
                onClick={handleUnblockConfirm}
                disabled={!selectedUnblockReason || isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Разблокировка..." : "Разблокировать пользователя"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 