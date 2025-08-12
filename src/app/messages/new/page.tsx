"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, ImageIcon, FileText, Award } from "lucide-react"
import { useTelegramUser } from "@/hooks/useTelegramUser"
import { PageLoader } from "@/components/ui/loader"
import { ImagePreview } from "@/components/ui/image-preview"
import { Id } from "@/../convex/_generated/dataModel"

export default function NewChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const telegramUser = useTelegramUser()
  const postId = searchParams.get('postId')
  
  const [message, setMessage] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<{
    isOpen: boolean
    images: string[]
    currentIndex: number
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0
  })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentUser = useQuery(
    api.users.getUserByTelegramId, 
    telegramUser?.userId ? { telegramId: telegramUser.userId } : "skip"
  )

  const post = useQuery(
    api.posts.getPostById,
    postId ? { postId: postId as Id<"posts"> } : "skip"
  )

  const seller = useQuery(
    api.users.getUserById,
    post?.userId ? { userId: post.userId } : "skip"
  )

  const existingChat = useQuery(
    api.chats.getExistingChat,
    currentUser && post ? { 
      buyerId: currentUser._id, 
      sellerId: post.userId, 
      postId: post._id 
    } : "skip"
  )

  const startChatWithMessage = useMutation(api.chats.startChatWithMessage)
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl)

  useEffect(() => {
    if (existingChat) {
      router.replace(`/messages/${existingChat._id}`)
    }
  }, [existingChat, router])

  const handleBack = () => {
    router.back()
  }

  const getTrustIcon = (trust: string) => {
    const colors = {
      bronze: "text-amber-600",
      silver: "text-gray-500",
      gold: "text-yellow-500",
    }
    return <Award className={`h-4 w-4 ${colors[trust as keyof typeof colors]}`} />
  }

  const handleSendMessage = async () => {
    if (!message.trim() && attachedFiles.length === 0) return
    if (!currentUser || !post) return

    setIsLoading(true)
    try {
      let fileStorageId = undefined
      
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

      const chatId = await startChatWithMessage({
        postId: post._id,
        buyerId: currentUser._id,
        content: message || `Прикреплен файл: ${attachedFiles[0]?.name}`,
        type: attachedFiles.length > 0 ? (attachedFiles[0].type.startsWith('image/') ? 'image' : 'file') : 'text',
        fileName: attachedFiles[0]?.name,
        fileSize: attachedFiles[0]?.size,
        fileStorageId: fileStorageId,
      })
      
      router.push(`/messages/${chatId}`)
    } catch (error) {
      console.error("Error starting chat:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachedFiles(files)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachedFiles(files)
  }

  const removeAttachedFile = () => {
    setAttachedFiles([])
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    textarea.style.height = 'auto'
    const scrollHeight = textarea.scrollHeight
    const minHeight = 60
    const maxHeight = 200
    const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight))
    textarea.style.height = `${newHeight}px`
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    adjustTextareaHeight()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleImagePreview = (file: File) => {
    const url = URL.createObjectURL(file)
    setImagePreview({
      isOpen: true,
      images: [url],
      currentIndex: 0
    })
  }

  const handleCloseImagePreview = () => {
    setImagePreview({
      isOpen: false,
      images: [],
      currentIndex: 0
    })
  }

  if (!telegramUser) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader text="" />
      </div>
    )
  }

  if (!currentUser || !post || !seller) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader text="" />
      </div>
    )
  }

  if (!postId) {
    router.push('/messages')
    return null
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b px-4 py-3 flex items-center space-x-3 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-semibold text-lg">Написать продавцу</h1>
      </div>

      <div className="flex-1 flex flex-col p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={seller?.avatar || "/placeholder.svg"} />
                <AvatarFallback>{seller?.firstName?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-sm">{`${seller?.firstName || ''} ${seller?.lastName || ''}`.trim()}</h3>
                  {getTrustIcon(seller?.trustLevel || "bronze")}
                </div>
                <p className="text-xs text-gray-500">Продавец</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Image
                src={post.images[0] || "/placeholder.svg"}
                alt={post.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-lg object-cover"
                unoptimized
              />
              <div className="flex-1">
                <h4 className="font-medium text-sm">{post.name}</h4>
                <p className="text-sm font-bold text-green-600">{post.price.toLocaleString()}₽</p>
              </div>
              <Badge variant="secondary">Покупаю</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 flex flex-col">
          <CardContent className="p-4 flex-1 flex flex-col">
            <h3 className="font-medium text-sm mb-3">Ваше сообщение</h3>
            
            {attachedFiles.length > 0 && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {attachedFiles[0].type.startsWith('image/') ? (
                      <button
                        onClick={() => handleImagePreview(attachedFiles[0])}
                        className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                      >
                        <ImageIcon className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">{attachedFiles[0].name}</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">{attachedFiles[0].name}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeAttachedFile}
                    className="text-blue-600 hover:text-red-600 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              </div>
            )}

            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение продавцу..."
              className="flex-1 min-h-[120px] resize-none"
              style={{ height: '120px' }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border-t p-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => imageInputRef.current?.click()}
            className="flex-shrink-0"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={(!message.trim() && attachedFiles.length === 0) || isLoading}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? "Отправка..." : "Отправить"}
          </Button>
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
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <ImagePreview
        images={imagePreview.images}
        isOpen={imagePreview.isOpen}
        onClose={handleCloseImagePreview}
        initialIndex={imagePreview.currentIndex}
      />
    </div>
  )
} 