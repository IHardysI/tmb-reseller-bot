import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createComplaint = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    if (args.complainantId === args.reportedUserId) {
      throw new Error("Cannot report yourself");
    }

    const existingComplaint = await ctx.db
      .query("complaints")
      .withIndex("by_complainant", (q) => q.eq("complainantId", args.complainantId))
      .filter((q) => 
        q.and(
          q.eq(q.field("reportedUserId"), args.reportedUserId),
          args.chatId ? q.eq(q.field("chatId"), args.chatId) : q.eq(q.field("chatId"), undefined),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingComplaint) {
      throw new Error("You have already reported this user for this issue");
    }

    const complaintId = await ctx.db.insert("complaints", {
      complainantId: args.complainantId,
      reportedUserId: args.reportedUserId,
      chatId: args.chatId,
      postId: args.postId,
      category: args.category,
      description: args.description,
      status: "pending",
      createdAt: Date.now(),
    });

    return { 
      success: true, 
      complaintId 
    };
  },
});

export const getUserComplaints = query({
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

    const complaints = await ctx.db
      .query("complaints")
      .withIndex("by_complainant", (q) => q.eq("complainantId", currentUser._id))
      .order("desc")
      .collect();

    const complaintsWithDetails = await Promise.all(
      complaints.map(async (complaint) => {
        const reportedUser = await ctx.db.get(complaint.reportedUserId);
        let chat = null;
        let post = null;

        if (complaint.chatId) {
          chat = await ctx.db.get(complaint.chatId);
        }
        if (complaint.postId) {
          post = await ctx.db.get(complaint.postId);
        }

        return {
          id: complaint._id,
          reportedUser: {
            id: reportedUser?._id,
            name: `${reportedUser?.firstName} ${reportedUser?.lastName || ""}`.trim(),
            username: reportedUser?.username,
          },
          category: complaint.category,
          description: complaint.description,
          status: complaint.status,
          createdAt: new Date(complaint.createdAt).toISOString(),
          chat: chat ? {
            id: chat._id,
            postId: chat.postId,
          } : null,
          post: post ? {
            id: post._id,
            name: post.name,
          } : null,
        };
      })
    );

    return complaintsWithDetails;
  },
});

export const updateComplaintStatus = mutation({
  args: {
    complaintId: v.id("complaints"),
    status: v.union(v.literal("reviewed"), v.literal("resolved"), v.literal("dismissed")),
    resolution: v.optional(v.string()),
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

    const complaint = await ctx.db.get(args.complaintId);
    if (!complaint) {
      throw new Error("Complaint not found");
    }

    await ctx.db.patch(args.complaintId, {
      status: args.status,
      reviewedBy: currentUser._id,
      reviewedAt: Date.now(),
      resolution: args.resolution,
    });

    return { success: true };
  },
}); 