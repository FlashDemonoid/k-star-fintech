# SQL Database Guide — K Star Fintech

> Kartikeya Shriwas · © 2026 All Rights Reserved

MySQL database: `kstar`

### Connecting

```bash
# Via Docker (while containers are running)
docker exec -it backend-mysql-1 mysql -u root -proot kstar

# Or via your local MySQL client
mysql -h 127.0.0.1 -P 3306 -u root -proot kstar
```

---

## Schema

### `users`

```sql
CREATE TABLE users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,        -- BCrypt hashed, never plain text
    phone       VARCHAR(15)  NOT NULL UNIQUE,
    role        ENUM('USER','ADMIN') DEFAULT 'USER',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `wallets`

Each user gets INR, USD, EUR wallets on signup. More can be added via API. Only the INR wallet has a UPI ID.

```sql
CREATE TABLE wallets (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT         NOT NULL,
    currency    VARCHAR(10)    NOT NULL,     -- INR, USD, EUR, GBP, JPY
    balance     DECIMAL(18,4)  DEFAULT 0.0000,
    upi_id      VARCHAR(50)    UNIQUE,       -- e.g. 9876543210@kstar (INR wallet only)
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_currency (user_id, currency)
);
```

### `transactions`

UPI P2P transfers. Created after Kafka processes the event and both wallets are updated.

```sql
CREATE TABLE transactions (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(36)    NOT NULL UNIQUE,  -- UUID
    type           ENUM('UPI_TRANSFER','WALLET_CREDIT','WALLET_DEBIT') NOT NULL,
    from_upi_id    VARCHAR(50),
    to_upi_id      VARCHAR(50),
    amount         DECIMAL(18,2)  NOT NULL,
    currency       VARCHAR(10)    DEFAULT 'INR',
    status         ENUM('PENDING','PROCESSING','COMPLETED','FAILED') DEFAULT 'PENDING',
    description    VARCHAR(255),
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at   DATETIME
);
```

### `nacha_payments`

ACH/NACHA entries. Stores originator and receiver banking details, SEC code, status lifecycle.

```sql
CREATE TABLE nacha_payments (
    id                        BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id                VARCHAR(50)    NOT NULL UNIQUE,
    type                      ENUM('CREDIT','DEBIT') NOT NULL,
    sec_code                  VARCHAR(10)    NOT NULL,   -- PPD, CCD, WEB
    originator_name           VARCHAR(100)   NOT NULL,
    originator_routing_number VARCHAR(9)     NOT NULL,
    originator_account_number VARCHAR(17)    NOT NULL,
    receiver_name             VARCHAR(100)   NOT NULL,
    receiver_routing_number   VARCHAR(9)     NOT NULL,
    receiver_account_number   VARCHAR(17)    NOT NULL,
    account_type              VARCHAR(10)    NOT NULL,   -- CHECKING, SAVINGS
    amount                    DECIMAL(18,2)  NOT NULL,
    currency                  VARCHAR(10)    DEFAULT 'USD',
    description               VARCHAR(255),
    status                    ENUM('PENDING','SUBMITTED','PROCESSING',
                                   'SETTLED','RETURNED','FAILED') DEFAULT 'PENDING',
    trace_number              VARCHAR(15),
    batch_number              VARCHAR(20),
    failure_reason            VARCHAR(255),
    initiated_by              VARCHAR(50),
    created_at                DATETIME DEFAULT CURRENT_TIMESTAMP,
    settled_at                DATETIME,
    effective_date            DATETIME       -- T+1 for ACH
);
```

---

## Sample Data

```sql
-- Test users (password for all: Test@1234)
INSERT INTO users (username, email, password, phone, role) VALUES
('alice',  'alice@kstar.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '9876543210', 'USER'),
('bob',    'bob@kstar.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '9876543211', 'USER'),
('admin',  'admin@kstar.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '9876543212', 'ADMIN');

-- Wallets for alice
INSERT INTO wallets (user_id, currency, balance, upi_id) VALUES
(1, 'INR', 10000.0000, '9876543210@kstar'),
(1, 'USD',     0.0000, NULL),
(1, 'EUR',     0.0000, NULL);

-- Wallets for bob
INSERT INTO wallets (user_id, currency, balance, upi_id) VALUES
(2, 'INR', 10000.0000, '9876543211@kstar'),
(2, 'USD',     0.0000, NULL),
(2, 'EUR',     0.0000, NULL);

-- Sample completed transfer
INSERT INTO transactions (transaction_id, type, from_upi_id, to_upi_id, amount, currency, status, description) VALUES
(UUID(), 'UPI_TRANSFER', '9876543210@kstar', '9876543211@kstar', 500.00, 'INR', 'COMPLETED', 'Lunch split');
```

---

## Useful Queries

### Users

```sql
-- Users with wallet count and INR balance
SELECT u.id, u.username, u.email, u.role,
       COUNT(w.id) AS wallet_count,
       SUM(CASE WHEN w.currency='INR' THEN w.balance ELSE 0 END) AS inr_balance
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
GROUP BY u.id;

-- Look up user by UPI ID
SELECT u.username, u.email, w.currency, w.balance, w.upi_id
FROM users u
JOIN wallets w ON u.id = w.user_id
WHERE w.upi_id = '9876543210@kstar';

-- All wallets with INR equivalent (rough rates)
SELECT u.username, w.currency, w.balance,
    ROUND(w.balance * CASE w.currency
        WHEN 'INR' THEN 1
        WHEN 'USD' THEN 84
        WHEN 'EUR' THEN 90
        WHEN 'GBP' THEN 107
        WHEN 'JPY' THEN 0.56
        ELSE 1 END, 2) AS inr_equiv
FROM users u JOIN wallets w ON u.id = w.user_id
ORDER BY u.username, inr_equiv DESC;
```

### Transactions

```sql
-- Recent activity for a UPI ID
SELECT transaction_id, type, from_upi_id, to_upi_id,
       amount, currency, status, created_at
FROM transactions
WHERE from_upi_id = '9876543210@kstar'
   OR to_upi_id   = '9876543210@kstar'
ORDER BY created_at DESC LIMIT 10;

-- Daily volume
SELECT DATE(created_at) AS date,
       COUNT(*) AS total_txns,
       SUM(amount) AS total_amount,
       COUNT(CASE WHEN status='COMPLETED' THEN 1 END) AS completed,
       COUNT(CASE WHEN status='FAILED' THEN 1 END) AS failed
FROM transactions
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top senders this month
SELECT from_upi_id, COUNT(*) AS txn_count, SUM(amount) AS total_sent
FROM transactions
WHERE status = 'COMPLETED' AND MONTH(created_at) = MONTH(CURDATE())
GROUP BY from_upi_id
ORDER BY total_sent DESC LIMIT 5;
```

### NACHA

```sql
-- Pending payments
SELECT payment_id, type, sec_code, receiver_name, amount, created_at
FROM nacha_payments WHERE status = 'PENDING';

-- Settlement stats by SEC code
SELECT sec_code,
       COUNT(*) AS total,
       SUM(amount) AS total_usd,
       AVG(TIMESTAMPDIFF(HOUR, created_at, settled_at)) AS avg_hours_to_settle
FROM nacha_payments WHERE status = 'SETTLED'
GROUP BY sec_code;

-- Return code breakdown
SELECT failure_reason, COUNT(*) AS count
FROM nacha_payments WHERE status = 'RETURNED'
GROUP BY failure_reason ORDER BY count DESC;
```

### Admin / Monitoring

```sql
-- Quick system overview
SELECT 'users'         AS entity, COUNT(*) AS total FROM users
UNION ALL
SELECT 'wallets',        COUNT(*) FROM wallets
UNION ALL
SELECT 'transactions',   COUNT(*) FROM transactions
UNION ALL
SELECT 'nacha_payments', COUNT(*) FROM nacha_payments;

-- Failed transactions in the last 24 hours
SELECT * FROM transactions
WHERE status = 'FAILED' AND created_at >= NOW() - INTERVAL 24 HOUR
ORDER BY created_at DESC;

-- New registrations today
SELECT id, username, email, phone, created_at
FROM users WHERE DATE(created_at) = CURDATE();
```

---

## MongoDB

```bash
# Via Docker
docker exec -it backend-mongodb-1 mongosh

use kstar_exchange    # exchange rates + conversion history
use kstar_bullion     # bullion holdings
```

### Exchange

```javascript
// All stored rates
db.exchange_rates.find({}).pretty()

// Specific rate
db.exchange_rates.findOne({ baseCurrency: "USD", targetCurrency: "INR" })

// User's conversion history
db.conversion_history.find({ username: "alice" }).sort({ convertedAt: -1 }).limit(10)
```

### Bullion

```javascript
// All items listed for sale
db.bullion_holdings.find({ status: "FOR_SALE" }).pretty()

// User's holdings
db.bullion_holdings.find({ ownerUsername: "alice" })

// Trade history of a specific token
db.bullion_holdings.findOne({ tokenId: "BULLION-XXXXXXXX" }).tradeHistory
```
