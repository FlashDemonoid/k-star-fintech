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
    echo "  Terminal 4: cd $ROOT_DIR/backend/bullion-service  && mvn spring-boot:run"
    echo "  Terminal 5: cd $ROOT_DIR/backend/nacha-service    && mvn spring-boot:run"
    echo "  Terminal 6: cd $ROOT_DIR/backend/gateway-service  && mvn spring-boot:run"
    echo "  Terminal 7: cd $ROOT_DIR/FrontEnd                 && npm install && npm start"

elif [ "$MODE" = "k8s" ]; then
    # Check kubectl
    if ! command -v kubectl &>/dev/null; then
        err "kubectl not found. Install it first: https://kubernetes.io/docs/tasks/tools/"
    fi

    # Check minikube
    if ! command -v minikube &>/dev/null; then
        err "Minikube not found. Install it first: https://minikube.sigs.k8s.io/docs/start/"
    fi

    log "Starting Minikube..."
    minikube start
    minikube addons enable ingress

    log "Building Docker images inside Minikube..."
    eval $(minikube docker-env)
    docker build -t kstar/gateway-service:latest  "$ROOT_DIR/backend/gateway-service"
    docker build -t kstar/user-service:latest     "$ROOT_DIR/backend/user-service"
    docker build -t kstar/exchange-service:latest "$ROOT_DIR/backend/exchange-service"
    docker build -t kstar/transfer-service:latest "$ROOT_DIR/backend/transfer-service"
    docker build -t kstar/bullion-service:latest  "$ROOT_DIR/backend/bullion-service"
    docker build -t kstar/nacha-service:latest    "$ROOT_DIR/backend/nacha-service"

    log "Deploying to Kubernetes..."
    cd "$ROOT_DIR/k8s"
    chmod +x deploy.sh
    ./deploy.sh

    MINIKUBE_IP=$(minikube ip)
    log "✅ Kubernetes deployment done!"
    echo ""
    echo "  Add this to /etc/hosts:"
    echo "  $MINIKUBE_IP  kstar.local"
    echo ""
    echo "  Then open: http://kstar.local"
    echo ""
    echo "  Check status: kubectl get all -n kstar"

else
    warn "Unknown mode: $MODE"
    echo "Usage: ./scripts/start.sh [docker|local|k8s]"
    echo "  docker  — Run with Docker Compose (default)"
    echo "  local   — Run services locally with Maven"
    echo "  k8s     — Deploy to Kubernetes via Minikube"
fi
