#!/bin/bash
# K Star Fintech — Stop Script | by Kartikeya Shriwas
GREEN='\033[0;32m'; NC='\033[0m'
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}[K-STAR]${NC} Stopping all services..."
cd "$ROOT_DIR/backend"
docker compose down
[ -f /tmp/kstar_fe.pid ] && kill $(cat /tmp/kstar_fe.pid) 2>/dev/null && rm /tmp/kstar_fe.pid
echo -e "${GREEN}[K-STAR]${NC} ✅ All stopped. Created by Kartikeya Shriwas."
