import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const SUSPICIOUS_KEYWORDS = {
  external_communication: [
    "whatsapp", "telegram", "viber", "watsapp", "вотсап", "ватсап", "телеграм", "телега", "вайбер",
    "звони", "позвони", "номер", "+7", "8-9", "моб", "тел", "phone", "call", "звонок",
    "почта", "email", "мейл", "мыло", "gmail", "yandex", "mail.ru", "@"
  ],
  direct_payment: [
    "наличные", "наличка", "кэш", "cash", "без комиссии", "без процентов", "напрямую",
    "карта на карту", "сбер", "сбербанк", "альфа", "тинькофф", "втб", "qiwi", "киви",
    "яндекс деньги", "юмани", "webmoney", "вебмани", "paypal", "пэйпал"
  ],
  personal_meeting: [
    "встретимся", "встреча", "лично", "вживую", "приезжай", "заберешь", "самовывоз",
    "встретиться", "увидимся", "подъехать", "подъезжай", "забрать лично"
  ],
  bypass_platform: [
    "минуя сайт", "без сайта", "в обход", "напрямую", "минуя платформу", "без платформы",
    "не через сайт", "обойдем", "сделаем сами", "без посредников", "мимо сервиса"
  ],
  suspicious_contact: [
    "инста", "instagram", "вк", "vk", "одноклассники", "фейсбук", "facebook", "тикток", "tiktok",
    "скайп", "skype", "дискорд", "discord", "зум", "zoom", "вотсап группа", "чат в телеге"
  ]
};

const RISK_LEVELS = {
  high: ["наличные", "карта на карту", "без комиссии", "минуя сайт", "в обход", "+7", "8-9"],
  medium: ["встретимся", "лично", "whatsapp", "telegram", "номер", "почта"],
  low: ["самовывоз", "заберешь", "инста", "вк"]
};

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

  // Check for suspicious keywords
  for (const [category, keywords] of Object.entries(SUSPICIOUS_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedContent.includes(keyword.toLowerCase())) {
        detectedKeywords.push(keyword);
        
        // Determine risk level
        if (RISK_LEVELS.high.includes(keyword)) {
          highestRiskLevel = "high";
        } else if (RISK_LEVELS.medium.includes(keyword) && highestRiskLevel !== "high") {
          highestRiskLevel = "medium";
        }
        
        // Set primary warning type
        primaryWarningType = category as DetectionResult["warningType"];
      }
    }
  }

  // Additional pattern checks
  const phonePattern = /(\+?7|8)[\s\-]?\(?9\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/;
  if (phonePattern.test(normalizedContent)) {
    detectedKeywords.push("phone_pattern");
    highestRiskLevel = "high";
    primaryWarningType = "external_communication";
  }

  // Email pattern
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (emailPattern.test(normalizedContent)) {
    detectedKeywords.push("email_pattern");
    if (highestRiskLevel !== "high") highestRiskLevel = "medium";
    primaryWarningType = "external_communication";
  }

  if (detectedKeywords.length === 0) {
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

    // Check if case already exists for this message
    const existingCase = await ctx.db
      .query("moderationCases")
      .filter(q => q.eq(q.field("messageId"), args.messageId))
      .first();

    if (existingCase) {
      return existingCase._id;
    }

    // Get chat details
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
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
          } : null,
          seller: seller ? {
            id: seller._id,
            firstName: seller.firstName,
            lastName: seller.lastName,
            username: seller.username,
            avatar: sellerAvatar,
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
    const moderationCase = await ctx.db.get(args.caseId);
    if (!moderationCase) {
      throw new Error("Moderation case not found");
    }

    // Perform the action
    if (args.actionType === "block_buyer") {
      await ctx.db.insert("userBlocks", {
        blockerId: args.moderatorId,
        blockedUserId: moderationCase.buyerId,
        reason: args.reason,
        createdAt: Date.now(),
      });
    } else if (args.actionType === "block_seller") {
      await ctx.db.insert("userBlocks", {
        blockerId: args.moderatorId,
        blockedUserId: moderationCase.sellerId,
        reason: args.reason,
        createdAt: Date.now(),
      });
    } else if (args.actionType === "block_both") {
      await ctx.db.insert("userBlocks", {
        blockerId: args.moderatorId,
        blockedUserId: moderationCase.buyerId,
        reason: args.reason,
        createdAt: Date.now(),
      });
      await ctx.db.insert("userBlocks", {
        blockerId: args.moderatorId,
        blockedUserId: moderationCase.sellerId,
        reason: args.reason,
        createdAt: Date.now(),
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
    // Find and remove the block record
    const blockRecord = await ctx.db
      .query("userBlocks")
      .filter(q => q.eq(q.field("blockedUserId"), args.blockedUserId))
      .first();

    if (!blockRecord) {
      throw new Error("Block record not found");
    }

    await ctx.db.delete(blockRecord._id);

    return { success: true };
  },
});

export const getModerationStats = query({
  args: {},
  handler: async (ctx) => {
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