#!/bin/bash
# K Star Fintech — View logs for a specific service
# Usage: ./scripts/logs.sh [gateway|user|exchange|transfer|bullion|nacha|all]
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SVC=${1:-all}
cd "$ROOT_DIR/backend"
if [ "$SVC" = "all" ]; then
  docker compose logs -f
else
  docker compose logs -f "${SVC}-service"
fi
