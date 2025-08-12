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

export const updateUserChatIdFromFrontend = mutation({
  args: {
    telegramId: v.number(),
    telegramChatId: v.number(),
  },
  handler: async (ctx, args) => {
    console.log(`🔧 updateUserChatIdFromFrontend called with:`, args);
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    console.log(`🔍 User lookup result:`, {
      found: !!user,
      userId: user?._id,
      currentChatId: user?.telegramChatId
    });

    if (!user) {
      console.log(`❌ User not found for telegramId: ${args.telegramId}`);
      return { success: false, error: "User not found" };
    }

    console.log(`📝 Updating user ${user._id} with chat ID: ${args.telegramChatId}`);
    
    await ctx.db.patch(user._id, {
      telegramChatId: args.telegramChatId,
    });
    
    console.log(`✅ Successfully updated chat ID for user ${args.telegramId}: ${args.telegramChatId}`);
    return { success: true, userId: user._id };
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

export const debugUserChatIds = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    return users.map(user => ({
      telegramId: user.telegramId,
      telegramChatId: user.telegramChatId,
      hasChatId: !!user.telegramChatId,
      firstName: user.firstName,
      lastName: user.lastName
    }));
  },
});



export const saveSellerPayoutInfo = mutation({
  args: {
    telegramId: v.number(),
    payout_token: v.string(),
    first6: v.string(),
    last4: v.string(),
    card_type: v.string(),
    issuer_name: v.string(),
    issuer_country: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      sellerInfo: {
        payout_token: args.payout_token,
        first6: args.first6,
        last4: args.last4,
        card_type: args.card_type,
        issuer_name: args.issuer_name,
        issuer_country: args.issuer_country,
        submittedAt: Date.now(),
      },
    });

    return { success: true };
  },
});

 