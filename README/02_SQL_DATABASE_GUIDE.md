# 🗄️ SQL Database Guide — K Star Fintech

> Created by **Kartikeya Shriwas** · © 2026 All Rights Reserved

: `kstar` (MySQL 8.0)

### Connect to MySQL
```bash
# Via Docker
docker exec -it backend-mysql-1 mysql -u root -proot kstar

# Via MySQL client
mysql -h 127.0.0.1 -P 3306 -u root -proot kstar
```

---

## Table Definitions

### `users` — User accounts
```sql
CREATE TABLE users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,        -- BCrypt hashed
    phone       VARCHAR(15)  NOT NULL UNIQUE,
    role        ENUM('USER','ADMIN') DEFAULT 'USER',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `wallets` — Multi-currency wallets
```sql
CREATE TABLE wallets (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT         NOT NULL,
    currency    VARCHAR(10)    NOT NULL,     -- INR, USD, EUR, GBP, JPY
    balance     DECIMAL(18,4)  DEFAULT 0.0000,
    upi_id      VARCHAR(50)    UNIQUE,       -- e.g. 9876543210@kstar
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_currency (user_id, currency)
);
```

### `transactions` — UPI transfer history
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

### `nacha_payments` — ACH payment records
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
    effective_date            DATETIME
);
```

---

## Sample Data — Insert Statements

```sql
-- Insert test user (password: Test@1234)
INSERT INTO users (username, email, password, phone, role) VALUES
('alice',   'alice@kstar.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '9876543210', 'USER'),
('bob',     'bob@kstar.com',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '9876543211', 'USER'),
('admin',   'admin@kstar.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '9876543212', 'ADMIN');

-- Insert wallets for alice (user_id=1)
INSERT INTO wallets (user_id, currency, balance, upi_id) VALUES
(1, 'INR', 10000.0000, '9876543210@kstar'),
(1, 'USD',     0.0000, NULL),
(1, 'EUR',     0.0000, NULL);

-- Insert wallets for bob (user_id=2)
INSERT INTO wallets (user_id, currency, balance, upi_id) VALUES
(2, 'INR', 10000.0000, '9876543211@kstar'),
(2, 'USD',     0.0000, NULL),
(2, 'EUR',     0.0000, NULL);

-- Insert sample transaction
INSERT INTO transactions (transaction_id, type, from_upi_id, to_upi_id, amount, currency, status, description) VALUES
(UUID(), 'UPI_TRANSFER', '9876543210@kstar', '9876543211@kstar', 500.00, 'INR', 'COMPLETED', 'Lunch split');
```

---

## Useful SQL Queries

### User Queries
```sql
-- List all users with wallet count
SELECT u.id, u.username, u.email, u.role,
       COUNT(w.id) AS wallet_count,
       SUM(CASE WHEN w.currency='INR' THEN w.balance ELSE 0 END) AS inr_balance
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
GROUP BY u.id;

-- Find user by UPI ID
SELECT u.username, u.email, w.currency, w.balance, w.upi_id
FROM users u
JOIN wallets w ON u.id = w.user_id
WHERE w.upi_id = '9876543210@kstar';

-- All wallets with INR equivalent (approx rates)
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

### Transaction Queries
```sql
-- Recent transactions for a user
SELECT transaction_id, type, from_upi_id, to_upi_id,
       amount, currency, status, created_at
FROM transactions
WHERE from_upi_id = '9876543210@kstar'
   OR to_upi_id   = '9876543210@kstar'
ORDER BY created_at DESC LIMIT 10;

-- Daily volume summary
SELECT DATE(created_at) AS date,
       COUNT(*)         AS total_txns,
       SUM(amount)      AS total_amount,
       COUNT(CASE WHEN status='COMPLETED' THEN 1 END) AS completed,
       COUNT(CASE WHEN status='FAILED'    THEN 1 END) AS failed
FROM transactions
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top senders this month
SELECT from_upi_id, COUNT(*) AS txn_count, SUM(amount) AS total_sent
FROM transactions
WHERE status = 'COMPLETED'
  AND MONTH(created_at) = MONTH(CURDATE())
GROUP BY from_upi_id
ORDER BY total_sent DESC LIMIT 5;
```

### NACHA Queries
```sql
-- Pending payments
SELECT payment_id, type, sec_code, receiver_name, amount, created_at
FROM nacha_payments WHERE status = 'PENDING';

-- Settlement summary by SEC code
SELECT sec_code,
       COUNT(*) AS total,
       SUM(amount) AS total_usd,
       AVG(TIMESTAMPDIFF(HOUR, created_at, settled_at)) AS avg_hours_to_settle
FROM nacha_payments WHERE status = 'SETTLED'
GROUP BY sec_code;

-- Return code analysis
SELECT failure_reason, COUNT(*) AS occurrences
FROM nacha_payments WHERE status = 'RETURNED'
GROUP BY failure_reason ORDER BY occurrences DESC;

-- Daily ACH batch report
SELECT DATE(created_at) AS batch_date,
       type, COUNT(*) AS count, SUM(amount) AS total
FROM nacha_payments
GROUP BY batch_date, type
ORDER BY batch_date DESC;
```

### Admin / Monitoring Queries
```sql
-- System health snapshot
SELECT 'users'        AS entity, COUNT(*) AS total FROM users
UNION ALL
SELECT 'wallets',       COUNT(*) FROM wallets
UNION ALL
SELECT 'transactions',  COUNT(*) FROM transactions
UNION ALL
SELECT 'nacha_payments',COUNT(*) FROM nacha_payments;

-- Recent failed transactions (last 24h)
SELECT * FROM transactions
WHERE status = 'FAILED'
  AND created_at >= NOW() - INTERVAL 24 HOUR
ORDER BY created_at DESC;

-- Users registered today
SELECT id, username, email, phone, created_at
FROM users WHERE DATE(created_at) = CURDATE();
```

---

## MongoDB Queries

### Connect to MongoDB
```bash
# Via Docker
docker exec -it backend-mongodb-1 mongosh

# Select databases
use kstar_exchange   # Exchange rates + conversion history
use kstar_nft        # NFT documents
```

### Exchange Rate Queries
```javascript
// All rates
db.exchange_rates.find({}).pretty()

// USD to INR rate
db.exchange_rates.findOne({ baseCurrency: "USD", targetCurrency: "INR" })

// Conversion history for user
db.conversion_history.find({ username: "alice" }).sort({ convertedAt: -1 }).limit(10)
```

### NFT Queries
```javascript
// All NFTs for sale
db.nfts.find({ status: "FOR_SALE" }).pretty()

// NFTs owned by user
db.nfts.find({ ownerUsername: "alice" })

// Most expensive NFTs
db.nfts.find({}).sort({ price: -1 }).limit(5)

// NFT trade history
db.nfts.findOne({ tokenId: "NFT-20241101-000001" }).tradeHistory
```
