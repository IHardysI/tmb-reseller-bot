"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageIcon, FileText, Clock, Trash2, Ban, Flag, Check } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface ChatItemProps {
  id: string
  itemId: string
  itemName: string
  itemImage: string
  itemPrice: number
  otherParticipant: {
    id: string
    name: string
    avatar: string
    trustLevel: "bronze" | "silver" | "gold"
    isOnline: boolean
    lastOnline?: number
  }
  lastMessage: {
    content: string
    timestamp: string
    senderId: string
    type: "text" | "image" | "file"
    fileName?: string
    isRead?: boolean
  } | null
  unreadCount: number
  userRole: "buyer" | "seller"
  onClick: () => void
  onDelete: () => void
  onBlock: () => void
  onReport: () => void
}

export default function ChatItem({ 
  id,
  itemId,
  itemName,
  itemImage,
  itemPrice,
  otherParticipant,
  lastMessage,
  unreadCount,
  userRole,
  onClick,
  onDelete,
  onBlock,
  onReport
}: ChatItemProps) {
  const getTrustColor = (trust: string) => {
    const colors = {
      bronze: "bg-amber-100 text-amber-700",
      silver: "bg-gray-100 text-gray-700",
      gold: "bg-yellow-100 text-yellow-700",
    }
    return colors[trust as keyof typeof colors]
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return diffInMinutes < 1 ? "сейчас" : `${diffInMinutes}м`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}ч`
    } else {
      return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
    }
  }

  const formatLastOnline = (isOnline: boolean, lastOnline?: number) => {
    if (isOnline) {
      return "В сети"
    }
    
    if (!lastOnline) {
      return "Был давно"
    }
    
    const now = Date.now()
    const timeDiff = now - lastOnline
    const minutes = Math.floor(timeDiff / 60000)
    const hours = Math.floor(timeDiff / 3600000)
    const days = Math.floor(timeDiff / 86400000)
    
    if (minutes < 60) {
      if (minutes < 5) {
        return "Недавно"
      }
      return `${minutes}м назад`
    }
    
    if (hours < 24) {
      return `${hours}ч назад`
    }
    
    return `${days}д назад`
  }

  const getMessagePreview = () => {
    if (!lastMessage) return <span className="text-gray-500">Нет сообщений</span>
    
    switch (lastMessage.type) {
      case "image":
        return (
          <div className="flex items-center space-x-1.5 text-gray-500">
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Фото</span>
          </div>
        )
      case "file":
        return (
          <div className="flex items-center space-x-1.5 text-gray-500">
            <FileText className="h-3.5 w-3.5" />
            <span>{lastMessage.fileName || "Файл"}</span>
          </div>
        )
      default:
        return <span className="text-gray-600">{lastMessage.content}</span>
    }
  }

  const isFromCurrentUser = lastMessage?.senderId === "current-user"

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onClick()
  }

  const handleDelete = () => {
    onDelete()
  }

  const handleBlock = () => {
    onBlock()
  }

  const handleReport = () => {
    onReport()
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`group p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1 hover:scale-[1.02] ${
            unreadCount > 0
              ? "bg-gradient-to-r from-blue-50/80 to-blue-25/40 hover:from-blue-100/60 hover:to-blue-50/60 border border-blue-100/50 hover:border-blue-200"
              : "bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-white border border-gray-100/50 hover:border-gray-200"
          } md:hover:transform md:hover:transition-all`}
          onClick={handleClick}
        >
          <div className="flex space-x-3">
            <div className="relative flex-shrink-0">
              <img
                src={itemImage || "/placeholder.svg"}
                alt={itemName}
                className="w-12 h-12 object-cover rounded-xl transition-all duration-300 group-hover:shadow-md group-hover:scale-110"
              />
              {userRole === "seller" && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-125 group-hover:bg-green-400">
                  <span className="text-white text-xs font-bold">₽</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-gray-900 line-clamp-1">{itemName}</h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs font-semibold text-gray-900">{itemPrice.toLocaleString()} ₽</span>
                    <Badge
                      variant="outline"
                      className={`text-xs px-1.5 py-0 h-5 ${getTrustColor(otherParticipant.trustLevel)}`}
                    >
                      {otherParticipant.trustLevel}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {lastMessage && (
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(lastMessage.timestamp)}</span>
                    </div>
                  )}
                  {unreadCount > 0 && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-125 group-hover:bg-blue-400 group-hover:shadow-lg">
                      <span className="text-white text-xs font-medium">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>

                              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="relative">
                    <Avatar className="h-6 w-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                      <AvatarImage src={otherParticipant.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">{otherParticipant.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {otherParticipant.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border border-white rounded-full transition-all duration-300 group-hover:scale-125 group-hover:bg-green-300"></div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-medium text-gray-700 truncate">{otherParticipant.name}</span>
                    <span className="text-xs text-gray-500 truncate">{formatLastOnline(otherParticipant.isOnline, otherParticipant.lastOnline)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <div
                  className={`text-sm line-clamp-1 flex items-center gap-1 ${
                    unreadCount > 0 && !isFromCurrentUser ? "font-medium text-gray-900" : "text-gray-500"
                  }`}
                >
                  {isFromCurrentUser && <span className="text-gray-400">Вы: </span>}
                  {getMessagePreview()}
                  {isFromCurrentUser && lastMessage?.isRead && (
                    <Check className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={handleBlock}>
          <Ban className="mr-2 h-4 w-4" />
          Заблокировать
        </ContextMenuItem>
        <ContextMenuItem onClick={handleReport}>
          <Flag className="mr-2 h-4 w-4" />
          Пожаловаться
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleDelete} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Удалить чат
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
} 