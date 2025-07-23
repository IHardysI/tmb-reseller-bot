# YooKassa Escrow Integration

This document explains how the YooKassa secure deal (escrow) integration works in our marketplace.

## Overview

YooKassa escrow provides secure transactions where:
- Buyer pays the full amount (product price + platform fee)
- Money is held in escrow until transaction completion
- Seller receives payout only after successful delivery confirmation
- Platform receives fee automatically when deal closes

## Database Schema

### New Tables Added:

1. **yooKassaDeals** - Main deal records
   - Links to post, buyer, seller, chat
   - Stores YooKassa deal ID and amounts
   - Tracks deal status and metadata

2. **yooKassaPayments** - Payment records
   - Links to deal and buyer
   - Stores payment status and confirmation URL
   - Tracks payment method details

3. **yooKassaPayouts** - Payout records  
   - Links to deal and seller
   - Stores payout status and destination
   - Tracks payout completion

4. **sellerPayoutCards** - Seller card tokens
   - Secure storage of payout card tokens
   - Only active card per seller

## Integration Flow

### 1. Deal Creation
```
POST /api/yookassa/create-deal
- Creates YooKassa safe_deal
- Stores deal in database
- Links to marketplace entities (post, users, chat)
```

### 2. Payment Processing
```
POST /api/yookassa/create-payment
- Creates payment in deal context
- Returns confirmation URL for buyer
- Tracks payment status
```

### 3. Seller Card Setup
```
- Use YooKassa widget to collect card data
- Store secure payout token
- Link to seller account
```

### 4. Payout Processing
```
POST /api/yookassa/create-payout
- Processes payout to seller card
- Marks deal as complete
- Closes marketplace transaction
```

### 5. Webhook Handling
```
POST /api/webhooks/yookassa
- Handles payment.succeeded events
- Handles payout.succeeded events  
- Handles deal.closed events
- Updates local database status
```

## API Functions

### Actions (External API calls):
- `createDeal` - Creates new escrow deal
- `createPayment` - Initiates buyer payment
- `createPayout` - Processes seller payout
- `handleWebhook` - Processes YooKassa webhooks

### Mutations (Database updates):
- `saveDeal`, `savePayment`, `savePayout` - Store records
- `updatePaymentStatus`, `updatePayoutStatus` - Status updates
- `updateDealBalance`, `closeDeal` - Deal lifecycle

### Queries (Data retrieval):
- `getDealByYooKassaId` - Find deal by external ID
- `getDealsForUser` - User's deals history

## Environment Variables Required

```env
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
```

## Customer Protection Features

1. **Escrow Security** - Money held until delivery confirmed
2. **Dispute Resolution** - Platform can mediate issues
3. **Automatic Refunds** - Failed deals auto-refund buyers
4. **Transaction History** - Full audit trail maintained
5. **Status Tracking** - Real-time status updates

## Implementation Notes

- All amounts stored as strings to avoid precision issues
- Idempotency keys prevent duplicate operations
- Webhooks ensure status synchronization
- Card tokens securely stored via YooKassa
- Platform fee automatically deducted by YooKassa

## Testing

Use YooKassa test environment:
- Test card: 5555555555554477
- Expiry: 01/30
- CVC: 123
- 3D Secure: 123 