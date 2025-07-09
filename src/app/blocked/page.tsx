"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ban, AlertTriangle, Clock, Mail } from "lucide-react";
import { useTelegramUser } from "@/hooks/useTelegramUser";

export default function BlockedPage() {
  const { userId } = useTelegramUser();
  const currentUser = useQuery(api.users.getUserByTelegramId, 
    userId ? { telegramId: userId } : "skip"
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

  if (!currentUser?.isBlocked) {
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
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
                {currentUser.blockReason || "Не указана"}
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-700">Дата блокировки:</span>
              </div>
              <p className="text-gray-600 text-sm">
                {currentUser.blockedAt ? formatTime(currentUser.blockedAt) : "Не указана"}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-800 mb-3">Что это означает?</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Доступ к платформе ограничен</li>
              <li>• Невозможно совершать покупки или продажи</li>
              <li>• Чаты и сообщения недоступны</li>
              <li>• Размещение объявлений заблокировано</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-800 mb-3">Как обжаловать?</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Обратитесь в поддержку:</span>
              </div>
              <p className="text-blue-700 text-sm">
                Отправьте письмо на support@example.com с описанием ситуации. 
                Укажите ваш ID пользователя: <Badge variant="outline" className="ml-1">{currentUser._id}</Badge>
              </p>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500">
            Решение о блокировке принимается в соответствии с правилами платформы
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 