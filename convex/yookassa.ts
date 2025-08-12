import { YooCheckout, ICreatePayment } from '@a2seven/yoo-checkout'; 
import { generateIdempotencyKey } from './utils/idempotentecyGenerator';
import { action, mutation } from './_generated/server';
import { v } from 'convex/values';

const checkout = new YooCheckout({ 
  shopId: process.env.YOOKASSA_SHOP_ID!, 
  secretKey: process.env.YOOKASSA_SECRET_KEY! 
});

////////////////////////////////////////////////

export const createOrder = action({
  args: {
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    postId: v.id("posts"),
    chatId: v.id("chats"),
    totalAmount: v.string(),
    platformFeeAmount: v.string(),
    description: v.string(),
    postName: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    type: string;
    fee_moment: string;
    id: string;
    balance: { value: string; currency: string };
    payout_balance: { value: string; currency: string };
    status: string;
    created_at: string;
    expires_at: string;
    metadata: { order_id: string; post_name: string; buyer_id: string; seller_id: string };
    description: string;
    test: boolean;
  }> => {
    const orderId = `order_${args.postId}_${Date.now()}`;
    const idempotenceKey = generateIdempotencyKey();
    
    const sellerAmount = (parseFloat(args.totalAmount) - parseFloat(args.platformFeeAmount)).toFixed(2);
    
    const dealPayload = {
      type: "safe_deal" as const,
      fee_moment: "deal_closed" as const,
      metadata: {
        order_id: orderId,
        post_id: args.postId,
        buyer_id: args.buyerId,
        seller_id: args.sellerId,
      },
      description: `SAFE_DEAL ${args.postId}_${orderId}`
    };

    try {
      const response = await fetch("https://api.yookassa.ru/v3/deals", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`)}`,
          "Idempotence-Key": idempotenceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dealPayload),
      });

      if (!response.ok) {
        throw new Error(`YooKassa API error: ${response.status}`);
      }

      const deal = await response.json();
      
      return {
        ...deal,
        success: true,
      };
    } catch (error) {
      console.error('Order creation error:', error);
      throw new Error('Failed to create order and deal');
    }
  }
});

export const saveOrder = mutation({
  args: {
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    postId: v.id("posts"),
    chatId: v.id("chats"),
    dealId: v.string(),
    totalAmount: v.object({ value: v.string(), currency: v.string() }),
    platformFee: v.object({ value: v.string(), currency: v.string() }),
    sellerAmount: v.object({ value: v.string(), currency: v.string() }),
    description: v.string(),
    metadata: v.object({
      orderId: v.string(),
      postName: v.string(),
    }),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("orders", {
      buyerId: args.buyerId,
      sellerId: args.sellerId,
      postId: args.postId,
      chatId: args.chatId,
      dealId: args.dealId,
      status: "deal_created",
      totalAmount: args.totalAmount,
      platformFee: args.platformFee,
      sellerAmount: args.sellerAmount,
      description: args.description,
      metadata: args.metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: args.expiresAt,
    });
  },
});


export default checkout;