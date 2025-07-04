import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    telegramId: v.number(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
    languageCode: v.optional(v.string()),
    city: v.optional(v.string()),
    deliveryAddress: v.optional(v.string()),
    agreedToTerms: v.boolean(),
    onboardingCompleted: v.boolean(),
    registeredAt: v.number(),
    postsCount: v.optional(v.number()),
    soldCount: v.optional(v.number()),
    bio: v.optional(v.string()),
    rating: v.optional(v.number()),
    reviewsCount: v.optional(v.number()),
    totalViews: v.optional(v.number()),
    trustLevel: v.optional(v.union(v.literal("bronze"), v.literal("silver"), v.literal("gold"))),
    verificationStatus: v.optional(v.union(v.literal("verified"), v.literal("pending"), v.literal("unverified"))),
    avatarStorageId: v.optional(v.id("_storage")),
    lastOnline: v.optional(v.number()),
  }).index("by_telegram_id", ["telegramId"]),
  
  brands: defineTable({
    name: v.string(),
    postsCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"])
    .index("by_posts_count", ["postsCount"]),

  categories: defineTable({
    name: v.string(),
    parentId: v.optional(v.id("categories")),
    level: v.number(), // 0 = main category, 1 = subcategory, 2 = sub-subcategory
    order: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_parent", ["parentId"])
    .index("by_level", ["level"])
    .index("by_order", ["order"]),
  
  posts: defineTable({
    userId: v.id("users"),
    telegramId: v.number(),
    name: v.string(),
    brand: v.optional(v.string()),
    price: v.number(),
    condition: v.string(),
    year: v.number(),
    description: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    images: v.array(v.string()),
    defects: v.array(v.object({
      description: v.string(),
      location: v.string(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
    isActive: v.boolean(),
    soldAt: v.optional(v.number()),
    aiRating: v.optional(v.number()),
    aiRecommendation: v.optional(v.string()),
    aiExplanation: v.optional(v.string()),
    likesCount: v.optional(v.number()),
    likedBy: v.optional(v.array(v.id("users"))),
    views: v.optional(v.number()),
    viewedBy: v.optional(v.array(v.id("users"))),
  }).index("by_user", ["userId"])
    .index("by_telegram_id", ["telegramId"])
    .index("by_category", ["category"])
    .index("by_brand", ["brand"])
    .index("by_active", ["isActive"])
    .index("by_active_created", ["isActive", "createdAt"]),

  reviews: defineTable({
    reviewerId: v.id("users"),
    reviewedUserId: v.id("users"),
    postId: v.optional(v.id("posts")),
    rating: v.number(),
    comment: v.string(),
    reviewType: v.union(v.literal("buyer"), v.literal("seller")),
    createdAt: v.number(),
    isVisible: v.boolean(),
  }).index("by_reviewed_user", ["reviewedUserId"])
    .index("by_reviewer", ["reviewerId"])
    .index("by_post", ["postId"])
    .index("by_rating", ["rating"]),

  chats: defineTable({
    postId: v.id("posts"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    lastMessageId: v.optional(v.id("messages")),
    lastMessageAt: v.optional(v.number()),
    createdAt: v.number(),
    isActive: v.boolean(),
  }).index("by_buyer", ["buyerId"])
    .index("by_seller", ["sellerId"])
    .index("by_post", ["postId"])
    .index("by_participants", ["buyerId", "sellerId"])
    .index("by_active_last_message", ["isActive", "lastMessageAt"]),

  messages: defineTable({
    chatId: v.id("chats"),
    senderId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("file")),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    fileStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
  }).index("by_chat", ["chatId"])
    .index("by_sender", ["senderId"])
    .index("by_chat_created", ["chatId", "createdAt"])
    .index("by_unread", ["isRead"]),

  userBlocks: defineTable({
    blockerId: v.id("users"),
    blockedUserId: v.id("users"),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_blocker", ["blockerId"])
    .index("by_blocked", ["blockedUserId"])
    .index("by_block_pair", ["blockerId", "blockedUserId"]),

  complaints: defineTable({
    complainantId: v.id("users"),
    reportedUserId: v.id("users"),
    chatId: v.optional(v.id("chats")),
    postId: v.optional(v.id("posts")),
    category: v.union(
      v.literal("spam"),
      v.literal("fraud"),
      v.literal("inappropriate_content"),
      v.literal("fake_product"),
      v.literal("harassment"),
      v.literal("other")
    ),
    description: v.string(),
    status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("resolved"), v.literal("dismissed")),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    resolution: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_complainant", ["complainantId"])
    .index("by_reported_user", ["reportedUserId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_chat", ["chatId"]),
}); 