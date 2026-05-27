#!/bin/bash
# K Star Fintech — Reset Script | by Kartikeya Shriwas
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

MODE=${1:-docker}

echo -e "${RED}⚠️  This deletes ALL data!${NC}"
read -p "Type 'yes' to confirm: " confirm
[ "$confirm" != "yes" ] && echo "Aborted." && exit 0

if [ "$MODE" = "docker" ]; then
    echo -e "${GREEN}[K-STAR]${NC} Resetting Docker volumes..."
    cd "$ROOT_DIR/backend"
    docker compose down -v
    echo -e "${GREEN}[K-STAR]${NC} ✅ All data reset. Run fix-and-run.sh to start fresh."

elif [ "$MODE" = "k8s" ]; then
    echo -e "${GREEN}[K-STAR]${NC} Resetting Kubernetes..."
    kubectl delete namespace kstar 2>/dev/null || true
    echo -e "${YELLOW}[K-STAR]${NC} Waiting for namespace to terminate..."
    kubectl wait --for=delete namespace/kstar --timeout=60s 2>/dev/null || true
    echo -e "${GREEN}[K-STAR]${NC} Redeploying..."
    cd "$ROOT_DIR/k8s"
    chmod +x deploy.sh
    ./deploy.sh
    echo -e "${GREEN}[K-STAR]${NC} ✅ Kubernetes reset and redeployed."

else
    echo -e "${YELLOW}Usage:${NC} ./scripts/reset.sh [docker|k8s]"
    echo "  docker — Reset Docker volumes (default)"
    echo "  k8s    — Delete and redeploy Kubernetes namespace"
fi
