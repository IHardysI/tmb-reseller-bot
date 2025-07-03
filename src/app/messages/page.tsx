"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import ChatItem from "@/components/widgets/chat-item"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/widgets/header"
import { ComplaintDialog } from "@/components/ui/complaint-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useTelegramUser } from "@/hooks/useTelegramUser"

interface ChatItemData {
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
  }
  lastMessage: {
    content: string
    timestamp: string
    senderId: string
    type: "text" | "image" | "file"
    fileName?: string
  } | null
  unreadCount: number
  userRole: "buyer" | "seller"
}

export default function MessagesPage() {
  const telegramUser = useTelegramUser()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<"all" | "selling" | "buying">("all")
  const [complaintDialog, setComplaintDialog] = useState<{
    open: boolean
    chatId: string | null
    userName: string
    userId: string | null
  }>({
    open: false,
    chatId: null,
    userName: "",
    userId: null
  })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    chatId: string | null
  }>({
    open: false,
    chatId: null
  })

  const currentUser = useQuery(api.users.getUserByTelegramId, 
    telegramUser ? { telegramId: telegramUser.userId || 0 } : "skip"
  )
  
  const chats = useQuery(api.chats.getUserChats, 
    currentUser ? { userId: currentUser._id } : "skip"
  ) as ChatItemData[] | undefined

  const deleteChatMutation = useMutation(api.chats.deleteChat)
  const blockUserMutation = useMutation(api.userBlocks.blockUser)
  const createComplaintMutation = useMutation(api.complaints.createComplaint)

  const handleChatClick = (chatId: string) => {
    setSelectedChatId(chatId)
    window.location.href = `/messages/${chatId}`
  }

  const handleDeleteChat = async (chatId: string) => {
    if (!currentUser) return
    
    try {
      await deleteChatMutation({
        chatId: chatId as any,
        userId: currentUser._id
      })
      setDeleteDialog({ open: false, chatId: null })
    } catch (error) {
      console.error("Error deleting chat:", error)
    }
  }

  const handleBlockUser = async (chatId: string) => {
    if (!currentUser || !chats) return
    
    const chat = chats.find((c) => c.id === chatId)
    if (!chat) return

    try {
      await blockUserMutation({
        blockerId: currentUser._id,
        blockedUserId: chat.otherParticipant.id as any,
        reason: "Заблокирован через чат"
      })
    } catch (error) {
      console.error("Error blocking user:", error)
    }
  }

  const handleReportUser = (chatId: string) => {
    if (!chats) return
    
    const chat = chats.find((c) => c.id === chatId)
    if (!chat) return

    setComplaintDialog({
      open: true,
      chatId,
      userName: chat.otherParticipant.name,
      userId: chat.otherParticipant.id
    })
  }

  const handleComplaintSubmit = async (category: string, description: string) => {
    if (!complaintDialog.userId || !complaintDialog.chatId || !currentUser) return

    try {
      await createComplaintMutation({
        complainantId: currentUser._id,
        reportedUserId: complaintDialog.userId as any,
        chatId: complaintDialog.chatId as any,
        category: category as any,
        description
      })
      setComplaintDialog({ open: false, chatId: null, userName: "", userId: null })
    } catch (error) {
      console.error("Error creating complaint:", error)
    }
  }

  const filteredChats = chats?.filter((chat) => {
    if (activeFilter === "all") return true
    if (activeFilter === "selling") return chat.userRole === "seller"
    if (activeFilter === "buying") return chat.userRole === "buyer"
    return true
  }) || []

  if (!telegramUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Загрузка пользователя...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Сообщения" />

      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex space-x-1 bg-gray-50 p-1 rounded-xl">
            <button
              onClick={() => setActiveFilter("all")}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeFilter === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              } md:hover:transform md:hover:transition-all`}
            >
              <span>Все</span>
              <Badge
                variant={activeFilter === "all" ? "default" : "secondary"}
                className={`h-5 px-1.5 text-xs transition-all duration-300 ${
                  activeFilter !== "all" ? "md:group-hover:bg-blue-100 md:group-hover:text-blue-700" : ""
                }`}
              >
                {chats?.length || 0}
              </Badge>
            </button>

            <button
              onClick={() => setActiveFilter("selling")}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeFilter === "selling"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              } md:hover:transform md:hover:transition-all`}
            >
              <span>Продаю</span>
              <Badge
                variant={activeFilter === "selling" ? "default" : "secondary"}
                className="h-5 px-1.5 text-xs transition-all duration-300"
              >
                {chats?.filter((chat) => chat.userRole === "seller").length || 0}
              </Badge>
            </button>

            <button
              onClick={() => setActiveFilter("buying")}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeFilter === "buying"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              } md:hover:transform md:hover:transition-all`}
            >
              <span>Покупаю</span>
              <Badge
                variant={activeFilter === "buying" ? "default" : "secondary"}
                className="h-5 px-1.5 text-xs transition-all duration-300"
              >
                {chats?.filter((chat) => chat.userRole === "buyer").length || 0}
              </Badge>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {!chats ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Загрузка чатов...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Нет сообщений</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChats.map((chat) => (
              <ChatItem
                key={chat.id}
                id={chat.id}
                itemId={chat.itemId}
                itemName={chat.itemName}
                itemImage={chat.itemImage}
                itemPrice={chat.itemPrice}
                otherParticipant={chat.otherParticipant}
                lastMessage={chat.lastMessage}
                unreadCount={chat.unreadCount}
                userRole={chat.userRole}
                onClick={() => handleChatClick(chat.id)}
                onDelete={() => setDeleteDialog({ open: true, chatId: chat.id })}
                onBlock={() => handleBlockUser(chat.id)}
                onReport={() => handleReportUser(chat.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ComplaintDialog
        open={complaintDialog.open}
        onOpenChange={(open) => setComplaintDialog({ open, chatId: null, userName: "", userId: null })}
        userName={complaintDialog.userName}
        onSubmit={handleComplaintSubmit}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, chatId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить чат?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Чат будет удален навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.chatId && handleDeleteChat(deleteDialog.chatId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}