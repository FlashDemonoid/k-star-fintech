# API Reference — K Star Fintech

**Base URL:** `http://localhost:8080/api`

All routes except `/api/auth/*` require `Authorization: Bearer <token>` in the header.

---

## Auth (no token needed)

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "alice",
  "email": "alice@example.com",
  "phone": "9876543210",
  "password": "Secret@123"
}
```

**201 Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "alice",
  "email": "alice@example.com",
  "phone": "9876543210",
  "upiId": "9876543210@kstar",
  "role": "USER"
}
```

Successful registration also creates INR, USD, EUR wallets. INR starts at ₹10,000.

### Login
```http
POST /api/auth/login
Content-Type: application/json

{ "username": "alice", "password": "Secret@123" }
```

Same response as register.

---

## Users

### Get my profile
```http
GET /api/users/me
Authorization: Bearer <token>
```

### Get my wallets
```http
GET /api/users/me/wallets
Authorization: Bearer <token>
```

### Add a new currency wallet
```http
POST /api/users/me/wallets?currency=GBP
Authorization: Bearer <token>
```

### Get total balance in INR equivalent
```http
GET /api/users/me/balance
Authorization: Bearer <token>
```

Returns a plain double — INR value after applying rough exchange rates for other currencies.

### Get UPI info
```http
GET /api/users/me/upi
Authorization: Bearer <token>
```

```json
{
  "upiId": "9876543210@kstar",
  "pinHint": "Last 4 digits of phone: 3210",
  "phone": "9876543210",
  "username": "alice"
}
```

### Adjust wallet balance (add/deduct money)
```http
POST /api/users/me/wallets/adjust
Authorization: Bearer <token>
Content-Type: application/json

{ "currency": "INR", "amount": 5000 }
```

Positive = credit, negative = debit. Used by the Add Money flow on the frontend.

---

## Exchange

### Convert currency
```http
POST /api/exchange/convert
Authorization: Bearer <token>
Content-Type: application/json

{ "from": "USD", "to": "INR", "amount": 100 }
```

```json
{
  "fromCurrency": "USD",
  "toCurrency": "INR",
  "fromAmount": 100,
  "toAmount": 8412.0,
  "rateUsed": 84.12,
  "convertedAt": "2024-11-15T10:30:00"
}
```

Note: rates fluctuate slightly on every call (±0.1%) to simulate live market behaviour. History is saved per user.

### Get all cached rates
```http
GET /api/exchange/rates
Authorization: Bearer <token>
```

Returns rates stored in MongoDB — updated every 30 seconds by the scheduler.

### Get my conversion history
```http
GET /api/exchange/history
Authorization: Bearer <token>
```

---

## Transfer

### UPI P2P Transfer
```http
POST /api/transfer/upi
Authorization: Bearer <token>
Content-Type: application/json

{
  "fromUpiId": "9876543210@kstar",
  "toUpiId":   "9876543211@kstar",
  "amount":    500.00,
  "upiPin":    "3210",
  "description": "Lunch split"
}
```

```json
{
  "transactionId": "TXN-550E8400-E29B",
  "status": "COMPLETED",
  "amount": 500.00,
  "fromUpiId": "9876543210@kstar",
  "toUpiId": "9876543211@kstar",
  "createdAt": "2024-11-15T10:30:00"
}
```

The service validates the PIN against user-service, debits the sender, credits the receiver, then publishes a Kafka event. PIN = last 4 digits of phone.

### Transaction history
```http
GET /api/transfer/history?upiId=9876543210@kstar
Authorization: Bearer <token>
```

---

## NACHA

### Initiate ACH payment
```http
POST /api/nacha/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "secCode": "PPD",
  "type": "CREDIT",
  "originatorName": "K Star Corp",
  "originatorRoutingNumber": "021000021",
  "originatorAccountNumber": "1234567890",
  "receiverName": "John Doe",
  "receiverRoutingNumber": "021000089",
  "receiverAccountNumber": "9876543210",
  "accountType": "CHECKING",
  "amount": 1500.00,
  "description": "Payroll"
}
```

```json
{
  "paymentId": "NACHA-20241115-000001",
  "status": "PENDING",
  "traceNumber": "123456780001234",
  "batchNumber": "BATCH-001234",
  "effectiveDate": "2024-11-16T00:00:00",
  "amount": 1500.00,
  "currency": "USD"
}
```

After 2 seconds (async), status moves to SUBMITTED (95% chance) or FAILED (R01 - Insufficient Funds). Settlement date is T+1.

Supported SEC codes: `PPD` (consumer), `CCD` (business), `WEB` (internet), `TEL`, `CTX`.

### My payments
```http
GET /api/nacha/payments
Authorization: Bearer <token>
```

### Specific payment
```http
GET /api/nacha/payments/{paymentId}
Authorization: Bearer <token>
```

### Return a payment
```http
POST /api/nacha/payments/{paymentId}/return?returnCode=R02&reason=Account%20Closed
Authorization: Bearer <token>
```

---

## Bullion (Gold & Silver)

### Mint a new holding
```http
POST /api/bullion/mint
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Golden Star #1",
  "description": "First gold purchase",
  "metal": "GOLD",
  "initialPrice": 6250.00
}
```

Metal must be `GOLD` or `SILVER`.

### Browse marketplace
```http
GET /api/bullion/marketplace
Authorization: Bearer <token>
```

Returns items with status `FOR_SALE`.

### Buy from marketplace
```http
POST /api/bullion/trade/{tokenId}
Authorization: Bearer <token>
```

### My holdings
```http
GET /api/bullion/my
Authorization: Bearer <token>
```

---

## Error Responses

All errors follow this structure:

```json
{
  "status": 400,
  "message": "Routing number must be exactly 9 digits",
  "timestamp": "2024-11-15T10:30:00"
}
```

| Code | Meaning |
|------|---------|
| 400 | Validation failed |
| 401 | Missing or expired token |
| 403 | Access denied |
| 404 | Resource not found |
| 409 | Conflict (duplicate username, existing wallet, etc.) |
| 500 | Something broke on the server side |

---

**Kartikeya Shriwas** — Java Developer | Payment Domain
kartikeyashriwas19@gmail.com

© 2026 Kartikeya Shriwas. All Rights Reserved.
