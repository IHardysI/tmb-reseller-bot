"use client"

import React, { useEffect, useRef, useCallback } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { useUserStore } from '@/stores/userStore'
import { useToast } from '@/components/ui/use-toast'
import { usePathname, useRouter } from 'next/navigation'

export function useMessageNotifications() {
  const { userData } = useUserStore()
  const { toast } = useToast()
  const pathname = usePathname()
  const router = useRouter()
  const lastMessageTimeRef = useRef<number>(0)
  const initializedRef = useRef(false)

  const isOnMessagesPage = pathname.startsWith('/messages')

  const userChats = useQuery(
    api.chats.getUserChats,
    userData?._id ? { userId: userData._id as Id<"users"> } : 'skip'
  )

  const showToast = useCallback((chat: any) => {
    if (chat.lastMessage && chat.lastMessage.senderId !== 'current-user') {
      const messageTime = new Date(chat.lastMessage.timestamp).getTime()
      
      // Show toast if message is newer than last known message AND we're initialized
      if (messageTime > lastMessageTimeRef.current && initializedRef.current) {
        const messagePreview = chat.lastMessage.content.length > 30 
          ? chat.lastMessage.content.substring(0, 30) + '...' 
          : chat.lastMessage.content

        const toastResult = toast({
          title: `💬 ${chat.itemName}`,
          description: `${chat.otherParticipant.name}: ${messagePreview}`,
          duration: 3000,
          onClick: () => {
            toastResult.dismiss()
            router.push(`/messages/${chat.id}`)
          }
        })
      }
      
      lastMessageTimeRef.current = Math.max(lastMessageTimeRef.current, messageTime)
    }
  }, [toast, router])

  useEffect(() => {
    if (!userData?._id || !userChats) return
    if (isOnMessagesPage) return
    userChats.forEach(showToast)
  }, [userChats, userData?._id, isOnMessagesPage, showToast])

  useEffect(() => {
    if (userChats && !initializedRef.current) {
      const latestMessageTime = Math.max(
        ...userChats
          .filter(chat => chat.lastMessage && chat.lastMessage.senderId !== 'current-user')
          .map(chat => new Date(chat.lastMessage!.timestamp).getTime())
      )
      lastMessageTimeRef.current = latestMessageTime > 0 ? latestMessageTime : Date.now()
      initializedRef.current = true
    }
  }, [userChats])
} 