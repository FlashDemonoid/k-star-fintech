#!/bin/bash
# ============================================================
# K Star Fintech — One Command Setup Script
# Created by: Kartikeya Shriwas
# © 2026 Kartikeya Shriwas. All Rights Reserved.
# Usage: bash fix-and-run.sh
# ============================================================
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[K-STAR]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1";  }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
head() {
  echo -e "\n${CYAN}══════════════════════════════════════${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}══════════════════════════════════════${NC}"
}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$SCRIPT_DIR/backend"
FRONTEND="$SCRIPT_DIR/FrontEnd"

head "⭐ K Star Fintech — Setup by Kartikeya Shriwas"
log "Project path: $SCRIPT_DIR"

# Stop local MySQL (prevents port 3306 conflict)
head "Stopping Local MySQL"
sudo systemctl stop mysql  2>/dev/null && log "MySQL stopped" || log "MySQL was not running"
sudo systemctl stop mysqld 2>/dev/null || true
sudo lsof -ti:3306 | xargs sudo kill -9 2>/dev/null || true
sleep 2

cd "$BACKEND"

# Stop running containers
head "Stopping Old Containers"
docker compose down 2>/dev/null && log "Containers stopped" || log "No containers running"

# Clear Docker build cache
head "Clearing Docker Build Cache"
docker builder prune -f 2>/dev/null | tail -1
log "Cache cleared"

# Build services with --no-cache
head "Building Services (8-10 min first time)"
log "Building: user-service, gateway-service, transfer-service, exchange-service, bullion-service..."
docker compose build --no-cache \
  user-service \
  gateway-service \
  transfer-service \
  exchange-service \
  bullion-service

# Start all services
head "Starting All Services"
docker compose up -d
log "All services started"

# Wait for user-service to be ready
head "Waiting for user-service (takes ~2 min)"
ELAPSED=0
until docker logs backend-user-service-1 2>&1 | grep -q "Started UserServiceApplication"; do
    printf "  ⏳ %ds elapsed...\r" $ELAPSED
    sleep 5
    ELAPSED=$((ELAPSED+5))
done
echo ""
log "✅ user-service READY in ${ELAPSED}s"

# Container health check
head "Container Status"
docker compose ps

# Test Registration API
head "Testing Registration API"
TS=$(date +%s)
RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"username\":\"testuser${TS}\",
    \"email\":\"test${TS}@kstar.com\",
    \"phone\":\"98765${TS: -5}\",
    \"password\":\"test1234\"
  }" 2>/dev/null)

if echo "$RESPONSE" | grep -q '"token"'; then
    log "✅ Registration API WORKING!"
    log "Token received — backend is fully functional"
else
    warn "Registration response: $RESPONSE"
    warn "Checking user-service logs for errors..."
    docker logs backend-user-service-1 2>&1 | grep -E "ERROR|Exception|WARN" | tail -5
fi

# Start Frontend
head "Starting Frontend"
cd "$FRONTEND"

if [ ! -d node_modules ]; then
    log "Installing npm packages (first time ~3 min)..."
    npm install
else
    log "npm packages already installed"
fi

echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  🎉 K Star Fintech is Ready!${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}Frontend:${NC}         http://localhost:3000"
echo -e "  ${CYAN}Gateway API:${NC}      http://localhost:8080"
echo -e "  ${CYAN}User Service:${NC}     http://localhost:8081"
echo -e "  ${CYAN}Exchange:${NC}         http://localhost:8082"
echo -e "  ${CYAN}Transfer:${NC}         http://localhost:8083"
echo -e "  ${CYAN}Bullion/Bullion:${NC}      http://localhost:8084"
echo -e "  ${CYAN}NACHA:${NC}            http://localhost:8085"
echo ""
echo -e "  ${YELLOW}Created by:${NC} Kartikeya Shriwas"
echo -e "  ${YELLOW}Stop with:${NC}  bash scripts/stop.sh"
echo ""

npm start
