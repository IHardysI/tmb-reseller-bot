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
  }).index("by_telegram_id", ["telegramId"]),
  
  posts: defineTable({
    userId: v.id("users"),
    telegramId: v.number(),
    name: v.string(),
    brand: v.string(),
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
    .index("by_active", ["isActive"]),
}); 