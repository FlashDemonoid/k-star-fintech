#!/bin/bash
# K Star Fintech — Stop Script | by Kartikeya Shriwas
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

MODE=${1:-docker}

if [ "$MODE" = "docker" ]; then
    echo -e "${GREEN}[K-STAR]${NC} Stopping Docker services..."
    cd "$ROOT_DIR/backend"
    docker compose down
    [ -f /tmp/kstar_fe.pid ] && kill $(cat /tmp/kstar_fe.pid) 2>/dev/null && rm /tmp/kstar_fe.pid
    echo -e "${GREEN}[K-STAR]${NC} ✅ All stopped."

elif [ "$MODE" = "k8s" ]; then
    echo -e "${GREEN}[K-STAR]${NC} Stopping Kubernetes deployment..."
    kubectl delete namespace kstar
    echo -e "${GREEN}[K-STAR]${NC} ✅ Kubernetes namespace 'kstar' deleted."

else
    echo -e "${YELLOW}Usage:${NC} ./scripts/stop.sh [docker|k8s]"
    echo "  docker — Stop Docker Compose services (default)"
    echo "  k8s    — Delete Kubernetes namespace and all resources"
fi

echo -e "${GREEN}[K-STAR]${NC} Created by Kartikeya Shriwas."
