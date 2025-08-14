import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

const checkMessageForSuspiciousContent = async (ctx: any, messageId: any, chatId: any, senderId: any, receiverId: any, content: string) => {
  try {
    // Use the moderation system to check and create cases
    const caseId = await ctx.runMutation(api.moderation.createModerationCase, {
      messageId,
      chatId,
      senderId,
      receiverId,
      messageContent: content,
    });
    
    if (caseId) {
      console.log("Moderation case created:", caseId);
    }
  } catch (error) {
    console.error("Error in moderation check:", error);
  }
};

export const getUserChats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }

    const allBuyerChats = await ctx.db
      .query("chats")
      .withIndex("by_buyer", (q) => q.eq("buyerId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    const allSellerChats = await ctx.db
      .query("chats")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    const chats = allBuyerChats.filter(chat => 
      !chat.hiddenFor || !chat.hiddenFor.includes(args.userId)
    );

    const sellerChats = allSellerChats.filter(chat => 
      !chat.hiddenFor || !chat.hiddenFor.includes(args.userId)
    );

    const allChats = [...chats, ...sellerChats].sort((a, b) => 
      (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt)
    );

    const chatsWithDetails = await Promise.all(
      allChats.map(async (chat) => {
        const post = await ctx.db.get(chat.postId);
        const otherParticipantId = chat.buyerId === args.userId ? chat.sellerId : chat.buyerId;
        const otherParticipant = await ctx.db.get(otherParticipantId);
        
        // Get avatar URL from storage
        let avatarUrl = "/placeholder.svg";
        if (otherParticipant?.avatarStorageId) {
          try {
            const url = await ctx.storage.getUrl(otherParticipant.avatarStorageId);
            if (url) avatarUrl = url;
          } catch (error) {
            console.log("Error generating avatar URL:", error);
          }
        }
        
        let lastMessage = null;
        if (chat.lastMessageId) {
          lastMessage = await ctx.db.get(chat.lastMessageId);
        }

        const unreadCount = await ctx.db
          .query("messages")
          .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
          .filter((q) => 
            q.and(
              q.eq(q.field("isRead"), false),
              q.neq(q.field("senderId"), args.userId)
            )
          )
          .collect();

        // Calculate online status
        const now = Date.now();
        const lastOnline = otherParticipant?.lastOnline || 0;
        const timeDiff = now - lastOnline;
        const isOnline = timeDiff <= 300000; // 5 minutes = online

        return {
          id: chat._id,
          itemId: post?._id,
          itemName: post?.name || "Удаленный товар",
          itemImage: post?.images?.[0] || "/placeholder.svg",
          itemPrice: post?.price || 0,
          otherParticipant: {
            id: otherParticipant?._id,
            name: `${otherParticipant?.firstName} ${otherParticipant?.lastName || ""}`.trim(),
            avatar: avatarUrl,
            trustLevel: otherParticipant?.trustLevel || "bronze",
            isOnline: isOnline,
            lastOnline: lastOnline,
          },
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: new Date(lastMessage.createdAt).toISOString(),
            senderId: lastMessage.senderId === args.userId ? "current-user" : lastMessage.senderId,
            type: lastMessage.type,
            fileName: lastMessage.fileName,
            isRead: lastMessage.isRead,
          } : null,
          unreadCount: unreadCount.length,
          userRole: chat.buyerId === args.userId ? "buyer" : "seller",
        };
      })
    );

    return chatsWithDetails;
  },
});

export const getChatById = query({
  args: { 
    chatId: v.id("chats"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    const post = await ctx.db.get(chat.postId);
    const otherParticipantId = chat.buyerId === args.userId ? chat.sellerId : chat.buyerId;
    const otherParticipant = await ctx.db.get(otherParticipantId);

    // Get avatar URL from storage
    let avatarUrl = "/placeholder.svg";
    if (otherParticipant?.avatarStorageId) {
      try {
        const url = await ctx.storage.getUrl(otherParticipant.avatarStorageId);
        if (url) avatarUrl = url;
      } catch (error) {
        console.log("Error generating avatar URL:", error);
      }
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_created", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();

    const messagesWithUrls = await Promise.all(
      messages.map(async (msg) => ({
        id: msg._id,
        content: msg.content,
        senderId: msg.senderId === args.userId ? "current-user" : msg.senderId,
        timestamp: new Date(msg.createdAt).toISOString(),
        type: msg.type,
        fileName: msg.fileName,
        fileSize: msg.fileSize,
        fileUrl: msg.fileStorageId ? await ctx.storage.getUrl(msg.fileStorageId) : undefined,
        isRead: msg.isRead,
        readAt: msg.readAt ? new Date(msg.readAt).toISOString() : undefined,
      }))
    );

    // Get the last read message by the other participant
    const lastReadMessage = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .filter((q) => 
        q.and(
          q.eq(q.field("senderId"), args.userId),
          q.eq(q.field("isRead"), true)
        )
      )
      .order("desc")
      .first();

    // Calculate online status
    const now = Date.now();
    const lastOnline = otherParticipant?.lastOnline || 0;
    const timeDiff = now - lastOnline;
    const isOnline = timeDiff <= 300000; // 5 minutes = online

    return {
      id: chat._id,
      itemId: post?._id,
      itemName: post?.name || "Удаленный товар",
      itemImage: post?.images?.[0] || "/placeholder.svg",
      itemPrice: post?.price || 0,
      otherParticipant: {
        id: otherParticipant?._id,
        name: `${otherParticipant?.firstName} ${otherParticipant?.lastName || ""}`.trim(),
        avatar: avatarUrl,
        trustLevel: otherParticipant?.trustLevel || "bronze",
        isOnline: isOnline,
        lastOnline: lastOnline,
      },
      userRole: chat.buyerId === args.userId ? "buyer" : "seller",
      messages: messagesWithUrls,
      lastReadMessageId: lastReadMessage?._id,
    };
  },
});

export const getExistingChat = query({
  args: {
    postId: v.id("posts"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existingChat = await ctx.db
      .query("chats")
      .withIndex("by_participants", (q) => 
        q.eq("buyerId", args.buyerId).eq("sellerId", args.sellerId)
      )
      .filter((q) => q.eq(q.field("postId"), args.postId))
      .first();

    return existingChat;
  },
});

export const createChat = mutation({
  args: {
    postId: v.id("posts"),
    buyerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const existingChat = await ctx.db
      .query("chats")
      .withIndex("by_participants", (q) => 
        q.eq("buyerId", args.buyerId).eq("sellerId", post.userId)
      )
      .filter((q) => q.eq(q.field("postId"), args.postId))
      .first();

    if (existingChat) {
      return existingChat._id;
    }

    const chatId = await ctx.db.insert("chats", {
      postId: args.postId,
      buyerId: args.buyerId,
      sellerId: post.userId,
      createdAt: Date.now(),
      isActive: true,
    });

    return chatId;
  },
});

export const deleteChat = mutation({
  args: { 
    chatId: v.id("chats"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    const currentHiddenFor = chat.hiddenFor || [];
    const updatedHiddenFor = currentHiddenFor.includes(args.userId) 
      ? currentHiddenFor 
      : [...currentHiddenFor, args.userId];

    await ctx.db.patch(args.chatId, { hiddenFor: updatedHiddenFor });

    return { success: true };
  },
});

export const markMessagesAsRead = mutation({
  args: { 
    chatId: v.id("chats"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Mark all unread messages sent by OTHER users as read
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isRead"), false),
          q.neq(q.field("senderId"), args.userId)
        )
      )
      .collect();

    await Promise.all(
      unreadMessages.map(message =>
        ctx.db.patch(message._id, { 
          isRead: true, 
          readAt: Date.now() 
        })
      )
    );

    return { 
      success: true, 
      markedCount: unreadMessages.length 
    };
  },
});

export const sendMessage = mutation({
  args: {
    chatId: v.id("chats"),
    senderId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("file")),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    fileStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }
    if (chat.buyerId !== args.senderId && chat.sellerId !== args.senderId) {
      throw new Error("Forbidden");
    }
    const sender = await ctx.db.get(args.senderId);
    if (!sender) {
      throw new Error("Sender not found");
    }
    if (sender.isBlocked) {
      throw new Error("User is blocked");
    }

    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      senderId: args.senderId,
      content: args.content,
      type: args.type,
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileStorageId: args.fileStorageId,
      createdAt: Date.now(),
      isRead: false,
    });

    await ctx.db.patch(args.chatId, {
      lastMessageId: messageId,
      lastMessageAt: Date.now(),
      hiddenFor: [],
    });

    // Check message for suspicious content
    if (args.type === "text" && args.content.trim()) {
      const chat = await ctx.db.get(args.chatId);
      if (chat) {
        const receiverId = chat.buyerId === args.senderId ? chat.sellerId : chat.buyerId;
        await checkMessageForSuspiciousContent(ctx, messageId, args.chatId, args.senderId, receiverId, args.content);
      }
    }

    // Send notification to the receiver
    try {
      console.log(`🔍 Starting notification process for chat ${args.chatId}`);
      const receiverId = chat.buyerId === args.senderId ? chat.sellerId : chat.buyerId;
      const sender = await ctx.db.get(args.senderId);
      const receiver = await ctx.db.get(receiverId);
      const post = await ctx.db.get(chat.postId);

      console.log(`📊 Notification debug info:`, {
        receiverId: receiverId,
        senderId: args.senderId,
        receiverHasChatId: !!receiver?.telegramChatId,
        receiverChatId: receiver?.telegramChatId,
        senderExists: !!sender,
        postExists: !!post,
        postName: post?.name
      });

      if (receiver?.telegramChatId && sender && post) {
        // Check if user is currently online (active in app) - don't send notification if they are
        const now = Date.now();
        const lastOnline = receiver.lastOnline || 0;
        const timeDiff = now - lastOnline;
        const isCurrentlyOnline = timeDiff <= 60000; // 1 minute = online
        
        console.log(`⏰ Online status check:`, {
          now,
          lastOnline,
          timeDiff,
          isCurrentlyOnline,
          receiverTelegramId: receiver.telegramId
        });
        
        if (!isCurrentlyOnline) {
          const messagePreview = args.content.length > 50 ? args.content.substring(0, 50) + "..." : args.content;
          const senderName = sender.firstName + (sender.lastName ? ` ${sender.lastName}` : "");
          
          console.log(`📤 Attempting to send notification:`, {
            telegramChatId: receiver.telegramChatId,
            itemName: post.name,
            messagePreview,
            senderName
          });
          
          // Send notification via Convex action
          const result = await ctx.scheduler.runAfter(0, api.chats.sendTelegramNotificationAction, {
            telegramChatId: receiver.telegramChatId,
            itemName: post.name,
            messagePreview: messagePreview,
            senderName: senderName,
          });
          
          console.log(`📨 Notification scheduled:`, result);
        } else {
          console.log(`📱 User ${receiver.telegramId} is currently online, skipping notification`);
        }
      } else {
        console.log(`⚠️ Missing data for notification:`, {
          receiverHasChatId: !!receiver?.telegramChatId,
          senderExists: !!sender,
          postExists: !!post
        });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }

    return messageId;
  },
});

export const startChatWithMessage = mutation({
  args: {
    postId: v.id("posts"),
    buyerId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("file")),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    fileStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }
    const buyer = await ctx.db.get(args.buyerId);
    if (!buyer) {
      throw new Error("Buyer not found");
    }
    if (buyer.isBlocked) {
      throw new Error("User is blocked");
    }

    // Check if chat already exists
    const existingChat = await ctx.db
      .query("chats")
      .withIndex("by_participants", (q) => 
        q.eq("buyerId", args.buyerId).eq("sellerId", post.userId)
      )
      .filter((q) => q.eq(q.field("postId"), args.postId))
      .first();

    let chatId;
    if (existingChat) {
      chatId = existingChat._id;
    } else {
      // Create new chat only when first message is sent
      chatId = await ctx.db.insert("chats", {
        postId: args.postId,
        buyerId: args.buyerId,
        sellerId: post.userId,
        createdAt: Date.now(),
        isActive: true,
      });
    }

    // Send the first message
    const messageId = await ctx.db.insert("messages", {
      chatId: chatId,
      senderId: args.buyerId,
      content: args.content,
      type: args.type,
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileStorageId: args.fileStorageId,
      createdAt: Date.now(),
      isRead: false,
    });

    // Update chat with first message
    await ctx.db.patch(chatId, {
      lastMessageId: messageId,
      lastMessageAt: Date.now(),
      hiddenFor: [],
    });

    // Check message for suspicious content
    if (args.type === "text" && args.content.trim()) {
      const post = await ctx.db.get(args.postId);
      if (post) {
        await checkMessageForSuspiciousContent(ctx, messageId, chatId, args.buyerId, post.userId, args.content);
      }
    }

    return chatId;
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== args.userId) {
      throw new Error("You can only delete your own messages");
    }

    await ctx.db.delete(args.messageId);

    const chat = await ctx.db.get(message.chatId);
    if (chat && chat.lastMessageId === args.messageId) {
      const lastMessage = await ctx.db
        .query("messages")
        .withIndex("by_chat_created", (q) => q.eq("chatId", message.chatId))
        .order("desc")
        .first();

      await ctx.db.patch(message.chatId, {
        lastMessageId: lastMessage?._id,
        lastMessageAt: lastMessage?.createdAt || Date.now(),
      });
    }

    return { success: true };
  },
});

export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== args.userId) {
      throw new Error("You can only edit your own messages");
    }

    if (message.type !== "text") {
      throw new Error("You can only edit text messages");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
    });

    return { success: true };
  },
});

export const getMessageReadStatus = query({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_created", (q) => q.eq("chatId", args.chatId))
      .filter((q) => q.eq(q.field("senderId"), args.userId))
      .order("desc")
      .collect();

    const readStatus = new Map();
    
    for (const message of messages) {
      readStatus.set(message._id, message.isRead);
    }

    return readStatus;
  },
});

export const sendTelegramNotificationAction = action({
  args: {
    telegramChatId: v.number(),
    itemName: v.string(),
    messagePreview: v.string(),
    senderName: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`🚀 sendTelegramNotificationAction called with:`, args);
    
    try {
      const botToken = process.env.BOT_TOKEN;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;

      console.log(`🔧 Environment check:`, {
        hasBotToken: !!botToken,
        hasAppUrl: !!appUrl,
        botTokenLength: botToken?.length,
        appUrl: appUrl
      });

      if (!botToken || !appUrl) {
        console.error("Missing BOT_TOKEN or NEXT_PUBLIC_APP_URL environment variables");
        return { success: false, error: "Configuration error" };
      }

      const notificationText = `💬 Новое сообщение в чате "${args.itemName}"\n\n👤 От: ${args.senderName}\n💭 ${args.messagePreview}\n\n📱 Откройте приложение, чтобы ответить`;

      console.log(`📝 Notification text:`, notificationText);

      const requestBody = {
        chat_id: args.telegramChatId,
        text: notificationText,
        reply_markup: {
          inline_keyboard: [[
            {
              text: "📱 Открыть чат",
              web_app: { url: `${appUrl}/messages` }
            }
          ]]
        }
      };

      console.log(`📤 Sending request to Telegram API:`, requestBody);

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📥 Telegram API response status:`, response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Telegram API error:", errorData);
        return { success: false, error: "Telegram API error" };
      }

      const responseData = await response.json();
      console.log(`📥 Telegram API response data:`, responseData);

      console.log(`✅ Notification sent to chat ${args.telegramChatId} for item "${args.itemName}"`);
      return { success: true };
    } catch (error) {
      console.error("Error sending notification:", error);
      return { success: false, error: "Internal error" };
    }
  },
}); 