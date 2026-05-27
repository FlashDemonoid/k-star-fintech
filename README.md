# K Star Fintech

A personal fintech project I built to go beyond the usual CRUD demos. It covers real-world payment concepts — UPI transfers, NACHA/ACH batch payments, multi-currency wallets, and digital gold/silver trading — all wired through Kafka and split across microservices.

Built with Java 17, Spring Boot 3.1, React 18, Kafka, MySQL and MongoDB.

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.1.5-brightgreen)
![React](https://img.shields.io/badge/React-18-blue)
![Kafka](https://img.shields.io/badge/Kafka-7.4-black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)

---

## What it does

| Feature | Service | How |
|---------|---------|-----|
| JWT Register & Login | user-service | Spring Security + BCrypt |
| Multi-Currency Wallets (INR/USD/EUR/GBP/JPY) | user-service | JPA + MySQL |
| Real-Time Currency Exchange | exchange-service | open.er-api.com + live rate fluctuation |
| UPI P2P Transfer | transfer-service | Kafka events + PIN validation |
| NACHA / ACH Bank Payments | nacha-service | PPD/CCD/WEB SEC codes, T+1 settlement |
| Digital Gold & Silver Trading | bullion-service | Live MCX prices, MongoDB holdings |
| Dashboard with Live Charts | Frontend | Recharts |
| Add Money (UPI / Bank / Card) | user-service | Wallet adjust API |

---

## Tech Stack

| Layer | Technology | Version | Why I used it |
|-------|-----------|---------|---------------|
| Language | Java | 17 | Records, sealed classes, text blocks |
| Framework | Spring Boot | 3.1.5 | Fast microservice setup |
| API Gateway | Spring Cloud Gateway | 4.0.x | Central JWT filter, routing |
| ORM | Spring Data JPA + Hibernate | 3.1.5 | MySQL persistence |
| NoSQL | Spring Data MongoDB | 3.1.5 | Exchange rates + bullion (schema-less fits well) |
| Messaging | Apache Kafka | 7.4.0 | Decoupled transfer and notification events |
| Security | Spring Security + jjwt | 0.11.5 | Stateless JWT auth |
| Frontend | React | 18 | Component-based UI |
| UI Library | Material UI | 5.x | Consistent look |
| Charts | Recharts | 2.x | Balance history, portfolio breakdown |
| HTTP Client | Axios | 1.x | API calls from React |
| Database | MySQL | 8.0 | Users, wallets, transactions |
| Database | MongoDB | 6.0 | Exchange rates, bullion holdings |
| Infra | Docker + Compose | Latest | One-command local setup |
| Build | Maven | 3.x | Multi-module project structure |

---

## Project Structure

```
kstar_final/
├── backend/
│   ├── gateway-service/       # JWT filter + routing — start this last
│   ├── user-service/          # Auth, wallets, UPI validation
│   ├── exchange-service/      # Currency conversion, live rates
│   ├── transfer-service/      # UPI P2P via Kafka
│   ├── bullion-service/       # Digital gold & silver
│   ├── nacha-service/         # NACHA/ACH bank payments
│   └── docker-compose.yml
├── FrontEnd/
│   └── src/
│       ├── pages/             # Dashboard, Exchange, Transfer, Bullion, NACHA, Account
│       ├── components/        # Layout, Sidebar
│       ├── context/           # Auth context
│       └── api/               # Axios config
├── README/                    # More detailed guides per topic
├── scripts/                   # start.sh, stop.sh, reset.sh, logs.sh
├── fix-and-run.sh             # Does everything automatically
└── README.md
```

---

## Quick Start

**Requirements:** Docker Desktop (running), Node.js 18+

### Option A — One command (easiest)

```bash
cd kstar_final
chmod +x fix-and-run.sh
bash fix-and-run.sh
```

This stops local MySQL (port conflict), rebuilds all services, waits for them to be ready, and starts the frontend. Takes about 3-4 minutes on first run.

### Option B — Manual Docker

```bash
# Kill local MySQL first — Docker needs port 3306
sudo systemctl stop mysql

cd backend
docker compose down
docker compose build --no-cache user-service gateway-service transfer-service
docker compose up -d

# user-service takes ~2 min to start (Hibernate + Kafka init)
until docker logs backend-user-service-1 2>&1 | grep -q "Started"; do sleep 5; done

# Frontend — new terminal
cd ../FrontEnd
npm install
npm start
```

App runs at **http://localhost:3000**

---

## Database Setup

### Docker (recommended)

Nothing to do. Hibernate auto-creates all MySQL tables on first boot. MongoDB creates collections on first insert. Just run Docker Compose and you're done.

### Local MySQL (without Docker)

If you're running services directly with `mvn spring-boot:run`, create the databases manually first:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS kstar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kstar;

CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    phone       VARCHAR(15)  NOT NULL UNIQUE,
    role        ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

For MongoDB — it sets itself up on first insert, but if you want to pre-create:

```bash
mongosh
```

```js
use kstar_exchange
db.createCollection("exchange_rates")
db.createCollection("conversion_history")

use kstar_bullion
db.createCollection("bullion_holdings")

exit
```

**Quick check:**

```bash
# MySQL
mysql -u root -p kstar -e "SHOW TABLES;"
# Should show: nacha_payments, transactions, users, wallets

# MongoDB
mongosh --eval "use kstar_exchange; db.getCollectionNames()"
```

---

## Service Ports

| Service | Port |
|---------|------|
| Frontend (React) | 3000 |
| API Gateway | 8080 |
| User Service | 8081 |
| Exchange Service | 8082 |
| Transfer Service | 8083 |
| Bullion Service | 8084 |
| NACHA Service | 8085 |
| MySQL | 3306 |
| MongoDB | 27017 |
| Kafka | 9092 |

---

## API Endpoints

### Auth (no token needed)
```
POST /api/auth/register
POST /api/auth/login
```

### Wallets (Bearer token required)
```
GET  /api/users/me
GET  /api/users/me/wallets
POST /api/users/me/wallets/adjust     # add/deduct balance
POST /api/users/me/wallets?currency=EUR
GET  /api/users/me/upi
```

### Exchange
```
POST /api/exchange/convert
GET  /api/exchange/history
GET  /api/exchange/rates
```

### Transfer
```
POST /api/transfer/upi
GET  /api/transfer/history?upiId=xxx
```

### NACHA
```
POST /api/nacha/payments
GET  /api/nacha/payments
```

### Gold/Silver (Bullion)
```
POST /api/bullion/mint
GET  /api/bullion/my
```

---

## UPI PIN

```
UPI ID  = phone_number@kstar
UPI PIN = last 4 digits of registered phone

Example: phone 9876543210 → PIN = 3210
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 3306 in use | `sudo systemctl stop mysql` |
| Port 8080 in use | `lsof -ti:8080 \| xargs kill` |
| Services not starting | Wait 2 min — user-service is slow on first boot |
| Exchange shows 0 balance | Go to My Account → Add Money |
| UPI transfer fails | PIN = last 4 digits of your phone number |
| Docker not connecting | Make sure Docker Desktop is open |

---

## Author

**Kartikeya Shriwas**
- Java Developer | 3 years backend experience | Payment domain
- kartikeyashriwas19@gmail.com
- GitHub: [github.com/FlashDemonoid](https://github.com/FlashDemonoid)
- LinkedIn: [linkedin.com/in/kartikeya-shriwas-4391a8139](https://linkedin.com/in/kartikeya-shriwas-4391a8139)

---

© 2026 Kartikeya Shriwas. All Rights Reserved.
Unauthorized copying, reproduction, or redistribution of this project without written permission is prohibited.
