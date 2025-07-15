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

  console.log('🔍 useMessageNotifications debug:', {
    userData: !!userData?._id,
    isOnMessagesPage,
    pathname
  })

  const userChats = useQuery(
    api.chats.getUserChats,
    userData?._id ? { userId: userData._id as Id<"users"> } : 'skip'
  )

  const showToast = useCallback((chat: any) => {
    console.log('🔍 showToast called for chat:', {
      hasLastMessage: !!chat.lastMessage,
      senderId: chat.lastMessage?.senderId,
      isCurrentUser: chat.lastMessage?.senderId === 'current-user',
      messageTime: chat.lastMessage ? new Date(chat.lastMessage.timestamp).getTime() : 0,
      lastMessageTimeRef: lastMessageTimeRef.current,
      initialized: initializedRef.current,
      chatId: chat.id,
      itemName: chat.itemName
    })

    if (chat.lastMessage && chat.lastMessage.senderId !== 'current-user') {
      const messageTime = new Date(chat.lastMessage.timestamp).getTime()
      
      console.log('🔍 Checking message conditions:', {
        messageTime,
        lastMessageTimeRef: lastMessageTimeRef.current,
        isNewer: messageTime > lastMessageTimeRef.current,
        initialized: initializedRef.current,
        willShowToast: messageTime > lastMessageTimeRef.current && initializedRef.current
      })
      
      // Show toast if message is newer than last known message AND we're initialized
      if (messageTime > lastMessageTimeRef.current && initializedRef.current) {
        const messagePreview = chat.lastMessage.content.length > 30 
          ? chat.lastMessage.content.substring(0, 30) + '...' 
          : chat.lastMessage.content

        console.log('📱 Showing toast for new message:', {
          sender: chat.otherParticipant.name,
          itemName: chat.itemName,
          preview: messagePreview,
          messageTime,
          lastKnownTime: lastMessageTimeRef.current
        })

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
    console.log('🔍 Checking for new messages:', {
      hasUserData: !!userData?._id,
      hasUserChats: !!userChats,
      isOnMessagesPage,
      chatsCount: userChats?.length || 0,
      initialized: initializedRef.current
    })

    if (!userData?._id || !userChats) {
      console.log('❌ Skipping message check - missing user data or chats')
      return
    }

    // Don't show toasts when on messages page
    if (isOnMessagesPage) {
      console.log('⚠️ On messages page - toasts disabled (normal behavior)')
      return
    }

    console.log('✅ Processing chats for new messages')
    userChats.forEach(showToast)
  }, [userChats, userData?._id, isOnMessagesPage, showToast])

  useEffect(() => {
    if (userChats && !initializedRef.current) {
      const latestMessageTime = Math.max(
        ...userChats
          .filter(chat => chat.lastMessage && chat.lastMessage.senderId !== 'current-user')
          .map(chat => new Date(chat.lastMessage!.timestamp).getTime())
      )
      
      console.log('🔍 Initializing message notifications:', {
        chatsCount: userChats.length,
        latestMessageTime,
        hasMessages: latestMessageTime > 0
      })
      
      // Initialize even if no messages exist yet
      lastMessageTimeRef.current = latestMessageTime > 0 ? latestMessageTime : Date.now()
      initializedRef.current = true
      console.log('✅ Message notifications initialized with time:', lastMessageTimeRef.current)
    }
  }, [userChats])
} 