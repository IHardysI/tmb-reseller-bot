import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserByTelegramId = query({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (!user) return null;

    // If avatar URL is missing but we have storageId, generate the URL
    let avatar = user.avatar;
    if (!avatar && user.avatarStorageId) {
      try {
        const generatedUrl = await ctx.storage.getUrl(user.avatarStorageId);
        avatar = generatedUrl || undefined;
        console.log("Generated avatar URL from storageId:", avatar);
      } catch (error) {
        console.log("Error generating avatar URL from storageId:", error);
      }
    }

    return {
      ...user,
      avatar: avatar,
    };
  },
});

export const completeOnboarding = mutation({
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
      telegramId: args.telegramId,
      firstName: args.firstName,
      lastName: args.lastName,
      username: args.username,
      languageCode: args.languageCode,
      city: args.city,
      deliveryAddress: args.deliveryAddress,
      agreedToTerms: true,
      onboardingCompleted: true,
      registeredAt: Date.now(),
    });
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
      onboardingCompleted: true,
      registeredAt: Date.now(),
    });
  },
});

export const updateUserProfile = mutation({
  args: {
    telegramId: v.number(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    city: v.string(),
    deliveryAddress: v.string(),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.patch(user._id, {
      firstName: args.firstName,
      lastName: args.lastName,
      city: args.city,
      deliveryAddress: args.deliveryAddress,
      bio: args.bio,
      avatar: args.avatar,
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const refreshUserAvatarUrl = mutation({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (!user || !user.avatarStorageId) {
      throw new Error("User not found or no avatar storage ID");
    }

    try {
      const avatarUrl = await ctx.storage.getUrl(user.avatarStorageId);
      if (avatarUrl) {
        await ctx.db.patch(user._id, { avatar: avatarUrl });
        console.log("Refreshed avatar URL for user:", args.telegramId);
        return avatarUrl;
      }
    } catch (error) {
      console.log("Error refreshing avatar URL:", error);
      throw error;
    }
  },
});

export const updateUserAvatar = mutation({
  args: {
    telegramId: v.number(),
    avatarStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the URL with retries since it might not be immediately available
    let avatarUrl = null;
    let retries = 0;
    const maxRetries = 5;
    
    while (!avatarUrl && retries < maxRetries) {
      try {
        avatarUrl = await ctx.storage.getUrl(args.avatarStorageId);
        if (avatarUrl) break;
      } catch (error) {
        console.log(`Retry ${retries + 1}: Error getting storage URL:`, error);
      }
      
      retries++;
      if (retries < maxRetries) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log("Avatar URL generated after", retries, "retries:", avatarUrl);

    if (!avatarUrl) {
      throw new Error("Failed to get avatar URL from storage");
    }

    const result = await ctx.db.patch(user._id, {
      avatar: avatarUrl,
      avatarStorageId: args.avatarStorageId,
    });
    
    console.log("User avatar updated for telegramId:", args.telegramId, "with URL:", avatarUrl);
    return result;
  },
}); 