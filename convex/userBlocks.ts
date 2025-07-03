import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const blockUser = mutation({
  args: {
    blockerId: v.id("users"),
    blockedUserId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.blockerId === args.blockedUserId) {
      throw new Error("Cannot block yourself");
    }

    const existingBlock = await ctx.db
      .query("userBlocks")
      .withIndex("by_block_pair", (q) => 
        q.eq("blockerId", args.blockerId).eq("blockedUserId", args.blockedUserId)
      )
      .first();

    if (existingBlock) {
      throw new Error("User is already blocked");
    }

    await ctx.db.insert("userBlocks", {
      blockerId: args.blockerId,
      blockedUserId: args.blockedUserId,
      reason: args.reason,
      createdAt: Date.now(),
    });

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_participants", (q) => 
        q.eq("buyerId", args.blockerId).eq("sellerId", args.blockedUserId)
      )
      .collect();

    const chatsAsSeller = await ctx.db
      .query("chats")
      .withIndex("by_participants", (q) => 
        q.eq("buyerId", args.blockedUserId).eq("sellerId", args.blockerId)
      )
      .collect();

    const allChats = [...chats, ...chatsAsSeller];
    
    await Promise.all(
      allChats.map(chat => 
        ctx.db.patch(chat._id, { isActive: false })
      )
    );

    return { success: true };
  },
});

export const unblockUser = mutation({
  args: {
    blockedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", parseInt(identity.subject)))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const block = await ctx.db
      .query("userBlocks")
      .withIndex("by_block_pair", (q) => 
        q.eq("blockerId", currentUser._id).eq("blockedUserId", args.blockedUserId)
      )
      .first();

    if (!block) {
      throw new Error("User is not blocked");
    }

    await ctx.db.delete(block._id);

    return { success: true };
  },
});

export const isUserBlocked = query({
  args: {
    blockedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", parseInt(identity.subject)))
      .first();

    if (!currentUser) {
      return false;
    }

    const block = await ctx.db
      .query("userBlocks")
      .withIndex("by_block_pair", (q) => 
        q.eq("blockerId", currentUser._id).eq("blockedUserId", args.blockedUserId)
      )
      .first();

    return !!block;
  },
});

export const getBlockedUsers = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", parseInt(identity.subject)))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const blocks = await ctx.db
      .query("userBlocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", currentUser._id))
      .order("desc")
      .collect();

    const blockedUsers = await Promise.all(
      blocks.map(async (block) => {
        const user = await ctx.db.get(block.blockedUserId);
        return {
          id: block._id,
          user: {
            id: user?._id,
            name: `${user?.firstName} ${user?.lastName || ""}`.trim(),
            username: user?.username,
            avatar: "/placeholder.svg",
          },
          reason: block.reason,
          blockedAt: new Date(block.createdAt).toISOString(),
        };
      })
    );

    return blockedUsers;
  },
}); 