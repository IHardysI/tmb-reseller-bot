import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUserChats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_buyer", (q) => q.eq("buyerId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    const sellerChats = await ctx.db
      .query("chats")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    const allChats = [...chats, ...sellerChats].sort((a, b) => 
      (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt)
    );

    const chatsWithDetails = await Promise.all(
      allChats.map(async (chat) => {
        const post = await ctx.db.get(chat.postId);
        const otherParticipantId = chat.buyerId === args.userId ? chat.sellerId : chat.buyerId;
        const otherParticipant = await ctx.db.get(otherParticipantId);
        
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

        return {
          id: chat._id,
          itemId: post?._id,
          itemName: post?.name || "Удаленный товар",
          itemImage: post?.images?.[0] || "/placeholder.svg",
          itemPrice: post?.price || 0,
          otherParticipant: {
            id: otherParticipant?._id,
            name: `${otherParticipant?.firstName} ${otherParticipant?.lastName || ""}`.trim(),
            avatar: "/placeholder.svg",
            trustLevel: otherParticipant?.trustLevel || "bronze",
            isOnline: false,
          },
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: new Date(lastMessage.createdAt).toISOString(),
            senderId: lastMessage.senderId,
            type: lastMessage.type,
            fileName: lastMessage.fileName,
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

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_created", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();

    return {
      id: chat._id,
      itemId: post?._id,
      itemName: post?.name || "Удаленный товар",
      itemImage: post?.images?.[0] || "/placeholder.svg",
      itemPrice: post?.price || 0,
      otherParticipant: {
        id: otherParticipant?._id,
        name: `${otherParticipant?.firstName} ${otherParticipant?.lastName || ""}`.trim(),
        avatar: "/placeholder.svg",
        trustLevel: otherParticipant?.trustLevel || "bronze",
        isOnline: false,
      },
      userRole: chat.buyerId === args.userId ? "buyer" : "seller",
      messages: messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        senderId: msg.senderId === args.userId ? "current-user" : msg.senderId,
        timestamp: new Date(msg.createdAt).toISOString(),
        type: msg.type,
        fileName: msg.fileName,
        fileSize: msg.fileSize,
        fileUrl: msg.fileStorageId ? `/api/files/${msg.fileStorageId}` : undefined,
      })),
    };
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

    await ctx.db.patch(args.chatId, { isActive: false });

    return { success: true };
  },
});

export const markMessagesAsRead = mutation({
  args: { 
    chatId: v.id("chats"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
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

    return { success: true };
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
    });

    return messageId;
  },
}); 