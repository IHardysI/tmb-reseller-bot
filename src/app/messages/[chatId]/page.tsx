"use client"

import type React from "react"
import { useState, useRef, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Send, ImageIcon, FileText, X, Download, Eye, Award, MoreVertical, Camera, File } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ComplaintDialog } from "@/components/ui/complaint-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useTelegramUser } from "@/hooks/useTelegramUser"
import { PageLoader } from '@/components/ui/loader'
import ProductDetail from '@/components/widgets/product-detail'
import { Id } from "@/../convex/_generated/dataModel"

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
  const [isUploading, setIsUploading] = useState(false)
  const [textareaHeight, setTextareaHeight] = useState(20)
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
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  
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
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl)

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
        setIsUploading(true)
        let fileStorageId = undefined
        
        // Upload file to storage if there's an attached file
        if (attachedFiles.length > 0) {
          const file = attachedFiles[0]
          const uploadUrl = await generateUploadUrl()
          
          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            body: file,
          })
          
          if (uploadResponse.ok) {
            const { storageId } = await uploadResponse.json()
            fileStorageId = storageId
          } else {
            throw new Error("Failed to upload file")
          }
        }
        
        await sendMessage({
          chatId: chatData.id as any,
          senderId: currentUser._id,
          content: newMessage || `Прикреплен файл: ${attachedFiles[0]?.name}`,
          type: attachedFiles.length > 0 ? (attachedFiles[0].type.startsWith('image/') ? 'image' : 'file') : 'text',
          fileName: attachedFiles[0]?.name,
          fileSize: attachedFiles[0]?.size,
          fileStorageId: fileStorageId,
        })
        setNewMessage("")
        setAttachedFiles([])
        setShowAttachmentOptions(false)
        setTextareaHeight(20)
      } catch (error) {
        console.error("Error sending message:", error)
      } finally {
        setIsUploading(false)
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

  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto'
    const scrollHeight = element.scrollHeight
    const minHeight = 20
    const maxHeight = 120
    const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight))
    element.style.height = `${newHeight}px`
    setTextareaHeight(newHeight)
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    adjustTextareaHeight(e.target)
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatData?.messages])

  if (!telegramUser) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader text="Загрузка..." />
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader text="Загрузка пользователя..." />
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
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
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

      <Card className="mx-4 mt-4 mb-2 flex-shrink-0 py-0! cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setSelectedProductId(chatData.itemId); setProductDialogOpen(true); }}>
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

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {chatData.messages.map((message) => {
          const isCurrentUser = message.senderId === "current-user"
          return (
            <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isCurrentUser ? "order-2" : "order-1"}`}>
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    isCurrentUser
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white text-gray-900 rounded-bl-md shadow-sm border"
                  }`}
                >
                  {message.type === "text" && <p className="text-sm leading-relaxed">{message.content}</p>}

                  {message.type === "image" && (
                    <div className="space-y-2">
                      <img
                        src={message.fileUrl || "/placeholder.svg"}
                        alt={message.fileName}
                        className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      />
                      {message.content && message.content !== `Прикреплен файл: ${message.fileName}` && (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}
                    </div>
                  )}

                  {message.type === "file" && (
                    <div className="space-y-2">
                      <div
                        className={`flex items-center space-x-3 p-3 rounded-lg ${
                          isCurrentUser ? "bg-blue-500" : "bg-gray-50"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${isCurrentUser ? "bg-blue-400" : "bg-gray-200"} flex-shrink-0`}
                        >
                          <FileText className={`h-4 w-4 ${isCurrentUser ? "text-white" : "text-gray-600"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${isCurrentUser ? "text-white" : "text-gray-900"}`}
                          >
                            {message.fileName}
                          </p>
                          {message.fileSize && (
                            <p className={`text-xs ${isCurrentUser ? "text-blue-100" : "text-gray-500"}`}>
                              {formatFileSize(message.fileSize)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${
                            isCurrentUser ? "hover:bg-blue-400 text-white" : "hover:bg-gray-200 text-gray-600"
                          }`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      {message.content && message.content !== `Прикреплен файл: ${message.fileName}` && (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}
                    </div>
                  )}
                </div>

                <p className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? "text-right" : "text-left"} px-2`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>

              {!isCurrentUser && (
                <div className="order-2 ml-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={chatData.otherParticipant.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">{chatData.otherParticipant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          )
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">печатает...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t flex-shrink-0">
        {attachedFiles.length > 0 && (
          <div className="px-4 pt-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Прикрепленные файлы ({attachedFiles.length})
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachedFiles([])}
                  className="text-xs text-gray-500 hover:text-red-500 h-6 px-2"
                >
                  Очистить все
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div
                      className={`p-2.5 rounded-xl ${file.type.startsWith("image/") ? "bg-green-100" : "bg-blue-100"}`}
                    >
                      {file.type.startsWith("image/") ? (
                        <ImageIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <p className="text-xs text-gray-500 capitalize">
                          {file.type.startsWith("image/") ? "Изображение" : "Документ"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttachedFile(index)}
                      className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showAttachmentOptions && (
          <div className="px-4 pt-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                Выберите тип файла
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex flex-col items-center space-y-2 h-auto py-4 border-2 border-dashed border-green-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                >
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Camera className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm text-gray-900">Фото</p>
                    <p className="text-xs text-gray-500">JPG, PNG, HEIC</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center space-y-2 h-auto py-4 border-2 border-dashed border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <File className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm text-gray-900">Документ</p>
                    <p className="text-xs text-gray-500">PDF, DOC, TXT</p>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAttachmentClick}
                className={`h-12 w-12 flex-shrink-0 rounded-2xl transition-all duration-300 ${
                  showAttachmentOptions
                    ? "text-purple-600 bg-purple-100 hover:bg-purple-200 scale-110"
                    : "text-gray-500 hover:text-purple-600 hover:bg-purple-50 hover:scale-110"
                }`}
              >
                {showAttachmentOptions ? (
                  <X className="h-5 w-5" />
                ) : (
                  <div className="relative">
                    <div className="w-5 h-5 border-2 border-current rounded-lg"></div>
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-current rounded-full"></div>
                  </div>
                )}
              </Button>
              <div className="flex-1 relative">
                <div className="bg-gray-50 rounded-2xl border-2 border-transparent hover:border-gray-200 focus-within:border-blue-300 focus-within:bg-white transition-all duration-200 shadow-sm hover:shadow-md focus-within:shadow-lg min-h-[3rem] flex items-center">
                  <textarea
                    value={newMessage}
                    onChange={handleTextareaChange}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder="Написать сообщение..."
                    className="border-0 bg-transparent focus:ring-0 focus:outline-none text-base px-5 py-0 min-h-[1.5rem] max-h-32 resize-none placeholder:text-gray-400 w-full overflow-y-auto leading-6"
                    rows={1}
                    style={{
                      height: "auto",
                      minHeight: "1.5rem",
                      maxHeight: "8rem",
                    }}
                    onInput={e => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = "auto"
                      target.style.height = Math.min(target.scrollHeight, 128) + "px"
                    }}
                  />
                </div>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && attachedFiles.length === 0) || isUploading}
                className={`h-12 w-12 rounded-2xl flex-shrink-0 transition-all duration-300 relative overflow-hidden flex items-center justify-center ${
                  newMessage.trim() || attachedFiles.length > 0
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-110 shadow-lg hover:shadow-xl"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <Send className="h-5 w-5 relative z-10" />
                    <div className="absolute inset-0 rounded-2xl bg-white/10 animate-pulse"></div>
                  </>
                )}
              </Button>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      </div>

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

      {selectedProductId && (
        <ProductDetail
          postId={selectedProductId as Id<'posts'>}
          isOpen={productDialogOpen}
          onClose={() => setProductDialogOpen(false)}
          hideMessageSellerButton
        />
      )}
    </div>
  )
} 