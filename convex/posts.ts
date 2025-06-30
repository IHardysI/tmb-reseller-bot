import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const createPost = mutation({
  args: {
    telegramId: v.number(),
    name: v.string(),
    brand: v.optional(v.string()),
    price: v.number(),
    condition: v.string(),
    year: v.number(),
    description: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    images: v.array(v.id("_storage")),
    defects: v.array(v.object({
      description: v.string(),
      location: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const imageUrls = await Promise.all(
      args.images.map(async (storageId) => {
        return await ctx.storage.getUrl(storageId);
      })
    );

    if (args.brand && args.brand.trim()) {
      await createOrUpdateBrand(ctx, args.brand.trim());
    }

    const postId = await ctx.db.insert("posts", {
      userId: user._id,
      telegramId: args.telegramId,
      name: args.name,
      brand: args.brand,
      price: args.price,
      condition: args.condition,
      year: args.year,
      description: args.description,
      category: args.category,
      subcategory: args.subcategory,
      images: imageUrls.filter(url => url !== null) as string[],
      defects: args.defects,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    });

    const currentPostsCount = user.postsCount || 0;
    await ctx.db.patch(user._id, {
      postsCount: currentPostsCount + 1,
    });

    return postId;
  },
});

export const getUserPosts = query({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});

export const getAllActivePosts = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();

    const postsWithSellers = await Promise.all(
      posts.map(async (post) => {
        const user = await ctx.db.get(post.userId);
        return {
          ...post,
          sellerName: user ? user.firstName + (user.lastName ? ` ${user.lastName}` : '') : undefined,
          sellerCity: user?.city,
        };
      })
    );

    return postsWithSellers;
  },
});

export const getPostsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});

export const getPostsByBrand = query({
  args: { brand: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_brand", (q) => q.eq("brand", args.brand))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});

export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
    telegramId: v.number(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.telegramId !== args.telegramId) {
      throw new Error("Not authorized to delete this post");
    }

    await ctx.db.patch(args.postId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (user) {
      const currentPostsCount = user.postsCount || 0;
      await ctx.db.patch(user._id, {
        postsCount: Math.max(0, currentPostsCount - 1),
      });
    }
  },
});

export const updatePost = mutation({
  args: {
    postId: v.id("posts"),
    telegramId: v.number(),
    name: v.string(),
    brand: v.optional(v.string()),
    price: v.number(),
    condition: v.string(),
    year: v.number(),
    description: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    images: v.array(v.id("_storage")),
    defects: v.array(v.object({
      description: v.string(),
      location: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.telegramId !== args.telegramId) {
      throw new Error("Not authorized to update this post");
    }

    const imageUrls = await Promise.all(
      args.images.map(async (storageId) => {
        return await ctx.storage.getUrl(storageId);
      })
    );

    if (args.brand && args.brand.trim()) {
      await createOrUpdateBrand(ctx, args.brand.trim());
    }

    await ctx.db.patch(args.postId, {
      name: args.name,
      brand: args.brand,
      price: args.price,
      condition: args.condition,
      year: args.year,
      description: args.description,
      category: args.category,
      subcategory: args.subcategory,
      images: imageUrls.filter(url => url !== null) as string[],
      defects: args.defects,
      updatedAt: Date.now(),
    });

    return args.postId;
  },
});

export const likePost = mutation({
  args: {
    postId: v.id("posts"),
    telegramId: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const likedBy = post.likedBy || [];
    const likesCount = post.likesCount || 0;

    if (likedBy.includes(user._id)) {
      return;
    }

    await ctx.db.patch(args.postId, {
      likedBy: [...likedBy, user._id],
      likesCount: likesCount + 1,
      updatedAt: Date.now(),
    });
  },
});

export const unlikePost = mutation({
  args: {
    postId: v.id("posts"),
    telegramId: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const likedBy = post.likedBy || [];
    const likesCount = post.likesCount || 0;

    if (!likedBy.includes(user._id)) {
      return;
    }

    await ctx.db.patch(args.postId, {
      likedBy: likedBy.filter(id => id !== user._id),
      likesCount: Math.max(0, likesCount - 1),
      updatedAt: Date.now(),
    });
  },
});

export const incrementViews = mutation({
  args: { 
    postId: v.id("posts"),
    telegramId: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (!user) {
      return;
    }

    const post = await ctx.db.get(args.postId);
    if (!post || !post.isActive) {
      return;
    }

    const viewedBy = post.viewedBy || [];
    const currentViews = post.views || 0;

    // Check if user already viewed this post
    if (viewedBy.includes(user._id)) {
      return; // Don't increment if already viewed
    }

    await ctx.db.patch(args.postId, {
      views: currentViews + 1,
      viewedBy: [...viewedBy, user._id],
      updatedAt: Date.now(),
    });
  },
});

export const getPostById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post || !post.isActive) {
      return null;
    }

    const user = await ctx.db.get(post.userId);
    if (!user) {
      return null;
    }

    return {
      ...post,
      sellerName: user.firstName + (user.lastName ? ` ${user.lastName}` : ''),
      sellerUsername: user.username,
      sellerCity: user.city,
    };
  },
});

export const getBrands = query({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.db
      .query("brands")
      .withIndex("by_posts_count")
      .order("desc")
      .collect();

    return brands.map(brand => brand.name);
  },
});

export const getPopularBrands = query({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.db
      .query("brands")
      .withIndex("by_posts_count")
      .order("desc")
      .take(20);

    return brands;
  },
});

export const getPriceRange = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (posts.length === 0) {
      return { min: 0, max: 500000 };
    }

    const prices = posts.map(post => post.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  },
});

export const getYearRange = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (posts.length === 0) {
      return { min: 2015, max: 2024 };
    }

    const years = posts.map(post => post.year);
    return {
      min: Math.min(...years),
      max: Math.max(...years)
    };
  },
});

const createOrUpdateBrand = async (ctx: any, brandName: string) => {
  const existingBrand = await ctx.db
    .query("brands")
    .withIndex("by_name", (q: any) => q.eq("name", brandName))
    .first();

  if (existingBrand) {
    await ctx.db.patch(existingBrand._id, {
      postsCount: existingBrand.postsCount + 1,
      updatedAt: Date.now(),
    });
    return existingBrand._id;
  } else {
    return await ctx.db.insert("brands", {
      name: brandName,
      postsCount: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}; 