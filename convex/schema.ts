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
  }).index("by_telegram_id", ["telegramId"]),
}); 