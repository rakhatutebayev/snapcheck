#!/usr/bin/env bash

# ──────────────────────────────────────────────────────────────────────────────
# 🚀 SnapCheck Rolling/Partial Deploy (backend/frontend only, no DB drop)
# ──────────────────────────────────────────────────────────────────────────────
# Purpose
# - Build and update only changed services (backend / frontend)
# - Validate .env and critical settings (DOMAIN, FRONTEND_URL)
# - Wait for health checks before proceeding to the next step
# - Keep DB running; optionally run lightweight migrations if present
#
# Usage (on server):
#   cd /opt/snapcheck
#   ./deploy-rolling.sh                # auto-detect changes via git
#   ./deploy-rolling.sh --backend      # force only backend
#   ./deploy-rolling.sh --frontend     # force only frontend
#   ./deploy-rolling.sh --both         # update both services
#
# Requirements:
#   - Docker & Docker Compose (prefer v2: `docker compose`)
#   - Repo is a git clone with HEAD pointing to desired commit
#   - Services defined in docker-compose-traefik.yml with healthchecks
#
# Notes:
#   - This script does NOT recreate the DB container.
#   - For zero-downtime rollouts, consider upgrading to docker compose v2 and
#     removing container_name, then using scaling/blue-green. This script
#     minimizes downtime but cannot guarantee 0s without replicas.
# ──────────────────────────────────────────────────────────────────────────────

set -Eeuo pipefail
IFS=$'\n\t'

COMPOSE_FILE="docker-compose-traefik.yml"
# Prefer docker compose v2 if available
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  DC=(docker compose -f "${COMPOSE_FILE}")
else
  DC=(docker-compose -f "${COMPOSE_FILE}")
fi

# Fixed container names from compose (used by health waits)
# With compose v2 (no container_name) names will follow pattern: <project>_<service>_<index>
# Detect dynamically to stay robust.
detect_container_name() {
  local service="$1"
  # Compose v2 default pattern: <project>-<service>-<index>
  local name
  name=$(docker ps --format '{{.Names}}' | grep -E -- "-${service}-[0-9]+$" | head -n1 || true)
  if [[ -n "$name" ]]; then echo "$name"; return; fi
  # Fallback: any container (including exited)
  name=$(docker ps -a --format '{{.Names}}' | grep -E -- "-${service}-[0-9]+$" | head -n1 || true)
  if [[ -n "$name" ]]; then echo "$name"; return; fi
  # Legacy explicit container_name (if still present)
  name=$(docker ps --format '{{.Names}}' | grep -E "^snapcheck-${service}$" | head -n1 || true)
  if [[ -n "$name" ]]; then echo "$name"; return; fi
  echo ""  # Return empty if not found; caller should handle
}

BACKEND_CONTAINER="$(detect_container_name backend)"
FRONTEND_CONTAINER="$(detect_container_name frontend)"

log() { printf "\033[1;34m[deploy]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[warn]\033[0m %s\n" "$*"; }
err() { printf "\033[0;31m[error]\033[0m %s\n" "$*"; }
ok() { printf "\033[0;32m[ok]\033[0m %s\n" "$*"; }

require_file() {
  local f="$1"
  [[ -f "$f" ]] || { err "Missing required file: $f"; exit 1; }
}

require_env_var() {
  local key="$1"
  if ! grep -q "^${key}=" .env 2>/dev/null; then
    err "Required variable ${key} is missing in .env"; exit 1;
  fi
}

health_status() {
  local name="$1"
  docker inspect -f '{{json .State.Health.Status}}' "$name" 2>/dev/null | tr -d '"' || true
}

wait_healthy() {
  local name="$1"; local timeout="${2:-90}"; local waited=0
  if [[ -z "$name" ]]; then
    warn "No container name detected for health wait; skipping health check."; return 0;
  fi
  log "Waiting for healthy: $name (timeout=${timeout}s)"
  while true; do
    local st; st=$(health_status "$name")
    if [[ "$st" == "healthy" ]]; then ok "$name is healthy"; return 0; fi
    if (( waited >= timeout )); then err "Timeout waiting for $name (last status: ${st:-unknown})"; return 1; fi
    sleep 3; (( waited+=3 ))
  done
}

parse_args() {
  FORCE=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --backend) FORCE="backend" ; shift ;;
      --frontend) FORCE="frontend" ; shift ;;
      --both) FORCE="both" ; shift ;;
      *) warn "Unknown arg: $1" ; shift ;;
    esac
  done
  echo "$FORCE"
}

changed_services_from_git() {
  local last_sha curr_sha
  if [[ ! -d .git ]]; then echo "both"; return; fi
  curr_sha=$(git rev-parse HEAD 2>/dev/null || echo "")
  last_sha=$(cat .last_deploy_sha 2>/dev/null || echo "")
  if [[ -z "$curr_sha" ]]; then echo "both"; return; fi
  if [[ -z "$last_sha" || "$last_sha" == "$curr_sha" ]]; then
    # Unknown previous deploy or no change detected -> default to both
    echo "both"; return
  fi
  local files; files=$(git diff --name-only "$last_sha" "$curr_sha" || echo "")
  local need_backend="0" need_frontend="0"
  while read -r f; do
    [[ -z "$f" ]] && continue
    case "$f" in
      backend/*|Dockerfile.backend|requirements*.txt|pyproject.toml|alembic/*)
        need_backend="1" ;;
      frontend/*|Dockerfile.frontend|package*.json|vite.config.*|nginx*|docker-nginx*.conf)
        need_frontend="1" ;;
      docker-compose*.yml|docker-compose*.yaml)
        need_backend="1"; need_frontend="1" ;;
    esac
  done <<< "$files"
  if [[ "$need_backend" == "1" && "$need_frontend" == "1" ]]; then echo "both"; return; fi
  if [[ "$need_backend" == "1" ]]; then echo "backend"; return; fi
  if [[ "$need_frontend" == "1" ]]; then echo "frontend"; return; fi
  echo "none"
}

main() {
  require_file ".env"
  require_file "$COMPOSE_FILE"
  require_env_var "DOMAIN"
  require_env_var "FRONTEND_URL"

  local force; force=$(parse_args "$@")
  local scope="${force}"
  if [[ -z "$scope" ]]; then
    scope=$(changed_services_from_git)
  fi

  log "Deploy scope: ${scope}"

  if [[ "$scope" == "none" ]]; then
    ok "No relevant changes detected. Nothing to deploy."
    exit 0
  fi

  # Ensure network exists (idempotent)
  if ! docker network inspect traefik-net >/dev/null 2>&1; then
    log "Creating traefik-net network"
    docker network create traefik-net
  fi

  # Build and update per scope
  case "$scope" in
    backend)
      log "Building backend..."; "${DC[@]}" build backend
  log "Updating backend..."; "${DC[@]}" up -d --no-deps backend
  BACKEND_CONTAINER="$(detect_container_name backend)"
  wait_healthy "$BACKEND_CONTAINER" 120
      ;;
    frontend)
      log "Building frontend..."; "${DC[@]}" build frontend
  log "Updating frontend..."; "${DC[@]}" up -d --no-deps frontend
  # Give nginx a moment to start; rely on compose healthcheck
  FRONTEND_CONTAINER="$(detect_container_name frontend)"
  wait_healthy "$FRONTEND_CONTAINER" 120 || warn "Frontend health not healthy yet; check Traefik/health logs"
      ;;
    both)
      log "Building backend & frontend..."; "${DC[@]}" build backend frontend
  log "Updating backend first..."; "${DC[@]}" up -d --no-deps backend
  BACKEND_CONTAINER="$(detect_container_name backend)"
  wait_healthy "$BACKEND_CONTAINER" 120
      log "Updating frontend..."; "${DC[@]}" up -d --no-deps frontend
  FRONTEND_CONTAINER="$(detect_container_name frontend)"
  wait_healthy "$FRONTEND_CONTAINER" 120 || warn "Frontend health not healthy yet; check Traefik/health logs"
      ;;
  esac

  # Optional migrations (best-effort)
  if [[ "$scope" == "backend" || "$scope" == "both" ]]; then
    if "${DC[@]}" exec -T backend bash -lc "command -v alembic" >/dev/null 2>&1; then
      log "Running Alembic migrations (if any)"
      if ! "${DC[@]}" exec -T backend alembic upgrade head; then
        warn "Alembic migration failed or not configured. Skipping."
      fi
    else
      log "Alembic not found; running create_initial_data if present"
      if ! "${DC[@]}" exec -T backend python -m backend.main >/dev/null 2>&1; then
        : # ignore; project may handle init on startup
      fi
    fi
  fi

  # Record deployed commit (best-effort)
  if [[ -d .git ]]; then
    git rev-parse HEAD > .last_deploy_sha || true
  fi

  # Quick health via Traefik (best-effort)
  local domain; domain=$(grep '^DOMAIN=' .env | cut -d= -f2)
  if [[ -n "$domain" ]]; then
    log "Probing https://${domain} (frontend)"
    if curl -skI "https://${domain}" | head -n1 | grep -q "200"; then ok "Frontend 200 via Traefik"; else warn "Frontend probe did not return 200"; fi
    log "Probing https://${domain}/api/health"
    if curl -sk "https://${domain}/api/health" | grep -q '"status"'; then ok "Backend health OK via Traefik"; else warn "Backend health probe failed"; fi
  fi

  ok "Deploy complete."
}

main "$@"
