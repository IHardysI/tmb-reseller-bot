import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";

export const createDeal = action({
  args: {
    postId: v.id("posts"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    chatId: v.id("chats"),
    totalAmount: v.string(),
    platformFeeAmount: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const yookassaRequestBody = {
      type: "safe_deal",
      fee_moment: "deal_closed",
      metadata: {
        order_id: `${args.postId}_${Date.now()}`,
        post_name: args.description,
      },
      description: `SAFE_DEAL ${args.postId}`,
    };

    try {
      const response = await fetch("https://api.yookassa.ru/v3/deals", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`)}`,
          "Idempotence-Key": `deal_${args.postId}_${Date.now()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(yookassaRequestBody),
      });

      if (!response.ok) {
        throw new Error(`YooKassa API error: ${response.status}`);
      }

      const dealData = await response.json();
      return {
        success: true,
        dealData: {
          dealId: dealData.id,
          status: dealData.status,
          expiresAt: new Date(dealData.expires_at).getTime(),
          metadata: dealData.metadata,
        },
      };
    } catch (error) {
      console.error("Create deal error:", error);
      throw new Error("Failed to create deal");
    }
  },
});

export const createPayment = action({
  args: {
    dealId: v.string(),
    amount: v.string(),
    sellerAmount: v.string(),
    returnUrl: v.string(),
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    const yookassaRequestBody = {
      amount: {
        value: args.amount,
        currency: "RUB",
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: args.returnUrl,
      },
      description: `Заказ ${args.orderId}`,
      deal: {
        id: args.dealId,
        settlements: [{
          type: "payout",
          amount: {
            value: args.sellerAmount,
            currency: "RUB",
          },
        }],
      },
      metadata: {
        order_id: args.orderId,
        deal_id: args.dealId,
      },
    };

    try {
      const response = await fetch("https://api.yookassa.ru/v3/payments", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`)}`,
          "Idempotence-Key": `payment_${args.dealId}_${Date.now()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(yookassaRequestBody),
      });

      if (!response.ok) {
        throw new Error(`YooKassa API error: ${response.status}`);
      }

      const paymentData = await response.json();
      return {
        success: true,
        paymentData: {
          paymentId: paymentData.id,
          status: paymentData.status,
          paid: paymentData.paid,
          confirmationUrl: paymentData.confirmation?.confirmation_url,
          metadata: paymentData.metadata,
        },
      };
    } catch (error) {
      console.error("Create payment error:", error);
      throw new Error("Failed to create payment");
    }
  },
});

export const createPayout = action({
  args: {
    dealId: v.string(),
    amount: v.string(),
    payoutToken: v.string(),
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    const yookassaRequestBody = {
      amount: {
        value: args.amount,
        currency: "RUB",
      },
      payout_token: args.payoutToken,
      description: `Выплата по заказу ${args.orderId}`,
      metadata: {
        order_id: args.orderId,
        deal_id: args.dealId,
      },
      deal: {
        id: args.dealId,
      },
    };

    try {
      const response = await fetch("https://api.yookassa.ru/v3/payouts", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`)}`,
          "Idempotence-Key": `payout_${args.dealId}_${Date.now()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(yookassaRequestBody),
      });

      if (!response.ok) {
        throw new Error(`YooKassa API error: ${response.status}`);
      }

      const payoutData = await response.json();
      return {
        success: true,
        payoutData: {
          payoutId: payoutData.id,
          status: payoutData.status,
          payoutDestination: payoutData.payout_destination,
        },
      };
    } catch (error) {
      console.error("Create payout error:", error);
      throw new Error("Failed to create payout");
    }
  },
});

export const saveDeal = mutation({
  args: {
    postId: v.id("posts"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    chatId: v.id("chats"),
    dealId: v.string(),
    amount: v.object({ value: v.string(), currency: v.string() }),
    platformFee: v.object({ value: v.string(), currency: v.string() }),
    sellerAmount: v.object({ value: v.string(), currency: v.string() }),
    status: v.union(v.literal("opened"), v.literal("closed"), v.literal("canceled")),
    description: v.string(),
    metadata: v.object({ orderId: v.string(), postName: v.string() }),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("yooKassaDeals", {
      postId: args.postId,
      buyerId: args.buyerId,
      sellerId: args.sellerId,
      chatId: args.chatId,
      dealId: args.dealId,
      amount: args.amount,
      platformFee: args.platformFee,
      sellerAmount: args.sellerAmount,
      status: args.status,
      description: args.description,
      metadata: args.metadata,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const savePayment = mutation({
  args: {
    dealId: v.id("yooKassaDeals"),
    paymentId: v.string(),
    buyerId: v.id("users"),
    amount: v.object({ value: v.string(), currency: v.string() }),
    status: v.union(v.literal("pending"), v.literal("waiting_for_auth"), v.literal("succeeded"), v.literal("canceled")),
    paid: v.boolean(),
    confirmationUrl: v.optional(v.string()),
    description: v.string(),
    metadata: v.object({ orderId: v.string(), dealId: v.string() }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("yooKassaPayments", {
      dealId: args.dealId,
      paymentId: args.paymentId,
      buyerId: args.buyerId,
      amount: args.amount,
      status: args.status,
      paid: args.paid,
      confirmationUrl: args.confirmationUrl,
      description: args.description,
      metadata: args.metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const savePayout = mutation({
  args: {
    dealId: v.id("yooKassaDeals"),
    payoutId: v.string(),
    sellerId: v.id("users"),
    amount: v.object({ value: v.string(), currency: v.string() }),
    status: v.union(v.literal("pending"), v.literal("succeeded"), v.literal("canceled")),
    payoutToken: v.string(),
    description: v.string(),
    metadata: v.object({ orderId: v.string(), dealId: v.string() }),
    payoutDestination: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("yooKassaPayouts", {
      dealId: args.dealId,
      payoutId: args.payoutId,
      sellerId: args.sellerId,
      amount: args.amount,
      status: args.status,
      payoutToken: args.payoutToken,
      description: args.description,
      metadata: args.metadata,
      payoutDestination: args.payoutDestination,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const saveSellerPayoutCard = mutation({
  args: {
    sellerId: v.id("users"),
    payoutToken: v.string(),
    cardInfo: v.object({
      first6: v.string(),
      last4: v.string(),
      cardType: v.string(),
      issuerCountry: v.string(),
      issuerName: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const existingCards = await ctx.db
      .query("sellerPayoutCards")
      .withIndex("by_seller", (q) => q.eq("sellerId", args.sellerId))
      .collect();

    await Promise.all(
      existingCards.map(card =>
        ctx.db.patch(card._id, { isActive: false, updatedAt: Date.now() })
      )
    );

    return await ctx.db.insert("sellerPayoutCards", {
      sellerId: args.sellerId,
      payoutToken: args.payoutToken,
      cardInfo: args.cardInfo,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getDealByYooKassaId = query({
  args: { dealId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("yooKassaDeals")
      .withIndex("by_deal_id", (q) => q.eq("dealId", args.dealId))
      .first();
  },
});

export const getDealsForUser = query({
  args: { userId: v.id("users"), role: v.union(v.literal("buyer"), v.literal("seller")) },
  handler: async (ctx, args) => {
    const field = args.role === "buyer" ? "buyerId" : "sellerId";
    const index = args.role === "buyer" ? "by_buyer" : "by_seller";
    
    return await ctx.db
      .query("yooKassaDeals")
      .withIndex(index, (q) => q.eq(field, args.userId))
      .order("desc")
      .collect();
  },
});

export const updateDealStatus = mutation({
  args: {
    dealId: v.string(),
    status: v.union(v.literal("opened"), v.literal("closed"), v.literal("canceled")),
    balance: v.optional(v.object({ value: v.string(), currency: v.string() })),
    payoutBalance: v.optional(v.object({ value: v.string(), currency: v.string() })),
    closedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db
      .query("yooKassaDeals")
      .withIndex("by_deal_id", (q) => q.eq("dealId", args.dealId))
      .first();

    if (deal) {
      await ctx.db.patch(deal._id, {
        status: args.status,
        balance: args.balance,
        payoutBalance: args.payoutBalance,
        closedAt: args.closedAt,
        updatedAt: Date.now(),
      });

      if (args.status === "closed") {
        await ctx.db.patch(deal.postId, {
          soldAt: Date.now(),
          isActive: false,
        });
      }
    }
  },
});

export const updatePaymentStatus = mutation({
  args: {
    paymentId: v.string(),
    status: v.union(v.literal("pending"), v.literal("waiting_for_auth"), v.literal("succeeded"), v.literal("canceled")),
    paid: v.boolean(),
    capturedAt: v.optional(v.number()),
    paymentMethod: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("yooKassaPayments")
      .withIndex("by_payment_id", (q) => q.eq("paymentId", args.paymentId))
      .first();

    if (payment) {
      await ctx.db.patch(payment._id, {
        status: args.status,
        paid: args.paid,
        capturedAt: args.capturedAt,
        paymentMethod: args.paymentMethod,
        updatedAt: Date.now(),
      });
    }
  },
});

export const updatePayoutStatus = mutation({
  args: {
    payoutId: v.string(),
    status: v.union(v.literal("pending"), v.literal("succeeded"), v.literal("canceled")),
    succeededAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const payout = await ctx.db
      .query("yooKassaPayouts")
      .withIndex("by_payout_id", (q) => q.eq("payoutId", args.payoutId))
      .first();

    if (payout) {
      await ctx.db.patch(payout._id, {
        status: args.status,
        succeededAt: args.succeededAt,
        updatedAt: Date.now(),
      });
    }
  },
}); 