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
    avatar: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
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
}); 