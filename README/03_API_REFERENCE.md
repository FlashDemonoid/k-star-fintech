# 📡 API Reference — K Star Fintech

**Base URL:** `http://localhost:8080/api`  
**Auth:** All protected routes require `Authorization: Bearer <token>` header

---

## 🔐 Auth Endpoints (Public)

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
**Response 201:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "alice",
  "email": "alice@example.com",
  "role": "USER"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{ "username": "alice", "password": "Secret@123" }
```
**Response 200:** Same as register response

---

## 👤 User Endpoints (Protected)

### Get My Profile
```http
GET /api/users/me
Authorization: Bearer <token>
```

### Get My Wallets
```http
GET /api/users/{id}/wallets
Authorization: Bearer <token>
```

### Add New Currency Wallet
```http
POST /api/users/{id}/wallets?currency=GBP
Authorization: Bearer <token>
```

### Get Total Balance (INR equiv)
```http
GET /api/users/me/balance
Authorization: Bearer <token>
```
**Response:** `152340.50` (double, INR equivalent)

---

## 💱 Exchange Endpoints (Protected)

### Convert Currency
```http
POST /api/exchange/convert
Authorization: Bearer <token>
Content-Type: application/json

{ "from": "USD", "to": "INR", "amount": 100 }
```
**Response:**
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

### Get All Rates
```http
GET /api/exchange/rates
Authorization: Bearer <token>
```

### Get Conversion History
```http
GET /api/exchange/history
Authorization: Bearer <token>
```

---

## 💸 Transfer Endpoints (Protected)

### UPI P2P Transfer
```http
POST /api/transfer/upi
Authorization: Bearer <token>
Content-Type: application/json

{
  "fromUpiId": "9876543210@kstar",
  "toUpiId":   "9876543211@kstar",
  "amount":    500.00,
  "upiPin":    "1234",
  "description": "Lunch split"
}
```
**Response:**
```json
{
  "transactionId": "TXN-550e8400-e29b",
  "status": "COMPLETED",
  "amount": 500.00,
  "fromUpiId": "9876543210@kstar",
  "toUpiId": "9876543211@kstar",
  "createdAt": "2024-11-15T10:30:00"
}
```

### Transaction History
```http
GET /api/transfer/history?upiId=9876543210@kstar
Authorization: Bearer <token>
```

---

## 🏦 NACHA Endpoints (Protected)

### Initiate ACH Payment
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
**Response:**
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

### Get My NACHA Payments
```http
GET /api/nacha/payments
Authorization: Bearer <token>
```

### Get Specific Payment
```http
GET /api/nacha/payments/{paymentId}
Authorization: Bearer <token>
```

---

## 🖼️ NFT Endpoints (Protected)

### Mint NFT
```http
POST /api/nft/mint
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Golden Star #1",
  "description": "First genesis NFT",
  "imageUrl": "https://example.com/nft.png",
  "initialPrice": 0.5
}
```

### Browse Marketplace
```http
GET /api/nft/marketplace
Authorization: Bearer <token>
```

### Buy NFT
```http
POST /api/nft/trade/{tokenId}
Authorization: Bearer <token>
```

### My NFTs
```http
GET /api/nft/my
Authorization: Bearer <token>
```

---

## Error Responses

| HTTP Code | Meaning | Example |
|---|---|---|
| 400 | Bad Request / Validation | `{"message": "Routing number must be 9 digits"}` |
| 401 | Unauthorized / Invalid JWT | `{"message": "Token expired"}` |
| 403 | Forbidden | `{"message": "Access denied"}` |
| 404 | Not Found | `{"message": "User not found"}` |
| 409 | Conflict | `{"message": "Username already taken"}` |
| 500 | Server Error | `{"message": "Internal server error"}` |

---
## 👨‍💻 Creator & Author

**Kartikeya Shriwas**
> 💼 Java Developer | 2.5+ Years | Payment Domain Specialist

> ⚠️ **Copyright Notice:** This project is created and owned by **Kartikeya Shriwas**.
> Unauthorized copying, distribution, or claiming ownership of this project is strictly prohibited.
> © 2026 Kartikeya Shriwas. All Rights Reserved.
