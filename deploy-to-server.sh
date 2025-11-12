#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🚀 DEPLOY SNAPCHECK TO PRODUCTION SERVER
# ═══════════════════════════════════════════════════════════════
#
# Usage:
#   1. Upload this project to server: scp -r SnapCheck/ user@server:/opt/
#   2. SSH to server: ssh user@server
#   3. Run: cd /opt/SnapCheck && ./deploy-to-server.sh
#
# Or run remotely:
#   ssh user@server 'bash -s' < deploy-to-server.sh
#
# ═══════════════════════════════════════════════════════════════

set -e

# Prefer docker compose v2 if available, else fallback to docker-compose v1
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DC=(docker compose -f docker-compose-traefik.yml)
    echo -e "${GREEN}✅${NC} docker compose v2 detected"
else
    DC=(docker-compose -f docker-compose-traefik.yml)
fi

echo "╔════════════════════════════════════════════════════════╗"
echo "║        🚀 SNAPCHECK PRODUCTION DEPLOYMENT             ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ═══════════════════════════════════════════════════════════════
# STEP 1: VERIFY ENVIRONMENT
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════"
echo "STEP 1: Verify Environment"
echo "═══════════════════════════════════════════════════════"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found! Creating a minimal one...${NC}"
    SEC_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    DB_PASS=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")
    cat > .env << EOF
DOMAIN=${DOMAIN:-lms.it-uae.com}
FRONTEND_URL=https://${DOMAIN:-lms.it-uae.com}
ENVIRONMENT=production
SECRET_KEY=$SEC_KEY
POSTGRES_DB=snapcheck
POSTGRES_USER=snapcheck_user
POSTGRES_PASSWORD=$DB_PASS
DATABASE_URL=postgresql://snapcheck_user:$DB_PASS@db:5432/snapcheck
LOG_LEVEL=info
WORKERS=4
ACCESS_TOKEN_EXPIRE_MINUTES=60
NODE_ENV=production
ACME_EMAIL=admin@${DOMAIN:-lms.it-uae.com}
EOF
    chmod 600 .env
    echo -e "${GREEN}✅ Minimal .env created${NC}"
fi

echo -e "${GREEN}✅${NC} .env file found"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not installed${NC}"
    echo "Install Docker: curl -fsSL https://get.docker.com | sh"
    exit 1
fi
echo -e "${GREEN}✅${NC} Docker installed"

# Check Docker Compose
if ! ( command -v docker-compose &> /dev/null || docker compose version &> /dev/null ); then
    echo -e "${RED}❌ Docker Compose not installed${NC}"
    echo "Install docker compose v2 plugin (recommended). See DEPLOYMENT_PARTIAL_ROLLING.md"
    exit 1
fi
echo -e "${GREEN}✅${NC} Docker Compose available"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon not running${NC}"
    echo "Start Docker: sudo systemctl start docker"
    exit 1
fi
echo -e "${GREEN}✅${NC} Docker running"

# Check ports
if sudo ss -tlnp | grep -q ":80 " && ! docker ps | grep -q traefik; then
    echo -e "${YELLOW}⚠️  Port 80 is in use (might be nginx/apache)${NC}"
    echo "You may need to stop it: sudo systemctl stop nginx"
fi

if sudo ss -tlnp | grep -q ":443 " && ! docker ps | grep -q traefik; then
    echo -e "${YELLOW}⚠️  Port 443 is in use${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 2: CREATE TRAEFIK NETWORK
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════"
echo "STEP 2: Create Docker Network"
echo "═══════════════════════════════════════════════════════"

if docker network inspect traefik-net &> /dev/null; then
    echo -e "${GREEN}✅${NC} traefik-net network already exists"
else
    echo "Creating traefik-net network..."
    docker network create traefik-net
    echo -e "${GREEN}✅${NC} traefik-net network created"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 3: BUILD DOCKER IMAGES
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════"
echo "STEP 3: Build Docker Images"
echo "═══════════════════════════════════════════════════════"
echo "This may take 5-10 minutes on first build..."
echo ""

"${DC[@]}" build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅${NC} Docker images built successfully"
else
    echo -e "${RED}❌ Failed to build Docker images${NC}"
    exit 1
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 4: START CONTAINERS
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════"
echo "STEP 4: Start Docker Containers"
echo "═══════════════════════════════════════════════════════"

"${DC[@]}" up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅${NC} Containers started successfully"
else
    echo -e "${RED}❌ Failed to start containers${NC}"
    exit 1
fi

echo ""
echo "⏳ Waiting for containers to be ready (30 seconds)..."
sleep 30

echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 5: CHECK CONTAINER STATUS
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════"
echo "STEP 5: Container Status"
echo "═══════════════════════════════════════════════════════"

"${DC[@]}" ps

echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 6: RUN DATABASE MIGRATIONS
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════"
echo "STEP 6: Run Database Migrations"
echo "═══════════════════════════════════════════════════════"

"${DC[@]}" exec -T backend python -m backend.migrations.add_user_verification_fields

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅${NC} Database migrations completed"
else
    echo -e "${YELLOW}⚠️  Migrations may have already run${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 7: CREATE ADMIN USER
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════"
echo "STEP 7: Create Admin User"
echo "═══════════════════════════════════════════════════════"

docker-compose -f docker-compose-traefik.yml exec -T backend python << 'PYEOF'
from backend.database import SessionLocal
from backend.models import User
from backend.utils.security import hash_password

db = SessionLocal()

# Check if admin exists
admin = db.query(User).filter(User.email == "admin@example.com").first()

if not admin:
    admin = User(
        first_name="Admin",
        last_name="User",
        email="admin@example.com",
        password_hash=hash_password("admin123"),
        role="admin",
        is_verified=True
    )
    db.add(admin)
    db.commit()
    print("✅ Admin user created!")
    print("   Email: admin@example.com")
    print("   Password: admin123")
    print("   ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!")
else:
    print("ℹ️  Admin user already exists")

db.close()
PYEOF

echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 8: HEALTH CHECK
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════"
echo "STEP 8: Health Check"
echo "═══════════════════════════════════════════════════════"

echo "Checking backend health..."
if "${DC[@]}" exec -T backend curl -sf http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✅${NC} Backend is healthy"
else
    echo -e "${YELLOW}⚠️  Backend not responding yet (may need more time)${NC}"
fi

echo ""
echo "Checking database..."
if "${DC[@]}" exec -T db pg_isready -U snapcheck_user > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Database is healthy"
else
    echo -e "${YELLOW}⚠️  Database not ready yet${NC}"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# DEPLOYMENT COMPLETE
# ═══════════════════════════════════════════════════════════════

# Get domain from .env
DOMAIN=$(grep "^DOMAIN=" .env | cut -d'=' -f2)

echo "╔════════════════════════════════════════════════════════╗"
echo "║            ✅ DEPLOYMENT COMPLETED                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 SnapCheck is now deployed!"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "📋 ACCESS INFORMATION"
echo "═══════════════════════════════════════════════════════"
echo "Frontend:     https://${DOMAIN}"
echo "API Health:   https://${DOMAIN}/api/health"
echo "API Docs:     https://${DOMAIN}/api/docs"
echo ""
echo "🔐 Admin Credentials:"
echo "   Email:    admin@example.com"
echo "   Password: admin123"
echo "   ⚠️  CHANGE PASSWORD IMMEDIATELY AFTER LOGIN!"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "📊 USEFUL COMMANDS"
echo "═══════════════════════════════════════════════════════"
echo "View logs:         ${DC[*]} logs -f"
echo "View backend logs: ${DC[*]} logs -f backend"
echo "Container status:  ${DC[*]} ps"
echo "Restart:           ${DC[*]} restart"
echo "Stop:              ${DC[*]} stop"
echo "Start:             ${DC[*]} start"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "⏭️  NEXT STEPS"
echo "═══════════════════════════════════════════════════════"
echo "1. Verify DNS points to this server:"
echo "   nslookup ${DOMAIN}"
echo ""
echo "2. Wait for SSL certificate (1-2 minutes):"
echo "   docker logs traefik 2>&1 | grep -i certificate"
echo ""
echo "3. Test the application:"
echo "   curl https://${DOMAIN}/api/health"
echo ""
echo "4. Login and configure email settings in Admin Panel"
echo ""
echo "5. Change admin password!"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🆘 TROUBLESHOOTING"
echo "═══════════════════════════════════════════════════════"
echo "If site not accessible:"
echo "  • Check logs: docker-compose -f docker-compose-traefik.yml logs"
echo "  • Check DNS: dig ${DOMAIN}"
echo "  • Check Traefik: docker logs traefik"
echo "  • Verify ports: sudo ss -tlnp | grep -E ':(80|443)'"
echo ""
echo "If SSL not working:"
echo "  • Check Traefik logs: docker logs traefik 2>&1 | grep -i error"
echo "  • Verify domain points to server IP"
echo "  • Check .env has correct DOMAIN value"
echo ""

exit 0
