"use client"

import type React from "react"
import { useState, useRef, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Send, ImageIcon, FileText, X, Download, Eye, Award, MoreVertical, Camera, File } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ComplaintDialog } from "@/components/ui/complaint-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useTelegramUser } from "@/hooks/useTelegramUser"

interface Message {
  id: string
  content: string
  senderId: string
  timestamp: string
  type: "text" | "image" | "file"
  fileName?: string
  fileSize?: number
  fileUrl?: string
}

interface ChatData {
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
  userRole: "buyer" | "seller"
  messages: Message[]
}

interface ChatPageProps {
  params: Promise<{
    chatId: string
  }>
}

export default function ChatPage({ params }: ChatPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { chatId } = resolvedParams
  const telegramUser = useTelegramUser()
  
  const [newMessage, setNewMessage] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false)
  const [complaintDialog, setComplaintDialog] = useState<{
    open: boolean
    userName: string
    userId: string | null
  }>({
    open: false,
    userName: "",
    userId: null
  })
  const [deleteDialog, setDeleteDialog] = useState(false)
  
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentUser = useQuery(api.users.getUserByTelegramId, 
    telegramUser ? { telegramId: telegramUser.userId || 0 } : "skip"
  )
  
  const chatData = useQuery(api.chats.getChatById, 
    (currentUser && chatId && chatId.length > 10) ? { 
      chatId: chatId as any, 
      userId: currentUser._id 
    } : "skip"
  ) as ChatData | undefined

  const sendMessage = useMutation(api.chats.sendMessage)
  const deleteChat = useMutation(api.chats.deleteChat)
  const blockUser = useMutation(api.userBlocks.blockUser)
  const createComplaint = useMutation(api.complaints.createComplaint)

  const handleBack = () => {
    router.push("/messages")
  }

  const getTrustIcon = (trust: string) => {
    const colors = {
      bronze: "text-amber-600",
      silver: "text-gray-500",
      gold: "text-yellow-500",
    }
    return <Award className={`h-4 w-4 ${colors[trust as keyof typeof colors]}`} />
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleSendMessage = async () => {
    if (!chatData || !currentUser) return
    
    if (newMessage.trim() || attachedFiles.length > 0) {
      try {
        await sendMessage({
          chatId: chatData.id as any,
          senderId: currentUser._id,
          content: newMessage || `Прикреплен файл: ${attachedFiles[0]?.name}`,
          type: attachedFiles.length > 0 ? (attachedFiles[0].type.startsWith('image/') ? 'image' : 'file') : 'text',
          fileName: attachedFiles[0]?.name,
          fileSize: attachedFiles[0]?.size,
        })
        setNewMessage("")
        setAttachedFiles([])
        setShowAttachmentOptions(false)
      } catch (error) {
        console.error("Error sending message:", error)
      }
    }
  }

  const handleDeleteChat = async () => {
    if (!chatData || !currentUser) return
    
    try {
      await deleteChat({
        chatId: chatData.id as any,
        userId: currentUser._id
      })
      router.push("/messages")
    } catch (error) {
      console.error("Error deleting chat:", error)
    }
  }

  const handleBlockUser = async () => {
    if (!chatData || !currentUser) return

    try {
      await blockUser({
        blockerId: currentUser._id,
        blockedUserId: chatData.otherParticipant.id as any,
        reason: "Заблокирован через чат"
      })
      router.push("/messages")
    } catch (error) {
      console.error("Error blocking user:", error)
    }
  }

  const handleComplaintSubmit = async (category: string, description: string) => {
    if (!complaintDialog.userId || !chatData || !currentUser) return

    try {
      await createComplaint({
        complainantId: currentUser._id,
        reportedUserId: complaintDialog.userId as any,
        chatId: chatData.id as any,
        category: category as "spam" | "fraud" | "inappropriate_content" | "fake_product" | "harassment" | "other",
        description
      })
      setComplaintDialog({ open: false, userName: "", userId: null })
    } catch (error) {
      console.error("Error creating complaint:", error)
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachedFiles(files)
    setShowAttachmentOptions(false)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachedFiles(files)
    setShowAttachmentOptions(false)
  }

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAttachmentClick = () => {
    setShowAttachmentOptions(!showAttachmentOptions)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatData?.messages])

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

  // Check for invalid chat ID format
  if (chatId && chatId.length < 10) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Неверный ID чата</p>
          <Button onClick={() => router.push("/messages")} className="mt-4">
            Назад к сообщениям
          </Button>
        </div>
      </div>
    )
  }

  if (!chatData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Загрузка чата...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <Avatar className="h-8 w-8">
            <AvatarImage src={chatData.otherParticipant.avatar} />
            <AvatarFallback>{chatData.otherParticipant.name[0]}</AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-semibold text-sm">{chatData.otherParticipant.name}</h1>
              {getTrustIcon(chatData.otherParticipant.trustLevel)}
            </div>
            <p className="text-xs text-gray-500">
              {chatData.otherParticipant.isOnline ? "В сети" : "Был в сети недавно"}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setComplaintDialog({
                open: true,
                userName: chatData.otherParticipant.name,
                userId: chatData.otherParticipant.id
              })}
            >
              Пожаловаться
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleBlockUser}>
              Заблокировать
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteDialog(true)}
              className="text-red-600"
            >
              Удалить чат
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="mx-4 mt-4 mb-2">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <img
              src={chatData.itemImage}
              alt={chatData.itemName}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-medium text-sm">{chatData.itemName}</h3>
              <p className="text-sm font-bold text-green-600">{chatData.itemPrice}₽</p>
            </div>
            <Badge variant={chatData.userRole === "seller" ? "default" : "secondary"}>
              {chatData.userRole === "seller" ? "Продаю" : "Покупаю"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {chatData.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === "current-user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.senderId === "current-user"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-800 border"
              }`}
            >
              {message.type === "text" && (
                <p className="text-sm">{message.content}</p>
              )}
              
              {message.type === "image" && (
                <div className="space-y-2">
                  <img
                    src={message.fileUrl}
                    alt="Изображение"
                    className="rounded-lg max-w-full h-auto"
                  />
                  {message.content && message.content !== `Прикреплен файл: ${message.fileName}` && (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              )}
              
              {message.type === "file" && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
                    <FileText className="h-4 w-4" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{message.fileName}</p>
                      {message.fileSize && (
                        <p className="text-xs text-gray-500">{formatFileSize(message.fileSize)}</p>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="p-1">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                  {message.content && message.content !== `Прикреплен файл: ${message.fileName}` && (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              )}
              
              <p className="text-xs opacity-70 mt-1">
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {attachedFiles.length > 0 && (
        <div className="px-4 py-2 bg-gray-100 border-t">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border">
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAttachedFile(index)}
                    className="p-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-t px-4 py-3">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Введите сообщение..."
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              className="min-h-[44px] resize-none"
            />
          </div>
          
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAttachmentClick}
              className="p-2"
            >
              <File className="h-4 w-4" />
            </Button>
            
            {showAttachmentOptions && (
              <div className="absolute bottom-12 right-0 bg-white border rounded-lg shadow-lg p-2 space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full justify-start"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Фото
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Файл
                </Button>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && attachedFiles.length === 0}
            className="p-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />

      <ComplaintDialog
        open={complaintDialog.open}
        onOpenChange={(open) => setComplaintDialog({ open, userName: "", userId: null })}
        userName={complaintDialog.userName}
        onSubmit={handleComplaintSubmit}
      />

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
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
              onClick={handleDeleteChat}
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