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
    quantityTotal: v.optional(v.number()),
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

    const createdAt = Date.now();

    const postId = await ctx.db.insert("posts", {
      userId: user._id,
      telegramId: args.telegramId,
      name: args.name,
      brand: args.brand,
      price: args.price,
      quantityTotal: args.quantityTotal ?? 1,
      quantityAvailable: args.quantityTotal ?? 1,
      condition: args.condition,
      year: args.year,
      description: args.description,
      category: args.category,
      subcategory: args.subcategory,
      images: imageUrls.filter(url => url !== null) as string[],
      defects: args.defects,
      createdAt: createdAt,
      updatedAt: createdAt,
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
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (!user) {
      return [];
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return posts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getUserPostsByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const postsWithSellers = await Promise.all(
      posts.map(async (post) => {
        return {
          ...post,
          sellerName: user ? user.firstName + (user.lastName ? ` ${user.lastName}` : '') : undefined,
          sellerCity: user?.city,
        };
      })
    );

    return postsWithSellers.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getUserSoldPosts = query({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .filter((q) => q.eq(q.field("isActive"), false))
      .filter((q) => q.neq(q.field("soldAt"), undefined))
      .order("desc")
      .collect();
  },
});

export const getAllActivePosts = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    const sortedPosts = posts.sort((a, b) => b.createdAt - a.createdAt);

    const postsWithSellers = await Promise.all(
      sortedPosts.map(async (post) => {
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


export const decrementQuantityOnPayment = mutation({
  args: { postId: v.id("posts"), quantity: v.number() },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    const currentAvailable = (post as any).quantityAvailable ?? 1;
    const newAvailable = Math.max(0, currentAvailable - Math.max(0, args.quantity));
    const patch: any = { quantityAvailable: newAvailable, updatedAt: Date.now() };
    if (newAvailable === 0) {
      patch.isActive = false;
      patch.soldAt = Date.now();
    }
    await ctx.db.patch(args.postId, patch);
    return { quantityAvailable: newAvailable, isActive: patch.isActive ?? post.isActive };
  }
});

export const getPostsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return posts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getPostsByBrand = query({
  args: { brand: v.string() },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_brand", (q) => q.eq("brand", args.brand))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return posts.sort((a, b) => b.createdAt - a.createdAt);
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

    // Update brand count if post has a brand
    if (post.brand && post.brand.trim()) {
      await decrementBrandCount(ctx, post.brand.trim());
    }

    // Actually delete the post from database
    await ctx.db.delete(args.postId);

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

export const markPostAsSold = mutation({
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
      throw new Error("Not authorized to mark this post as sold");
    }

    // Update brand count since sold items shouldn't count in active listings
    if (post.brand && post.brand.trim()) {
      await decrementBrandCount(ctx, post.brand.trim());
    }

    // Mark as sold but keep in database
    await ctx.db.patch(args.postId, {
      isActive: false,
      soldAt: Date.now(),
      updatedAt: Date.now(),
    });

    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (user) {
      const currentPostsCount = user.postsCount || 0;
      const soldCount = user.soldCount || 0;
      await ctx.db.patch(user._id, {
        postsCount: Math.max(0, currentPostsCount - 1),
        soldCount: soldCount + 1,
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

export const updatePostWithMixedImages = mutation({
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
    newImageStorageIds: v.array(v.id("_storage")),
    existingImageUrls: v.array(v.string()),
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

    const newImageUrls = await Promise.all(
      args.newImageStorageIds.map(async (storageId) => {
        return await ctx.storage.getUrl(storageId);
      })
    );

    const allImageUrls = [
      ...args.existingImageUrls,
      ...newImageUrls.filter(url => url !== null) as string[]
    ];

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
      images: allImageUrls,
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
    // Get all active posts with brands
    const activePosts = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Count posts by brand
    const brandCounts: { [key: string]: number } = {};
    activePosts.forEach(post => {
      if (post.brand && post.brand.trim()) {
        const brand = post.brand.trim();
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      }
    });

    // Sort brands by count (descending) and return just the names
    return Object.entries(brandCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([brand]) => brand);
  },
});

export const getPopularBrands = query({
  args: {},
  handler: async (ctx) => {
    // Get all active posts with brands
    const activePosts = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Count posts by brand
    const brandCounts: { [key: string]: number } = {};
    activePosts.forEach(post => {
      if (post.brand && post.brand.trim()) {
        const brand = post.brand.trim();
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      }
    });

    // Sort brands by count and return top 20 with counts
    return Object.entries(brandCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([name, postsCount]) => ({
        name,
        postsCount,
        _id: `brand-${name}` as any, // Temporary ID for compatibility
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
  },
});

export const getAllBrands = query({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.db
      .query("brands")
      .order("desc")
      .collect();

    return brands
      .sort((a, b) => b.postsCount - a.postsCount)
      .map(brand => brand.name);
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

export const getLikedPosts = query({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", args.telegramId))
      .first();

    if (!user) {
      return [];
    }

    const allPosts = await ctx.db.query("posts").collect();
    
    return allPosts.filter(post => 
      post.likedBy && post.likedBy.includes(user._id)
    );
  },
});

const decrementBrandCount = async (ctx: any, brandName: string) => {
  const existingBrand = await ctx.db
    .query("brands")
    .withIndex("by_name", (q: any) => q.eq("name", brandName))
    .first();

  if (existingBrand && existingBrand.postsCount > 0) {
    await ctx.db.patch(existingBrand._id, {
      postsCount: Math.max(0, existingBrand.postsCount - 1),
      updatedAt: Date.now(),
    });
  }
};

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