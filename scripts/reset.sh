#!/bin/bash
# K Star Fintech — Reset Script | by Kartikeya Shriwas
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${RED}⚠️  This deletes ALL data (MySQL + MongoDB volumes)!${NC}"
read -p "Type 'yes' to confirm: " confirm
[ "$confirm" != "yes" ] && echo "Aborted." && exit 0

cd "$ROOT_DIR/backend"
docker compose down -v
echo -e "${GREEN}[K-STAR]${NC} ✅ All data reset. Run fix-and-run.sh to start fresh."
