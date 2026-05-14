# ⭐ K Star Fintech

> A production-ready **Microservices Fintech Platform** featuring multi-currency digital wallets, real-time currency exchange, UPI P2P transfers via Kafka, NACHA/ACH bank payments, and Digital Gold & Silver trading — built with **Java 17, Spring Boot 3.1, React 18, Apache Kafka, MySQL & MongoDB**.

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.1.5-brightgreen)
![React](https://img.shields.io/badge/React-18-blue)
![Kafka](https://img.shields.io/badge/Kafka-7.4-black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)

---

## ✨ Features

| # | Feature | Service | Tech |
|---|---------|---------|------|
| 1 | JWT Register & Login | user-service | Spring Security + BCrypt |
| 2 | Multi-Currency Wallets (INR/USD/EUR/GBP/JPY) | user-service | JPA + MySQL |
| 3 | Real-Time Currency Exchange | exchange-service | open.er-api.com |
| 4 | UPI P2P Transfer via Kafka | transfer-service | Kafka Events |
| 5 | NACHA / ACH Bank Payments | nacha-service | PPD/CCD/WEB SEC Codes |
| 6 | Digital Gold & Silver Trading | bullion-service | Live MCX Prices |
| 7 | Dashboard with Live Charts | Frontend | Recharts |
| 8 | Add Money (UPI / Bank / Card) | user-service | Wallet Adjust API |

---

## 🛠 Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Language | Java | 17 | Core backend |
| Framework | Spring Boot | 3.1.5 | Microservices framework |
| API Gateway | Spring Cloud Gateway | 4.0.x | Routing + JWT Filter |
| ORM | Spring Data JPA + Hibernate | 3.1.5 | MySQL ORM |
| NoSQL | Spring Data MongoDB | 3.1.5 | Exchange rates + Bullion Holdings |
| Messaging | Apache Kafka | 7.4.0 | Event streaming |
| Security | Spring Security + jjwt | 0.11.5 | JWT Authentication |
| Frontend | React | 18 | UI |
| UI Library | Material UI | 5.x | Component library |
| Charts | Recharts | 2.x | Data visualization |
| HTTP Client | Axios | 1.x | API calls |
| Database | MySQL | 8.0 | Relational data |
| Database | MongoDB | 6.0 | Document data |
| DevOps | Docker + Compose | Latest | Containerization |
| Build Tool | Maven | 3.x | Java build |

---

## 📁 Project Structure

```
kstar_final/
├── backend/
│   ├── gateway-service/       # API Gateway — JWT filter, routing
│   ├── user-service/          # Auth, wallets, UPI
│   ├── exchange-service/      # Live currency exchange
│   ├── transfer-service/      # UPI P2P transfers (Kafka)
│   ├── bullion-service/           # Digital Gold & Silver
│   ├── nacha-service/         # NACHA/ACH bank payments
│   └── docker-compose.yml
├── FrontEnd/
│   └── src/
│       ├── pages/             # Dashboard, Exchange, Transfer, Bullion, NACHA, Account
│       ├── components/        # Layout, Sidebar
│       ├── context/           # Auth context
│       └── api/               # Axios config
├── docs/                      # PDF documentation (6 topics)
├── scripts/                   # start.sh, stop.sh, reset.sh, logs.sh
├── README/                    # Detailed guides
├── fix-and-run.sh             # One-command setup
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (running)
- Node.js 18+

### 1. Clone / Extract
```bash
cd ~/Downloads
unzip kstar_final_complete.zip
cd kstar_final
```

### 2. Run (One Command)
```bash
chmod +x fix-and-run.sh
bash fix-and-run.sh
```

### 3. Database Setup

#### 🐳 Docker Setup (Recommended — Zero Manual Work)

When you run `bash fix-and-run.sh`, Docker Compose automatically creates and initialises all databases. No SQL scripts needed — Hibernate creates the tables on first boot.

---

#### 🖥️ New System / Local MySQL Setup (Without Docker)

If you are running the services locally (not via Docker), you must create the databases and tables manually.

**Step 1 — Create the MySQL database**

```bash
mysql -u root -p
```

```sql
-- Create the shared database used by all MySQL-backed services
CREATE DATABASE IF NOT EXISTS kstar
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kstar;

-- -------------------------------------------------------
-- TABLE: users  (user-service)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    phone       VARCHAR(15)  NOT NULL UNIQUE,
    role        ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------
-- TABLE: wallets  (user-service)
-- Stores currency wallets (INR, USD, EUR, GBP, JPY) and
-- bullion wallets (GOLD, SILVER) for each user.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallets (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT         NOT NULL,
    currency    VARCHAR(10)    NOT NULL,
    balance     DECIMAL(18,4)  NOT NULL DEFAULT 0.0000,
    upi_id      VARCHAR(50)    UNIQUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uq_user_currency UNIQUE (user_id, currency)
);

-- -------------------------------------------------------
-- TABLE: transactions  (transfer-service)
-- UPI P2P transfers processed via Kafka.
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id  VARCHAR(50)   NOT NULL UNIQUE,
    type            VARCHAR(30),
    from_upi_id     VARCHAR(50),
    to_upi_id       VARCHAR(50),
    amount          DECIMAL(18,2) NOT NULL,
    currency        VARCHAR(10),
    status          VARCHAR(20)   DEFAULT 'PENDING',
    description     VARCHAR(255),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at    DATETIME
);

-- -------------------------------------------------------
-- TABLE: nacha_payments  (nacha-service)
-- ACH / NACHA bank payments (PPD, CCD, WEB SEC codes).
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS nacha_payments (
    id                        BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id                VARCHAR(50)   NOT NULL UNIQUE,
    type                      ENUM('CREDIT','DEBIT') NOT NULL,
    sec_code                  VARCHAR(10)   NOT NULL,
    originator_name           VARCHAR(100)  NOT NULL,
    originator_routing_number VARCHAR(9)    NOT NULL,
    originator_account_number VARCHAR(17)   NOT NULL,
    receiver_name             VARCHAR(100)  NOT NULL,
    receiver_routing_number   VARCHAR(9)    NOT NULL,
    receiver_account_number   VARCHAR(17)   NOT NULL,
    account_type              VARCHAR(10),
    amount                    DECIMAL(18,2) NOT NULL,
    currency                  VARCHAR(10)   DEFAULT 'USD',
    description               VARCHAR(255),
    status                    ENUM('PENDING','SUBMITTED','PROCESSING','SETTLED','RETURNED','FAILED') NOT NULL,
    trace_number              VARCHAR(20),
    batch_number              VARCHAR(20),
    failure_reason            VARCHAR(255),
    initiated_by              VARCHAR(100),
    created_at                DATETIME DEFAULT CURRENT_TIMESTAMP,
    settled_at                DATETIME,
    effective_date            DATETIME
);

EXIT;
```

> **Note:** If `ddl-auto: update` is set in `application.yml` (which it is), Hibernate will auto-create any missing tables on startup — so the above SQL is only needed if you want the schema ready before first launch, or if you want to inspect/verify the structure.

---

**Step 2 — MongoDB setup (exchange-service & bullion-service)**

MongoDB creates databases and collections automatically on first insert — no manual setup needed. But if you want to pre-create them:

```bash
mongosh
```

```js
// kstar_exchange — used by exchange-service
use kstar_exchange
db.createCollection("exchange_rates")     // live currency rates cache
db.createCollection("conversion_history") // per-user conversion log

// kstar_bullion — used by bullion-service
use kstar_bullion
db.createCollection("bullion_holdings")              // gold & silver holdings

exit
```

---

**Step 3 — Verify everything**

```bash
# MySQL — confirm all 4 tables exist
mysql -u root -p kstar -e "SHOW TABLES;"

# Expected output:
# +------------------+
# | Tables_in_kstar  |
# +------------------+
# | nacha_payments   |
# | transactions     |
# | users            |
# | wallets          |
# +------------------+

# MongoDB — confirm collections
mongosh --eval "use kstar_exchange; db.getCollectionNames()"
mongosh --eval "use kstar_bullion; db.getCollectionNames()"
```

---

**Summary — What gets created where**

| Database | Type | Tables / Collections | Auto-created? |
|---|---|---|---|
| `kstar` | MySQL | `users`, `wallets`, `transactions`, `nacha_payments` | ✅ Yes (Hibernate `ddl-auto: update`) |
| `kstar_exchange` | MongoDB | `exchange_rates`, `conversion_history` | ✅ Yes (on first insert) |
| `kstar_bullion` | MongoDB | `bullion_holdings` | ✅ Yes (on first insert) |

### 4. Manual Run
```bash
# Stop local MySQL (port conflict)
sudo systemctl stop mysql

# Start backend
cd backend
docker compose down
docker compose build --no-cache user-service gateway-service transfer-service
docker compose up -d

# Wait for user-service (~2 minutes)
until docker logs backend-user-service-1 2>&1 | grep -q "Started"; do sleep 5; done

# Start frontend (new terminal)
cd ../FrontEnd
npm install
npm start
```

App runs on: **http://localhost:3000**

---

## 🌐 Service Ports

| Service | Port | Database |
|---|---|---|
| Frontend (React) | 3000 | — |
| API Gateway | 8080 | — |
| User Service | 8081 | MySQL |
| Exchange Service | 8082 | MongoDB |
| Transfer Service | 8083 | MySQL |
| Bullion Service | 8084 | MongoDB |
| NACHA Service | 8085 | MySQL |
| MySQL | 3306 | — |
| MongoDB | 27017 | — |
| Kafka | 9092 | — |

---

## 📡 Key API Endpoints

### Auth (Public)
```bash
POST /api/auth/register
POST /api/auth/login
```

### Wallets (JWT Required)
```bash
GET  /api/users/me                        # Profile + wallets
GET  /api/users/me/wallets                # All wallets
POST /api/users/me/wallets/adjust         # Debit/Credit wallet
POST /api/users/me/wallets?currency=EUR   # Add new wallet
GET  /api/users/me/upi                    # UPI ID + PIN hint
```

### Exchange
```bash
POST /api/exchange/convert                # Convert currency
GET  /api/exchange/history                # Conversion history
GET  /api/exchange/rates                  # Live rates
```

### Transfer
```bash
POST /api/transfer/upi                    # UPI P2P transfer
GET  /api/transfer/history?upiId=xxx      # Transaction history
```

### NACHA
```bash
POST /api/nacha/payments                  # Initiate ACH payment
GET  /api/nacha/payments                  # Payment history
```

### Gold/Silver (Bullion)
```bash
POST /api/bullion/mint                        # Buy gold/silver
GET  /api/bullion/my                          # My holdings
```

---

## 📐 UPI PIN Formula

```
UPI ID  = phone_number@kstar
UPI PIN = last 4 digits of registered phone
Example: Phone 9876543210 → PIN = 3210
```

---

## 📚 Documentation

See `docs/` folder for detailed PDF guides:
- `01_Project_Overview.pdf`
- `02_Microservices_Architecture.pdf`
- `03_Kafka_Event_Streaming.pdf`
- `04_NACHA_ACH_Payments.pdf`
- `05_Database_Schema_SQL.pdf`
- `06_Frontend_Architecture.pdf`

See `README/` folder for markdown guides:
- `01_QUICK_START.md`
- `02_SQL_DATABASE_GUIDE.md`
- `03_API_REFERENCE.md`
- `04_GITHUB_AND_DEPLOYMENT.md`

---

## 👤 Author & Creator

**Kartikeya Shriwas**
- 💼 Java Developer | 2.5+ Years | Payment Domain Specialist
- 📧 kartikeyashriwas19@gmail.com
- 🔗 GitHub: [github.com/FlashDemonoid](https://github.com/FlashDemonoid)
- 🔗 LinkedIn: [linkedin.com/in/kartikeya-shriwas-4391a8139](https://linkedin.com/in/kartikeya-shriwas-4391a8139)

---

## ⚠️ Copyright Notice

```
© 2026 Kartikeya Shriwas. All Rights Reserved.

This project is the original work of Kartikeya Shriwas.
Unauthorized copying, reproduction, distribution, or claiming
ownership of this project — in whole or in part — is strictly
prohibited without explicit written permission from the author.
```
