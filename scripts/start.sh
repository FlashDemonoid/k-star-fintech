#!/bin/bash
# ============================================================
# K Star Fintech — Start Script
# Created by: Kartikeya Shriwas
# © 2026 Kartikeya Shriwas. All Rights Reserved.
# Usage: ./scripts/start.sh [docker|local]
# ============================================================
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[K-STAR]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
head() { echo -e "\n${CYAN}══════ $1 ══════${NC}"; }

MODE=${1:-docker}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

head "K Star Fintech — $MODE mode | by Kartikeya Shriwas"

if [ "$MODE" = "docker" ]; then
    log "Stopping local MySQL..."
    sudo systemctl stop mysql 2>/dev/null || true
    sudo lsof -ti:3306 | xargs sudo kill -9 2>/dev/null || true
    sleep 2

    cd "$ROOT_DIR/backend"
    log "Starting all services..."
    docker compose up -d

    log "Waiting for user-service..."
    until docker logs backend-user-service-1 2>&1 | grep -q "Started UserServiceApplication"; do
        printf "."; sleep 5
    done
    echo ""
    log "✅ Backend ready!"

    cd "$ROOT_DIR/FrontEnd"
    [ ! -d node_modules ] && npm install
    log "Starting frontend at http://localhost:3000"
    npm start

elif [ "$MODE" = "local" ]; then
    cd "$ROOT_DIR/backend"
    docker compose up mysql mongodb kafka zookeeper -d
    log "Infrastructure started. Wait 25 seconds..."
    sleep 25
    echo ""
    echo "Now run each service in a separate terminal:"
    echo "  Terminal 1: cd $ROOT_DIR/backend/user-service    && mvn spring-boot:run"
    echo "  Terminal 2: cd $ROOT_DIR/backend/exchange-service && mvn spring-boot:run"
    echo "  Terminal 3: cd $ROOT_DIR/backend/transfer-service && mvn spring-boot:run"
    echo "  Terminal 4: cd $ROOT_DIR/backend/bullion-service      && mvn spring-boot:run"
    echo "  Terminal 5: cd $ROOT_DIR/backend/nacha-service    && mvn spring-boot:run"
    echo "  Terminal 6: cd $ROOT_DIR/backend/gateway-service  && mvn spring-boot:run"
    echo "  Terminal 7: cd $ROOT_DIR/FrontEnd                 && npm install && npm start"
fi
