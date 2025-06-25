import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserByTelegramId = query({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();
  },
});

export const createUser = mutation({
  args: {
    telegramId: v.number(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
    languageCode: v.optional(v.string()),
    city: v.string(),
    deliveryAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (existingUser) {
      throw new Error("User already exists");
    }

    return await ctx.db.insert("users", {
      ...args,
      agreedToTerms: true,
      registeredAt: Date.now(),
    });
  },
}); 