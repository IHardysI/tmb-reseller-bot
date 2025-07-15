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

    let avatar = undefined;
    if (user.avatarStorageId) {
      try {
        avatar = await ctx.storage.getUrl(user.avatarStorageId);
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
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
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

    const result = await ctx.db.patch(user._id, {
      avatarStorageId: args.avatarStorageId,
    });
    
    console.log("User avatar updated for telegramId:", args.telegramId);
    return result;
  },
});

export const updateLastOnline = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      lastOnline: Date.now(),
    });
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    let avatar = undefined;
    if (user.avatarStorageId) {
      try {
        avatar = await ctx.storage.getUrl(user.avatarStorageId);
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

export const updateUserChatId = mutation({
  args: {
    telegramId: v.number(),
    telegramChatId: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (!user) {
      console.log(`User not found for telegramId: ${args.telegramId}`);
      return null;
    }

    await ctx.db.patch(user._id, {
      telegramChatId: args.telegramChatId,
    });
    
    console.log(`Updated chat ID for user ${args.telegramId}: ${args.telegramChatId}`);
    return user._id;
  },
});

export const setUserRole = mutation({
  args: {
    telegramId: v.number(),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("telegramId"), args.telegramId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      role: args.role,
    });

    return { success: true };
  },
});

export const checkUserRole = query({
  args: {
    telegramId: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("telegramId"), args.telegramId))
      .first();

    if (!user) {
      return null;
    }

    return {
      role: user.role || "user",
      isAdmin: user.role === "admin",
    };
  },
});

export const getCurrentUserRole = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("telegramId"), identity.telegramId))
      .first();

    if (!user) {
      return null;
    }

    return {
      role: user.role || "user",
      isAdmin: user.role === "admin",
    };
  },
}); 