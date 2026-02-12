# Payment Methods Implementation Guide

## Overview
BillNet now supports multiple payment methods for adding funds to user wallets, including:
- 💳 **Credit/Debit Cards** (Visa, Mastercard)
- 🏦 **Bank Transfers** (ACH/Wire)
- ₿ **Bitcoin** (BTC)

## Features Implemented

### 1. Bitcoin Address Generation
Every user account automatically gets a unique Bitcoin address for receiving deposits:
- Addresses are generated on-demand when user views payment methods
- Format: Bech32 (SegWit) - starts with `bc1q`
- Stored in `users.bitcoin_address` field
- Persistent across sessions

### 2. Payment Methods API

#### Get Payment Methods
```
GET /api/wallet/payment-methods
Authorization: Bearer <token>
```

Returns available payment methods with:
- Payment details (fees, processing time, limits)
- Bitcoin address (auto-generated if needed)
- Bank account information
- Card payment instructions

#### Initiate Payment
```
POST /api/wallet/initiate-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1000.00,
  "paymentMethod": "bitcoin|bank_transfer|card",
  "currency": "USD"
}
```

Returns:
- Transaction record with unique reference ID
- Payment instructions specific to selected method
- Status tracking information

### 3. Database Schema

#### New Tables

**payment_transactions**
- Tracks all deposit/withdrawal transactions
- Supports multiple payment methods
- Includes Bitcoin-specific fields (txid, confirmations)
- Status tracking (pending, processing, completed, failed)

**saved_payment_methods** (optional)
- Stores tokenized payment methods for faster checkout
- Credit cards (via Stripe/payment processor tokens)
- Bank accounts

#### User Table Updates
- `bitcoin_address` - User's unique BTC address
- `bitcoin_address_generated_at` - Timestamp of generation

### 4. Frontend UI (Profile Page)

#### Payment Method Selection
Users can select from three payment options:
1. **Credit/Debit Card**
   - Icon: 💳
   - Processing: Instant
   - Fees: 2.9% + $0.30
   - Min: $10, Max: $50,000

2. **Bank Transfer**
   - Icon: 🏦
   - Processing: 1-3 business days
   - Fees: Free (wire fees may apply)
   - Min: $100, Max: $1,000,000
   - Shows bank account details

3. **Bitcoin**
   - Icon: ₿
   - Processing: 10-60 minutes
   - Fees: Network fees only
   - Min: $50, No max
   - Displays user's unique BTC address

#### Payment Instructions
After initiating a payment, users see detailed instructions:

**Bitcoin:**
- Bitcoin address (with copy button)
- Network: Bitcoin Mainnet
- Minimum confirmations required
- Warning about sending only BTC

**Bank Transfer:**
- Bank name, account name, account number
- Routing number, SWIFT code
- Reference ID to include in transfer
- Important notes

**Card:**
- Placeholder for Stripe/payment processor integration
- Would redirect to secure payment page

## Usage Flow

1. User navigates to Profile page
2. Clicks "Add Funds" button
3. Enters amount to add
4. Selects payment method:
   - Each method shows processing time, fees, and limits
   - Bitcoin method shows user's unique address
5. Clicks "Continue"
6. System creates transaction record with reference ID
7. Payment instructions displayed based on method:
   - **Bitcoin**: Address to send to + warnings
   - **Bank**: Account details + reference ID
   - **Card**: Payment processor integration (future)
8. User completes payment externally
9. Admin confirms payment (or automated for card/Bitcoin with webhooks)
10. Funds credited to wallet

## Security Considerations

### Bitcoin
- Uses mock address generation (production needs real Bitcoin library)
- Recommend: `bitcoinjs-lib` or Bitcoin API service
- Each user gets unique address for tracking
- Minimum 3 confirmations before crediting

### Bank Transfers
- Reference ID required for matching deposits
- Manual verification by admin
- ACH takes 1-3 days, Wire is faster

### Cards
- Requires Stripe/payment processor integration
- PCI compliance handled by processor
- Cards tokenized, never stored directly

## Implementation Notes

### Mock Bitcoin Address Generation
Current implementation uses SHA-256 hash for demo purposes:
```javascript
function generateBitcoinAddress(userId) {
  const prefix = 'bc1q';
  const hash = crypto.createHash('sha256')
    .update(`bilnet-user-${userId}-${Date.now()}`)
    .digest('hex');
  return prefix + hash.substring(0, 38);
}
```

**Production Recommendation:**
```javascript
// Use bitcoinjs-lib or similar
const bitcoin = require('bitcoinjs-lib');
const ECPair = require('ecpair');

function generateBitcoinAddress(userId) {
  // Generate new key pair
  const keyPair = ECPair.makeRandom();
  const { address } = bitcoin.payments.p2wpkh({ 
    pubkey: keyPair.publicKey 
  });
  
  // Store private key securely (encrypted)
  // Return address
  return address;
}
```

### Payment Processor Integration

For card payments, integrate with Stripe:

```javascript
// Install: npm install stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/wallet/stripe-payment', async (req, res) => {
  const { amount, currency } = req.body;
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: currency.toLowerCase(),
    metadata: { userId: req.user.id }
  });
  
  res.json({ clientSecret: paymentIntent.client_secret });
});
```

### Bitcoin Transaction Monitoring

For automated Bitcoin confirmations:

```javascript
// Use blockchain API (BlockCypher, Blockchain.info, etc.)
const checkBitcoinTransaction = async (address) => {
  const response = await fetch(
    `https://blockchain.info/rawaddr/${address}`
  );
  const data = await response.json();
  
  // Check for new transactions
  const txs = data.txs.filter(tx => tx.confirmations >= 3);
  return txs;
};
```

## Testing

### Database Migration
Run the migration to add new tables and columns:
```bash
psql -U postgres -d billnet -f backend/migrations_payment_methods.sql
```

### Test Payment Methods API
```bash
# Get payment methods
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/wallet/payment-methods

# Initiate Bitcoin payment
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "paymentMethod": "bitcoin", "currency": "USD"}' \
  http://localhost:5000/api/wallet/initiate-payment
```

### Frontend Testing
1. Sign in as investor
2. Go to Profile page
3. Click "Add Funds"
4. Test each payment method:
   - Enter amount
   - Select payment method
   - Verify instructions display correctly
   - Check Bitcoin address is displayed and copyable
   - Verify bank details are shown
   - Confirm reference IDs are unique

## Future Enhancements

1. **Automated Bitcoin Confirmation**
   - Webhook from blockchain API
   - Auto-credit after confirmations
   - Email notification

2. **Stripe Integration**
   - Payment Elements UI
   - 3D Secure authentication
   - Saved cards

3. **Additional Payment Methods**
   - PayPal
   - Apple Pay / Google Pay
   - Cryptocurrency (ETH, USDT, etc.)
   - International wire transfers

4. **Transaction History**
   - View all deposits/withdrawals
   - Export statements
   - Receipt generation

5. **KYC/AML Compliance**
   - Transaction monitoring
   - Large transaction alerts
   - Source of funds verification

## Support & Documentation

For questions or issues:
- Email: support@bilnet.com
- Phone: +1 (000) 000-0000

## File Changes Summary

### Backend
- `backend/index.js` - Added payment endpoints
- `backend/migrations_payment_methods.sql` - Database schema

### Frontend
- `frontend/src/pages/Profile.tsx` - Payment UI implementation

### Documentation
- `PAYMENT_METHODS_GUIDE.md` - This file
