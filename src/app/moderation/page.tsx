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
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

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
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCases = useQuery(api.moderation.getModerationCases, { status: "pending" });
  const resolvedCases = useQuery(api.moderation.getModerationCases, { status: "resolved" });
  const blockedUsers = useQuery(api.moderation.getBlockedUsers, { limit: 100 });
  const resolveCaseMutation = useMutation(api.moderation.resolveModerationCase);
  const unblockUserMutation = useMutation(api.moderation.unblockUser);

  const stats = {
    pendingWarnings: activeCases?.length || 0,
    highRiskWarnings: activeCases?.filter(c => c.highestRiskLevel === "high").length || 0,
    resolvedCases: resolvedCases?.length || 0,
    blockedUsers: blockedUsers?.length || 0,
  };

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

  const handleResolveCase = async (caseId: Id<"moderationCases">, action: string) => {
    if (!reviewNotes.trim()) {
      alert("Пожалуйста, укажите причину");
      return;
    }

    setIsSubmitting(true);
    try {
      await resolveCaseMutation({
        caseId,
        moderatorId: "test-moderator" as Id<"users">,
        actionType: action as any,
        reason: reviewNotes.trim(),
      });
      setSelectedCase(null);
      setReviewNotes("");
    } catch (error) {
      console.error("Error resolving case:", error);
      alert("Ошибка при решении дела");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnblockUser = async (userId: Id<"users">) => {
    const reason = prompt("Укажите причину разблокировки:");
    if (!reason) return;

    try {
      await unblockUserMutation({
        blockedUserId: userId,
        moderatorId: "test-moderator" as Id<"users">,
        reason: reason.trim(),
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
      alert("Ошибка при разблокировке пользователя");
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
      <div className="max-w-7xl mx-auto p-2 md:p-4 lg:p-6 space-y-3 md:space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-orange-100 rounded-full flex items-center justify-center mr-2 md:mr-3">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Активные дела</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.pendingWarnings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-red-100 rounded-full flex items-center justify-center mr-2 md:mr-3">
                  <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Высокий риск</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.highRiskWarnings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center mr-2 md:mr-3">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Решенные дела</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.resolvedCases}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2 md:mr-3">
                  <Ban className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Заблокированные</p>
                  <p className="text-lg md:text-2xl font-bold">{stats.blockedUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
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
          <TabsList className="w-full">
            <TabsTrigger value="active-cases">Активные дела</TabsTrigger>
            <TabsTrigger value="resolved-cases">Решенные дела</TabsTrigger>
            <TabsTrigger value="blocked-users">Заблокированные пользователи</TabsTrigger>
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
                                onClick={() => handleUnblockUser(block.blockedUser?.id as Id<"users">)}
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

      {/* Case Detail Dialog */}
      <Dialog open={selectedCase !== null} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-base md:text-lg">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
              <span>Детали дела модерации</span>
            </DialogTitle>
          </DialogHeader>

          {selectedCase && (
            <div className="space-y-3 md:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 md:p-4 bg-gray-50 rounded-lg gap-2">
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                  <Badge className={getRiskColor(selectedCase.highestRiskLevel)} variant="outline">
                    Риск: {selectedCase.highestRiskLevel === "high" ? "Высокий" : selectedCase.highestRiskLevel === "medium" ? "Средний" : "Низкий"}
                  </Badge>
                  <Badge className={getStatusColor(selectedCase.status)} variant="outline">
                    {selectedCase.status === "pending" ? "Ожидает проверки" : selectedCase.status === "resolved" ? "Решено" : "Отклонено"}
                  </Badge>
                  <div className="flex items-center space-x-1 text-gray-600">
                    {getWarningTypeIcon(selectedCase.primaryWarningType)}
                    <span className="text-sm">{getWarningTypeLabel(selectedCase.primaryWarningType)}</span>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{formatTime(selectedCase.createdAt)}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <Card>
                  <CardHeader className="pb-2 md:pb-3">
                    <CardTitle className="text-sm">Покупатель</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <Avatar className="h-8 w-8 md:h-12 md:w-12">
                        <AvatarImage src={selectedCase.buyer?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{selectedCase.buyer?.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm md:text-base font-medium truncate">{selectedCase.buyer?.firstName} {selectedCase.buyer?.lastName}</p>
                        <p className="text-xs md:text-sm text-gray-600 truncate">@{selectedCase.buyer?.username}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 md:pb-3">
                    <CardTitle className="text-sm">Продавец</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <Avatar className="h-8 w-8 md:h-12 md:w-12">
                        <AvatarImage src={selectedCase.seller?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{selectedCase.seller?.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm md:text-base font-medium truncate">{selectedCase.seller?.firstName} {selectedCase.seller?.lastName}</p>
                        <p className="text-xs md:text-sm text-gray-600 truncate">@{selectedCase.seller?.username}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-sm">Контекст товара</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <img 
                      src={selectedCase.post?.image || "/placeholder.svg"} 
                      alt={selectedCase.post?.name}
                      className="w-8 h-8 md:w-12 md:h-12 object-cover rounded"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm md:text-base font-medium truncate">{selectedCase.post?.name}</p>
                      <p className="text-xs md:text-sm text-gray-600">{selectedCase.post?.price} ₽</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-sm">Статистика</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Предупреждений:</span>
                      <span className="font-medium ml-2">{selectedCase.totalWarnings}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Создано:</span>
                      <span className="font-medium ml-2">{formatTime(selectedCase.createdAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedCase.status === "pending" && (
                <Card>
                  <CardHeader className="pb-2 md:pb-3">
                    <CardTitle className="text-sm">Действия модератора</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Причина действия *</label>
                      <Textarea
                        placeholder="Укажите причину принятого решения..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={3}
                        className="text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Заблокировать пользователей:</h4>
                        <Button
                          onClick={() => handleResolveCase(selectedCase._id, "block_buyer")}
                          disabled={isSubmitting || !reviewNotes.trim()}
                          className="w-full bg-red-600 hover:bg-red-700 h-8 md:h-10 text-xs md:text-sm"
                        >
                          <Ban className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                          Заблокировать покупателя
                        </Button>
                        <Button
                          onClick={() => handleResolveCase(selectedCase._id, "block_seller")}
                          disabled={isSubmitting || !reviewNotes.trim()}
                          className="w-full bg-red-600 hover:bg-red-700 h-8 md:h-10 text-xs md:text-sm"
                        >
                          <Ban className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                          Заблокировать продавца
                        </Button>
                        <Button
                          onClick={() => handleResolveCase(selectedCase._id, "block_both")}
                          disabled={isSubmitting || !reviewNotes.trim()}
                          className="w-full bg-red-800 hover:bg-red-900 h-8 md:h-10 text-xs md:text-sm"
                        >
                          <Ban className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                          Заблокировать обоих
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Другие действия:</h4>
                        <Button
                          onClick={() => handleResolveCase(selectedCase._id, "warning_issued")}
                          disabled={isSubmitting || !reviewNotes.trim()}
                          variant="outline"
                          className="w-full h-8 md:h-10 text-xs md:text-sm"
                        >
                          <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                          Выдать предупреждение
                        </Button>
                        <Button
                          onClick={() => handleResolveCase(selectedCase._id, "dismiss_case")}
                          disabled={isSubmitting || !reviewNotes.trim()}
                          variant="outline"
                          className="w-full h-8 md:h-10 text-xs md:text-sm"
                        >
                          <X className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                          Отклонить дело
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedCase.status !== "pending" && (
                <Card>
                  <CardHeader className="pb-2 md:pb-3">
                    <CardTitle className="text-sm">История решения</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedCase.resolvedBy && (
                        <div className="flex items-center space-x-2 text-sm">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>Решено: {selectedCase.resolvedBy.firstName} {selectedCase.resolvedBy.lastName}</span>
                        </div>
                      )}
                      {selectedCase.resolvedAt && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>Дата: {formatTime(selectedCase.resolvedAt)}</span>
                        </div>
                      )}
                      {selectedCase.resolution && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{selectedCase.resolution}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 