import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const getCurrentUser = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_telegram_id", (q: any) => q.eq("telegramId", (identity as any).telegramId))
    .first();
  return user || null;
};

const requireAdmin = async (ctx: any) => {
  const user = await getCurrentUser(ctx);
  if (!user || user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
};

const assertModeratorMatchesCurrentUser = (currentUser: any, moderatorId?: string) => {
  if (moderatorId && currentUser?._id !== moderatorId) {
    throw new Error("Moderator mismatch");
  }
};

const SUSPICIOUS_KEYWORDS = {
  external_communication: [
    "whatsapp", "telegram", "viber", "watsapp", "вотсап", "ватсап", "телеграм", "телега", "вайбер",
    "звони", "позвони", "номер", "+7", "8-9", "моб", "тел", "phone", "call", "звонок",
    "почта", "email", "мейл", "мыло", "gmail", "yandex", "mail.ru", "@"
  ],
  direct_payment: [
    "наличные", "наличка", "кэш", "cash", "без комиссии", "без процентов", "напрямую",
    "карта на карту", "сбер", "сбербанк", "альфа", "тинькофф", "втб", "qiwi", "киви",
    "яндекс деньги", "юмани", "webmoney", "вебмани", "paypal", "пэйпал", "переведи на карту"
  ],
  personal_meeting: [
    "встретимся где-то", "встреча в парке", "увидимся лично", "подъехать к дому",
    "встретиться не в магазине", "приезжай ко мне", "встреча в кафе"
  ],
  bypass_platform: [
    "минуя сайт", "без сайта", "в обход", "напрямую без платформы", "минуя платформу", "без платформы",
    "не через сайт", "обойдем сервис", "сделаем без сайта", "без посредников", "мимо сервиса"
  ],
  suspicious_contact: [
    "инста", "instagram", "вк", "vk", "одноклассники", "фейсбук", "facebook", "тикток", "tiktok",
    "скайп", "skype", "дискорд", "discord", "зум", "zoom", "вотсап группа", "чат в телеге"
  ]
};

// Legitimate business terms that should NOT trigger moderation
const LEGITIMATE_BUSINESS_TERMS = [
  "самовывоз", "заберешь", "забрать", "забрать товар", "заберете", "самовывозом",
  "получить", "получение", "получить товар", "выдача", "выдача товара",
  "доставка", "доставить", "доставлю", "привезу", "привозу", "курьер",
  "встреча для передачи", "передача товара", "передам", "получите",
  "магазин", "торговый центр", "тц", "торговый", "точка выдачи",
  "адрес выдачи", "место выдачи", "пункт выдачи", "офис",
  "станция метро", "метро", "остановка", "автобусная остановка"
];

const RISK_LEVELS = {
  high: ["наличные", "карта на карту", "без комиссии", "минуя сайт", "в обход", "+7", "8-9", "переведи на карту"],
  medium: ["whatsapp", "telegram", "watsapp", "вотсап", "ватсап", "телеграм", "телега", "номер", "почта", "встретимся где-то"],
  low: ["инста", "вк", "skype"]
};

// Enhanced context-aware terms that require multiple suspicious indicators
const CONTEXT_REQUIRED_TERMS = [
  "встретимся", "встреча", "лично", "вживую", "приезжай", "встретиться", 
  "увидимся", "подъехать", "подъезжай", "напрямую"
];

interface DetectionResult {
  isSupicious: boolean;
  detectedKeywords: string[];
  riskLevel: "low" | "medium" | "high";
  warningType: "external_communication" | "direct_payment" | "personal_meeting" | "bypass_platform" | "suspicious_contact";
}

const analyzeMessage = (content: string): DetectionResult | null => {
  const normalizedContent = content.toLowerCase().trim();
  const detectedKeywords: string[] = [];
  let highestRiskLevel: "low" | "medium" | "high" = "low";
  let primaryWarningType: DetectionResult["warningType"] = "suspicious_contact";

  // First, check if message contains legitimate business terms
  const hasLegitimateTerms = LEGITIMATE_BUSINESS_TERMS.some(term => 
    normalizedContent.includes(term.toLowerCase())
  );

  // If message has legitimate business terms, be more lenient
  if (hasLegitimateTerms) {
    // Only flag if there are high-risk indicators combined with legitimate terms
    const hasHighRiskTerms = RISK_LEVELS.high.some(term => 
      normalizedContent.includes(term.toLowerCase())
    );
    
    if (!hasHighRiskTerms) {
      return null; // Don't flag legitimate business communications
    }
  }

  // Check for suspicious keywords
  let suspiciousIndicatorCount = 0;
  
  for (const [category, keywords] of Object.entries(SUSPICIOUS_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedContent.includes(keyword.toLowerCase())) {
        detectedKeywords.push(keyword);
        suspiciousIndicatorCount++;
        
        // Determine risk level
        if (RISK_LEVELS.high.includes(keyword)) {
          highestRiskLevel = "high";
        } else if (RISK_LEVELS.medium.includes(keyword) && highestRiskLevel !== "high") {
          highestRiskLevel = "medium";
        } else if (highestRiskLevel === "low") {
          // Only set to low if no higher risk found
        }
        
        // Set primary warning type
        primaryWarningType = category as DetectionResult["warningType"];
      }
    }
  }

  // Enhanced pattern checks
  const phonePattern = /(\+?7|8)[\s\-]?\(?9\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/;
  if (phonePattern.test(normalizedContent)) {
    detectedKeywords.push("phone_pattern");
    suspiciousIndicatorCount++;
    highestRiskLevel = "high";
    primaryWarningType = "external_communication";
  }

  // Email pattern
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (emailPattern.test(normalizedContent)) {
    detectedKeywords.push("email_pattern");
    suspiciousIndicatorCount++;
    if (highestRiskLevel !== "high") highestRiskLevel = "medium";
    primaryWarningType = "external_communication";
  }

  // Check for context-required terms
  const hasContextRequiredTerms = CONTEXT_REQUIRED_TERMS.some(term =>
    normalizedContent.includes(term.toLowerCase())
  );

  if (hasContextRequiredTerms && suspiciousIndicatorCount < 2 && !hasLegitimateTerms) {
    // Context-required terms need additional suspicious indicators
    // or should be combined with other suspicious activity
    const hasOtherSuspiciousTerms = detectedKeywords.some(keyword => 
      !CONTEXT_REQUIRED_TERMS.includes(keyword) && keyword !== "phone_pattern" && keyword !== "email_pattern"
    );

    if (!hasOtherSuspiciousTerms && highestRiskLevel === "low") {
      return null; // Don't flag isolated context-required terms
    }
  }

  // Only create moderation cases for medium/high risk or multiple suspicious indicators
  if (detectedKeywords.length === 0 || 
      (highestRiskLevel === "low" && suspiciousIndicatorCount < 2)) {
    return null;
  }

  return {
    isSupicious: true,
    detectedKeywords,
    riskLevel: highestRiskLevel,
    warningType: primaryWarningType
  };
};

export const createModerationCase = mutation({
  args: {
    messageId: v.id("messages"),
    chatId: v.id("chats"),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    messageContent: v.string(),
  },
  handler: async (ctx, args) => {
    const analysis = analyzeMessage(args.messageContent);
    
    if (!analysis || !analysis.isSupicious) {
      return null;
    }

    // Check if case already exists for this CHAT (not message)
    const existingCase = await ctx.db
      .query("moderationCases")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .filter(q => q.eq(q.field("status"), "pending"))
      .first();

    if (existingCase) {
      // Update existing case with new message content and higher risk level if needed
      const updates: any = {
        messageContent: args.messageContent,
        updatedAt: Date.now(),
      };
      
      // Update risk level if new message has higher risk
      if (analysis.riskLevel === "high" && existingCase.riskLevel !== "high") {
        updates.riskLevel = "high";
      } else if (analysis.riskLevel === "medium" && existingCase.riskLevel === "low") {
        updates.riskLevel = "medium";
      }
      
      // Add new keywords if they're not already present
      const newKeywords = analysis.detectedKeywords.filter(keyword => 
        !existingCase.detectedKeywords.includes(keyword)
      );
      if (newKeywords.length > 0) {
        updates.detectedKeywords = [...existingCase.detectedKeywords, ...newKeywords];
      }
      
      await ctx.db.patch(existingCase._id, updates);
      return existingCase._id;
    }

    // Get chat details
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }
    const participants = [chat.buyerId, chat.sellerId];
    const isSenderParticipant = participants.some((id) => id === args.senderId);
    const expectedReceiver = chat.buyerId === args.senderId ? chat.sellerId : chat.buyerId;
    if (!isSenderParticipant || expectedReceiver !== args.receiverId) {
      throw new Error("Invalid participants for moderation case");
    }

    const caseId = await ctx.db.insert("moderationCases", {
      chatId: args.chatId,
      buyerId: chat.buyerId,
      sellerId: chat.sellerId,
      postId: chat.postId,
      messageId: args.messageId,
      messageContent: args.messageContent,
      detectedKeywords: analysis.detectedKeywords,
      riskLevel: analysis.riskLevel,
      warningType: analysis.warningType,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return caseId;
  },
});

export const getModerationCases = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("resolved"), v.literal("dismissed"))),
    riskLevel: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let query = ctx.db.query("moderationCases");

    if (args.status) {
      query = query.filter(q => q.eq(q.field("status"), args.status));
    }

    if (args.riskLevel) {
      query = query.filter(q => q.eq(q.field("riskLevel"), args.riskLevel));
    }

    const cases = await query
      .order("desc")
      .take(args.limit || 50);

    const casesWithDetails = await Promise.all(
      cases.map(async (moderationCase) => {
        const buyer = await ctx.db.get(moderationCase.buyerId);
        const seller = await ctx.db.get(moderationCase.sellerId);
        const post = await ctx.db.get(moderationCase.postId);
        const chat = await ctx.db.get(moderationCase.chatId);

        // Get user avatars
        let buyerAvatar = "/placeholder.svg";
        if (buyer?.avatarStorageId) {
          try {
            const url = await ctx.storage.getUrl(buyer.avatarStorageId);
            if (url) buyerAvatar = url;
          } catch (error) {
            console.log("Error generating buyer avatar URL:", error);
          }
        }

        let sellerAvatar = "/placeholder.svg";
        if (seller?.avatarStorageId) {
          try {
            const url = await ctx.storage.getUrl(seller.avatarStorageId);
            if (url) sellerAvatar = url;
          } catch (error) {
            console.log("Error generating seller avatar URL:", error);
          }
        }

        return {
          ...moderationCase,
          buyer: buyer ? {
            id: buyer._id,
            firstName: buyer.firstName,
            lastName: buyer.lastName,
            username: buyer.username,
            avatar: buyerAvatar,
            isBlocked: buyer.isBlocked || false,
            blockReason: buyer.blockReason || null,
            blockedAt: buyer.blockedAt || null,
          } : null,
          seller: seller ? {
            id: seller._id,
            firstName: seller.firstName,
            lastName: seller.lastName,
            username: seller.username,
            avatar: sellerAvatar,
            isBlocked: seller.isBlocked || false,
            blockReason: seller.blockReason || null,
            blockedAt: seller.blockedAt || null,
          } : null,
          post: post ? {
            id: post._id,
            name: post.name,
            price: post.price,
            image: post.images[0] || "/placeholder.svg",
          } : null,
          chatExists: !!chat,
          totalWarnings: 1,
          highestRiskLevel: moderationCase.riskLevel,
          primaryWarningType: moderationCase.warningType,
        };
      })
    );

    return casesWithDetails;
  },
});

export const resolveModerationCase = mutation({
  args: {
    caseId: v.id("moderationCases"),
    moderatorId: v.id("users"),
    actionType: v.union(
      v.literal("block_buyer"),
      v.literal("block_seller"),
      v.literal("block_both"),
      v.literal("dismiss_case"),
      v.literal("warning_issued")
    ),
    reason: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAdmin(ctx);
    assertModeratorMatchesCurrentUser(currentUser, args.moderatorId);
    const moderationCase = await ctx.db.get(args.caseId);
    if (!moderationCase) {
      throw new Error("Moderation case not found");
    }

    // Perform the action
    if (args.actionType === "block_buyer") {
      const existingBlock = await ctx.db
        .query("userBlocks")
        .withIndex("by_blocked", (q) => q.eq("blockedUserId", moderationCase.buyerId))
        .first();
      if (!existingBlock) {
        await ctx.db.insert("userBlocks", {
          blockerId: args.moderatorId,
          blockedUserId: moderationCase.buyerId,
          reason: args.reason,
          createdAt: Date.now(),
        });
      }
      await ctx.db.patch(moderationCase.buyerId, {
        isBlocked: true,
        blockedAt: Date.now(),
        blockedBy: args.moderatorId,
        blockReason: args.reason,
      });
    } else if (args.actionType === "block_seller") {
      const existingBlock = await ctx.db
        .query("userBlocks")
        .withIndex("by_blocked", (q) => q.eq("blockedUserId", moderationCase.sellerId))
        .first();
      if (!existingBlock) {
        await ctx.db.insert("userBlocks", {
          blockerId: args.moderatorId,
          blockedUserId: moderationCase.sellerId,
          reason: args.reason,
          createdAt: Date.now(),
        });
      }
      await ctx.db.patch(moderationCase.sellerId, {
        isBlocked: true,
        blockedAt: Date.now(),
        blockedBy: args.moderatorId,
        blockReason: args.reason,
      });
    } else if (args.actionType === "block_both") {
      const existingBuyerBlock = await ctx.db
        .query("userBlocks")
        .withIndex("by_blocked", (q) => q.eq("blockedUserId", moderationCase.buyerId))
        .first();
      if (!existingBuyerBlock) {
        await ctx.db.insert("userBlocks", {
          blockerId: args.moderatorId,
          blockedUserId: moderationCase.buyerId,
          reason: args.reason,
          createdAt: Date.now(),
        });
      }
      const existingSellerBlock = await ctx.db
        .query("userBlocks")
        .withIndex("by_blocked", (q) => q.eq("blockedUserId", moderationCase.sellerId))
        .first();
      if (!existingSellerBlock) {
        await ctx.db.insert("userBlocks", {
          blockerId: args.moderatorId,
          blockedUserId: moderationCase.sellerId,
          reason: args.reason,
          createdAt: Date.now(),
        });
      }
      await ctx.db.patch(moderationCase.buyerId, {
        isBlocked: true,
        blockedAt: Date.now(),
        blockedBy: args.moderatorId,
        blockReason: args.reason,
      });
      await ctx.db.patch(moderationCase.sellerId, {
        isBlocked: true,
        blockedAt: Date.now(),
        blockedBy: args.moderatorId,
        blockReason: args.reason,
      });
    }

    // Update the moderation case
    await ctx.db.patch(args.caseId, {
      status: args.actionType === "dismiss_case" ? "dismissed" : "resolved",
      resolvedBy: args.moderatorId,
      resolvedAt: Date.now(),
      actionType: args.actionType,
      reason: args.reason,
      notes: args.notes,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getBlockedUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userBlocks = await ctx.db
      .query("userBlocks")
      .order("desc")
      .take(args.limit || 100);

    const blocksWithDetails = await Promise.all(
      userBlocks.map(async (block) => {
        const blockedUser = await ctx.db.get(block.blockedUserId);
        const blocker = await ctx.db.get(block.blockerId);

        // Get avatar for blocked user
        let blockedUserAvatar = "/placeholder.svg";
        if (blockedUser?.avatarStorageId) {
          try {
            const url = await ctx.storage.getUrl(blockedUser.avatarStorageId);
            if (url) blockedUserAvatar = url;
          } catch (error) {
            console.log("Error generating blocked user avatar URL:", error);
          }
        }

        return {
          ...block,
          blockedUser: blockedUser ? {
            id: blockedUser._id,
            firstName: blockedUser.firstName,
            lastName: blockedUser.lastName,
            username: blockedUser.username,
            avatar: blockedUserAvatar,
          } : null,
          blocker: blocker ? {
            id: blocker._id,
            firstName: blocker.firstName,
            lastName: blocker.lastName,
          } : null,
          canBeReversed: true,
        };
      })
    );

    return blocksWithDetails;
  },
});

export const unblockUser = mutation({
  args: {
    blockedUserId: v.id("users"),
    moderatorId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAdmin(ctx);
    assertModeratorMatchesCurrentUser(currentUser, args.moderatorId);
    // Find and remove the block record
    const blockRecord = await ctx.db
      .query("userBlocks")
      .filter(q => q.eq(q.field("blockedUserId"), args.blockedUserId))
      .first();

    if (!blockRecord) {
      throw new Error("Block record not found");
    }

    await ctx.db.delete(blockRecord._id);

    await ctx.db.patch(args.blockedUserId, {
      isBlocked: false,
      unblockedAt: Date.now(),
      unblockedBy: args.moderatorId,
      unblockReason: args.reason,
    });

    return { success: true };
  },
});

export const getModerationStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const allCases = await ctx.db.query("moderationCases").collect();
    const blockedUsers = await ctx.db.query("userBlocks").collect();
    
    const stats = {
      totalCases: allCases.length,
      pendingCases: allCases.filter(c => c.status === "pending").length,
      resolvedCases: allCases.filter(c => c.status === "resolved").length,
      dismissedCases: allCases.filter(c => c.status === "dismissed").length,
      highRiskCases: allCases.filter(c => c.riskLevel === "high").length,
      mediumRiskCases: allCases.filter(c => c.riskLevel === "medium").length,
      lowRiskCases: allCases.filter(c => c.riskLevel === "low").length,
      blockedUsers: blockedUsers.length,
      byType: {
        external_communication: allCases.filter(c => c.warningType === "external_communication").length,
        direct_payment: allCases.filter(c => c.warningType === "direct_payment").length,
        personal_meeting: allCases.filter(c => c.warningType === "personal_meeting").length,
        bypass_platform: allCases.filter(c => c.warningType === "bypass_platform").length,
        suspicious_contact: allCases.filter(c => c.warningType === "suspicious_contact").length,
      }
    };

    return stats;
  },
});

export const getChatMessages = query({
  args: {
    chatId: v.id("chats"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .take(args.limit || 50);

    const messagesWithUsers = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        
        // Get avatar URL
        let senderAvatar = "/placeholder.svg";
        if (sender?.avatarStorageId) {
          try {
            const url = await ctx.storage.getUrl(sender.avatarStorageId);
            if (url) senderAvatar = url;
          } catch (error) {
            console.log("Error generating sender avatar URL:", error);
          }
        }

        return {
          ...message,
          sender: message.type === "system" ? {
            id: "system",
            firstName: "Система",
            lastName: "Модерации",
            username: "system",
            avatar: "/placeholder.svg",
          } : sender ? {
            id: sender._id,
            firstName: sender.firstName,
            lastName: sender.lastName,
            username: sender.username,
            avatar: senderAvatar,
          } : null,
        };
      })
    );

    return messagesWithUsers.reverse(); // Return in chronological order
  },
});

export const sendWarningMessage = mutation({
  args: {
    caseId: v.id("moderationCases"),
    moderatorId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAdmin(ctx);
    assertModeratorMatchesCurrentUser(currentUser, args.moderatorId);
    const moderationCase = await ctx.db.get(args.caseId);
    if (!moderationCase) {
      throw new Error("Moderation case not found");
    }

    const warningMessage = `⚠️ ПРЕДУПРЕЖДЕНИЕ ОТ МОДЕРАЦИИ ⚠️

Обнаружена попытка обхода платформы в вашем диалоге.

Причина: ${args.reason}

Напоминаем, что все сделки должны проходить через нашу платформу для обеспечения безопасности всех участников. 

Повторные нарушения могут привести к блокировке аккаунта.

С уважением, команда модерации`;

    // Send warning message to chat as system message
    await ctx.db.insert("messages", {
      chatId: moderationCase.chatId,
      senderId: args.moderatorId,
      content: warningMessage,
      type: "system",
      createdAt: Date.now(),
      isRead: false,
    });

    // Clear hidden status for both users so they see the warning
    await ctx.db.patch(moderationCase.chatId, {
      hiddenFor: [],
    });

    // Update the moderation case
    await ctx.db.patch(args.caseId, {
      status: "resolved",
      resolvedBy: args.moderatorId,
      resolvedAt: Date.now(),
      actionType: "warning_issued",
      reason: args.reason,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const blockUserPlatformWide = mutation({
  args: {
    userId: v.id("users"),
    moderatorId: v.id("users"),
    reason: v.string(),
    caseId: v.optional(v.id("moderationCases")),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAdmin(ctx);
    assertModeratorMatchesCurrentUser(currentUser, args.moderatorId);
    // Check if user is already blocked
    const existingBlock = await ctx.db
      .query("userBlocks")
      .filter(q => q.eq(q.field("blockedUserId"), args.userId))
      .first();

    if (existingBlock) {
      throw new Error("User is already blocked");
    }

    // Check user's current status
    const user = await ctx.db.get(args.userId);
    if (user?.isBlocked) {
      throw new Error("User is already blocked");
    }

    // Add user to blocked list
    await ctx.db.insert("userBlocks", {
      blockerId: args.moderatorId,
      blockedUserId: args.userId,
      reason: args.reason,
      createdAt: Date.now(),
    });

    // Update user's account to mark as blocked
    await ctx.db.patch(args.userId, {
      isBlocked: true,
      blockedAt: Date.now(),
      blockedBy: args.moderatorId,
      blockReason: args.reason,
    });

    // Don't auto-close the case - let moderator manually close it
    // Cases remain open so moderator can review and manually close

    return { success: true };
  },
});

export const unblockUserPlatformWide = mutation({
  args: {
    userId: v.id("users"),
    moderatorId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAdmin(ctx);
    assertModeratorMatchesCurrentUser(currentUser, args.moderatorId);
    // Check if user is actually blocked
    const user = await ctx.db.get(args.userId);
    if (!user?.isBlocked) {
      throw new Error("User is not blocked");
    }

    // Remove from blocked list
    const blockRecord = await ctx.db
      .query("userBlocks")
      .filter(q => q.eq(q.field("blockedUserId"), args.userId))
      .first();

    if (!blockRecord) {
      throw new Error("Block record not found");
    }

    await ctx.db.delete(blockRecord._id);

    // Update user's account to unblock
    await ctx.db.patch(args.userId, {
      isBlocked: false,
      unblockedAt: Date.now(),
      unblockedBy: args.moderatorId,
      unblockReason: args.reason,
    });

    return { success: true };
  },
});

export const checkUserBlockStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      throw new Error("Unauthorized");
    }
    const isSelf = currentUser._id === args.userId;
    if (!isSelf && currentUser.role !== "admin") {
      throw new Error("Forbidden");
    }
    const user = await ctx.db.get(args.userId);
    const blockRecord = await ctx.db
      .query("userBlocks")
      .filter(q => q.eq(q.field("blockedUserId"), args.userId))
      .first();

    return {
      isBlocked: user?.isBlocked || false,
      blockReason: user?.blockReason || null,
      blockedAt: user?.blockedAt || null,
      hasBlockRecord: !!blockRecord,
    };
  },
}); 