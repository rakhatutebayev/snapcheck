#!/bin/bash
set -euo pipefail

# Quick Deploy for SnapCheck v1.1.0
# Usage:
#   ./quick-deploy.sh            # normal build
#   ./quick-deploy.sh --no-cache # rebuild images without cache
#   ./quick-deploy.sh --pull     # git pull before build
#   ./quick-deploy.sh --migrate  # run db migrations before up
#
# Requirements:
# - docker, docker compose
# - env vars: DOMAIN, SECRET_KEY, DB_PASSWORD (exported or in shell)

# Resolve project directory to the repo root (script location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

# Move to project root so docker-compose paths are correct
cd "$PROJECT_DIR"

if [ ! -f "$PROJECT_DIR/docker-compose.prod.yml" ]; then
  echo "docker-compose.prod.yml not found in $PROJECT_DIR" >&2
  exit 1
fi

NO_CACHE=false
DO_PULL=false
DO_MIGRATE=false
DOMAIN_OVERRIDE=""

for arg in "$@"; do
  case "$arg" in
    --no-cache) NO_CACHE=true ;;
    --pull) DO_PULL=true ;;
    --migrate) DO_MIGRATE=true ;;
    --domain=*) DOMAIN_OVERRIDE="${arg#*=}" ;;
  esac
done

if ! command -v docker &>/dev/null; then
  echo "docker not found" >&2
  exit 1
fi
if ! docker compose version &>/dev/null; then
  echo "docker compose not found" >&2
  exit 1
fi

# Optional git pull
if [ "$DO_PULL" = true ]; then
  echo "📥 git pull origin main"
  git fetch origin
  git pull origin main
fi

# Ensure traefik network exists
if ! docker network ls | grep -q "traefik_proxy"; then
  echo "🌐 creating traefik_proxy network"
  docker network create traefik_proxy
fi

# Optional migrations (run one-shot service)
if [ "$DO_MIGRATE" = true ]; then
  echo "🗄️  running migrations"
  docker compose -f docker-compose.prod.yml run --rm db-migrate
fi

BUILD_FLAGS=("--build")
if [ "$NO_CACHE" = true ]; then
  BUILD_FLAGS+=("--no-cache")
fi

# Up services
echo "🚀 docker compose up -d ${BUILD_FLAGS[*]}"
docker compose -f docker-compose.prod.yml up -d ${BUILD_FLAGS[*]}

# Health checks
echo "⏳ waiting 20s for services..."; sleep 20

EFFECTIVE_DOMAIN="$DOMAIN"
if [ -n "$DOMAIN_OVERRIDE" ]; then
  EFFECTIVE_DOMAIN="$DOMAIN_OVERRIDE"
fi
if [ -z "${EFFECTIVE_DOMAIN:-}" ]; then
  EFFECTIVE_DOMAIN="localhost"
fi

BACKEND_URL="https://${EFFECTIVE_DOMAIN}/api/health"
FRONTEND_URL="https://${EFFECTIVE_DOMAIN}/"

set +e
BE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL")
FE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
set -e

echo "Backend: $BACKEND_URL => HTTP $BE_CODE"
echo "Frontend: $FRONTEND_URL => HTTP $FE_CODE"

if [ "$BE_CODE" != "200" ]; then
  echo "❌ Backend health check failed" >&2
  exit 1
fi

echo "✅ Deploy complete (API v1.1.0)"
