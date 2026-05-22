#!/bin/bash
# K Star Fintech — Logs Script | by Kartikeya Shriwas
# Usage: ./scripts/logs.sh [gateway|user|exchange|transfer|bullion|nacha|all] [docker|k8s]
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

SVC=${1:-all}
MODE=${2:-docker}

if [ "$MODE" = "docker" ]; then
    cd "$ROOT_DIR/backend"
    if [ "$SVC" = "all" ]; then
        docker compose logs -f
    else
        docker compose logs -f "${SVC}-service"
    fi

elif [ "$MODE" = "k8s" ]; then
    if [ "$SVC" = "all" ]; then
        kubectl get pods -n kstar
        echo ""
        echo "Tip: To follow logs for a specific service run:"
        echo "  ./scripts/logs.sh gateway k8s"
    else
        POD=$(kubectl get pod -n kstar -l app=${SVC}-service -o jsonpath="{.items[0].metadata.name}" 2>/dev/null)
        if [ -z "$POD" ]; then
            echo "No pod found for '${SVC}-service' in namespace kstar."
            echo "Available pods:"
            kubectl get pods -n kstar
        else
            kubectl logs -f "$POD" -n kstar
        fi
    fi

else
    echo "Usage: ./scripts/logs.sh [gateway|user|exchange|transfer|bullion|nacha|all] [docker|k8s]"
    echo "  docker — Docker Compose logs (default)"
    echo "  k8s    — Kubernetes pod logs"
fi
