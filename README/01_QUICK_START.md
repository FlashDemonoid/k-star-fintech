# ⭐ K Star Fintech — Quick Start Guide

> Created by **Kartikeya Shriwas** · Java Developer | Payment Domain

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.1.5-brightgreen)
![React](https://img.shields.io/badge/React-18-blue)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)

---

## 🏗️ Tech Stack Summary

| Layer | Technology |
|---|---|
| API Gateway | Spring Cloud Gateway + JWT |
| User & Wallets | Spring Boot + JPA + MySQL |
| Currency Exchange | Spring Boot + MongoDB + open.er-api.com |
| UPI Transfer | Spring Boot + Kafka Events |
| NACHA/ACH | Spring Boot + MySQL |
| Gold/Silver | Spring Boot + MongoDB |
| Frontend | React 18 + Material UI + Recharts |
| Infra | Docker Compose, MySQL 8.0, MongoDB 6.0, Kafka 7.4 |

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 JWT Auth | Register/login with BCrypt password hashing |
| 💳 Multi-Currency Wallets | INR, USD, EUR, GBP, JPY per user |
| 💱 Real-Time Exchange | Live rates from open.er-api.com |
| 💸 UPI P2P Transfer | Instant transfer via Kafka events |
| 🏦 NACHA/ACH | US bank payments (PPD/CCD/WEB) + return codes |
| 🏅 Gold & Silver | Buy/sell digital bullion with live MCX prices |
| 📊 Dashboard | Balance history, portfolio pie, bullion holdings |
| 💰 Add Money | UPI / Net Banking / Card (3-step flow) |

---

## ✅ Option 1 — One Command (Recommended)

```bash
cd kstar_final
chmod +x fix-and-run.sh
bash fix-and-run.sh
```

This script automatically:
- Stops local MySQL (port 3306 conflict fix)
- Clears Docker cache
- Rebuilds all services with `--no-cache`
- Waits for user-service to be ready
- Tests registration API
- Starts frontend

---

## ✅ Option 2 — Docker Manual

### Prerequisites
- Docker Desktop (running)
- Node.js 18+

```bash
# Stop local MySQL first (prevents port 3306 conflict)
sudo systemctl stop mysql

# Backend
cd kstar_final/backend
docker compose down
docker compose build --no-cache user-service gateway-service transfer-service
docker compose up -d

# Wait ~2 minutes for user-service
until docker logs backend-user-service-1 2>&1 | grep -q "Started UserServiceApplication"; do
    printf "." && sleep 5
done
echo " Ready!"

# Frontend (new terminal)
cd ../FrontEnd
npm install
npm start
```

Open: **http://localhost:3000**

---

## ✅ Option 3 — Local Development

### Prerequisites
- Docker Desktop (for MySQL, MongoDB, Kafka only)
- Java 17+ (`java -version`)
- Maven 3.8+ (`mvn -v`)
- Node.js 18+ (`node -v`)

```bash
# Step 1 — Start infrastructure
cd backend
docker compose up mysql mongodb kafka zookeeper -d
sleep 25

# Step 2 — Start services (7 terminals)
cd user-service    && mvn spring-boot:run  # Terminal 1 — port 8081
cd exchange-service && mvn spring-boot:run # Terminal 2 — port 8082
cd transfer-service && mvn spring-boot:run # Terminal 3 — port 8083
cd bullion-service     && mvn spring-boot:run  # Terminal 4 — port 8084
cd nacha-service   && mvn spring-boot:run  # Terminal 5 — port 8085
cd gateway-service  && mvn spring-boot:run # Terminal 6 — port 8080 (START LAST)

# Step 3 — Frontend
cd FrontEnd && npm install && npm start     # Terminal 7 — port 3000
```

---

## 🌐 Port Map

| Service | Port | URL |
|---|---|---|
| Frontend | 3000 | http://localhost:3000 |
| Gateway | 8080 | http://localhost:8080 |
| User Service | 8081 | http://localhost:8081 |
| Exchange Service | 8082 | http://localhost:8082 |
| Transfer Service | 8083 | http://localhost:8083 |
| Bullion | 8084 | http://localhost:8084 |
| NACHA Service | 8085 | http://localhost:8085 |

---

## 🧪 First Use

1. Go to `http://localhost:3000/register`
2. Register with phone (10 digits) → get ₹10,000 INR wallet
3. Your UPI ID = `phone@kstar`  |  PIN = last 4 digits of phone
4. Try Exchange, Transfer, Bullion from sidebar

---

## 🛠️ Useful Commands

```bash
# View logs
cd backend && docker compose logs -f user-service

# Stop everything
./scripts/stop.sh

# Reset all data (fresh start)
./scripts/reset.sh

# Check container status
cd backend && docker compose ps
```

---

## ❗ Troubleshooting

| Problem | Solution |
|---|---|
| Port 3306 in use | `sudo systemctl stop mysql` |
| Port 8080 in use | `lsof -ti:8080 \| xargs kill` |
| Services not starting | Wait 2 min — user-service is slow |
| Exchange shows 0 balance | Go to My Account → Add Money |
| UPI transfer fails | Check PIN = last 4 digits of phone |
| Cannot connect to Docker | Open Docker Desktop app |

---

## 👤 Creator

**Kartikeya Shriwas** — Java Developer | Payment Domain
📧 kartikeyashriwas19@gmail.com
🔗 https://github.com/FlashDemonoid

> © 2026 Kartikeya Shriwas. All Rights Reserved. Unauthorized copying prohibited.
