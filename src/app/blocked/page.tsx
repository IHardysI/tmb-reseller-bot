"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ban, AlertTriangle, Clock, Mail, Copy, ExternalLink } from "lucide-react";
import { useTelegramUser } from "@/hooks/useTelegramUser";

export default function BlockedPage() {
  const telegramUser = useTelegramUser();
  const supportEmail = "support@reseller-market.ru";
  
  // Use direct database query to get full user object with blocking info
  const currentUser = useQuery(
    api.users.getUserByTelegramId,
    telegramUser?.userId ? { telegramId: telegramUser.userId } : "skip"
  );

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Загрузка...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is actually blocked
  if (!(currentUser as any).isBlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Доступ разрешен</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Ban className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-red-600">
            Аккаунт заблокирован
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              Ваш аккаунт был заблокирован администрацией платформы.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">Причина блокировки:</span>
              </div>
              <p className="text-red-700 text-sm">
                {(currentUser as any)?.blockReason || "Не указана"}
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-700">Дата блокировки:</span>
              </div>
              <p className="text-gray-600 text-sm">
                {(currentUser as any)?.blockedAt ? formatTime((currentUser as any).blockedAt) : "Не указана"}
              </p>
            </div>
          </div>

          <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Что это означает?</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Вы не можете размещать товары на платформе</li>
                <li>• Доступ к чатам и сообщениям ограничен</li>
                <li>• Покупки через платформу недоступны</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Что делать дальше?</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Изучите правила платформы</li>
                <li>• Если считаете блокировку ошибочной — свяжитесь с поддержкой</li>
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 bg-transparent"
                onClick={() => window.open("/rules", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Читать полные правила
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Обжалование блокировки</span>
            </div>
            <p className="text-blue-700 text-sm mb-3">
              Если вы считаете, что блокировка была ошибочной, вы можете обратиться в службу поддержки.
            </p>
            <div className="text-xs text-gray-600">
              <p className="mb-1">
                Укажите ваш ID пользователя: <Badge variant="outline" className="ml-1">{(currentUser as any)?._id || (currentUser as any)?.userId || 'N/A'}</Badge>
              </p>
              <p>При обращении опишите ситуацию подробно и приложите доказательства вашей правоты.</p>
            </div>
            <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{supportEmail}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(supportEmail)}
                className="bg-transparent"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 