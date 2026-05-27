# K Star Fintech — Quick Start

> Kartikeya Shriwas · Java Developer | Payment Domain

---

## What's in the stack

| Layer | Tech |
|-------|------|
| Gateway | Spring Cloud Gateway + JWT |
| Users & Wallets | Spring Boot + JPA + MySQL |
| Currency Exchange | Spring Boot + MongoDB + open.er-api.com |
| UPI Transfers | Spring Boot + Kafka |
| NACHA/ACH | Spring Boot + MySQL |
| Gold/Silver | Spring Boot + MongoDB |
| Frontend | React 18 + Material UI + Recharts |
| Infra | Docker Compose, MySQL 8.0, MongoDB 6.0, Kafka 7.4 |

---

## Features at a glance

| Feature | Notes |
|---------|-------|
| JWT Auth | BCrypt hashed passwords, stateless sessions |
| Multi-Currency Wallets | INR, USD, EUR, GBP, JPY per user |
| Currency Exchange | Live rates with small random fluctuation per request |
| UPI P2P Transfer | Kafka-based, PIN validated, instant |
| NACHA/ACH | US bank payments — PPD/CCD/WEB, T+1 settlement |
| Gold & Silver | Buy/sell digital bullion at simulated MCX prices |
| Dashboard | Balance over time, portfolio pie, bullion holdings |
| Add Money | UPI / Net Banking / Card flow |

---

## Option 1 — One Command (Recommended)

```bash
cd kstar_final
chmod +x fix-and-run.sh
bash fix-and-run.sh
```

The script handles the whole setup — kills local MySQL if running, clears Docker cache, rebuilds services, waits for user-service to be ready, runs a quick API smoke test, and starts the frontend. First run takes 3-4 minutes.

---

## Option 2 — Docker Manual

**Requirements:** Docker Desktop (running), Node.js 18+

```bash
# Local MySQL will fight Docker for port 3306 — kill it first
sudo systemctl stop mysql

# Backend
cd kstar_final/backend
docker compose down
docker compose build --no-cache user-service gateway-service transfer-service
docker compose up -d

# user-service needs ~2 min (Kafka + Hibernate startup)
until docker logs backend-user-service-1 2>&1 | grep -q "Started UserServiceApplication"; do
    printf "." && sleep 5
done
echo " Ready!"

# Frontend — open a new terminal
cd ../FrontEnd
npm install
npm start
```

Open **http://localhost:3000**

---

## Option 3 — Local Development (services on host, infra in Docker)

**Requirements:** Docker Desktop, Java 17+, Maven 3.8+, Node.js 18+

```bash
# Step 1 — Start only the infra containers
cd backend
docker compose up mysql mongodb kafka zookeeper -d
sleep 25  # give them time to initialize

# Step 2 — Start each service in its own terminal
cd user-service     && mvn spring-boot:run   # Terminal 1 — port 8081
cd exchange-service && mvn spring-boot:run   # Terminal 2 — port 8082
cd transfer-service && mvn spring-boot:run   # Terminal 3 — port 8083
cd bullion-service  && mvn spring-boot:run   # Terminal 4 — port 8084
cd nacha-service    && mvn spring-boot:run   # Terminal 5 — port 8085
cd gateway-service  && mvn spring-boot:run   # Terminal 6 — port 8080 (start LAST)

# Step 3 — Frontend
cd FrontEnd && npm install && npm start      # Terminal 7 — port 3000
```

---

## Port Map

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Gateway | 8080 |
| User Service | 8081 |
| Exchange Service | 8082 |
| Transfer Service | 8083 |
| Bullion | 8084 |
| NACHA Service | 8085 |

---

## First Time Using It

1. Go to `http://localhost:3000/register`
2. Register with a 10-digit phone number — you'll get ₹10,000 INR wallet on signup
3. UPI ID = `phone@kstar` | PIN = last 4 digits of your phone
4. Try Exchange, Transfer, Bullion from the sidebar

---

## Useful Commands

```bash
# Tail logs for a specific service
cd backend && docker compose logs -f user-service

# Stop everything
./scripts/stop.sh

# Wipe all data and start fresh
./scripts/reset.sh

# Check container status
cd backend && docker compose ps
```

---

## Common Issues

| Problem | Fix |
|---------|-----|
| Port 3306 busy | `sudo systemctl stop mysql` |
| Port 8080 busy | `lsof -ti:8080 \| xargs kill` |
| Services crash on start | Wait 2 min — user-service initialization takes time |
| Exchange shows zero balance | My Account → Add Money first |
| UPI transfer rejected | PIN = last 4 digits of your phone number |
| Can't connect to Docker | Open Docker Desktop app first |

---

**Kartikeya Shriwas** — Java Developer | Payment Domain
kartikeyashriwas19@gmail.com · https://github.com/FlashDemonoid

© 2026 Kartikeya Shriwas. All Rights Reserved.
