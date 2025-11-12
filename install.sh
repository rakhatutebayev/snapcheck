#!/bin/bash

# ════════════════════════════════════════════════════════════════════════════
# 🚀 ONE-COMMAND DEPLOYMENT FOR SNAPCHECK
# ════════════════════════════════════════════════════════════════════════════
# 
# Run this on your server:
# curl -sSL https://raw.githubusercontent.com/rakhatutebayev/snapcheck/main/install.sh | bash
#
# ════════════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/rakhatutebayev/snapcheck.git"
INSTALL_DIR="/opt/SnapCheck"
DOMAIN="${DOMAIN:-lms.it-uae.com}"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║      🚀 SNAPCHECK AUTO-DEPLOYMENT v2.0               ║"
echo "║                                                        ║"
echo "║      Domain: $DOMAIN                                  ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${YELLOW}⚠️  Running as root - OK${NC}"
   SUDO=""
else
   echo -e "${BLUE}ℹ️  Running as regular user - will use sudo${NC}"
   SUDO="sudo"
fi

# ════════════════════════════════════════════════════════════════════════════
# STEP 1: Install dependencies
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════"
echo "STEP 1/7: Installing dependencies"
echo "═══════════════════════════════════════════════════════"

echo "Updating package lists..."
$SUDO apt-get update -qq

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | $SUDO sh
    $SUDO usermod -aG docker $USER || true
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    $SUDO apt-get install -y docker-compose
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# Install Git
if ! command -v git &> /dev/null; then
    echo "Installing Git..."
    $SUDO apt-get install -y git
    echo -e "${GREEN}✅ Git installed${NC}"
else
    echo -e "${GREEN}✅ Git already installed${NC}"
fi

# ════════════════════════════════════════════════════════════════════════════
# STEP 2: Clone repository
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════"
echo "STEP 2/7: Getting latest code from GitHub"
echo "═══════════════════════════════════════════════════════"

if [ -d "$INSTALL_DIR/.git" ]; then
    echo "Repository exists, pulling latest changes..."
    cd "$INSTALL_DIR"
    $SUDO git fetch origin
    $SUDO git reset --hard origin/main
    $SUDO git pull origin main
    echo -e "${GREEN}✅ Code updated${NC}"
else
    echo "Cloning repository..."
    $SUDO rm -rf "$INSTALL_DIR"
    $SUDO git clone "$REPO_URL" "$INSTALL_DIR"
    echo -e "${GREEN}✅ Code cloned${NC}"
fi

cd "$INSTALL_DIR"

# ════════════════════════════════════════════════════════════════════════════
# STEP 3: Configure environment
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════"
echo "STEP 3/7: Configuring environment"
echo "═══════════════════════════════════════════════════════"

if [ ! -f .env ]; then
    echo "Creating .env file..."
    
    # Generate secure keys
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || openssl rand -base64 32)
    DB_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))" 2>/dev/null || openssl rand -base64 24)
    
    $SUDO tee .env > /dev/null << EOF
# SnapCheck Production Configuration
DOMAIN=$DOMAIN
SECRET_KEY=$SECRET_KEY
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_USER=snapcheck_user
POSTGRES_DB=snapcheck
DATABASE_URL=postgresql://snapcheck_user:$DB_PASSWORD@db:5432/snapcheck
ENVIRONMENT=production
ALLOWED_ORIGINS=https://$DOMAIN
FRONTEND_URL=https://$DOMAIN
ACME_EMAIL=admin@$DOMAIN
WORKERS=4
LOG_LEVEL=info
NODE_ENV=production
EOF
    
    $SUDO chmod 600 .env
    echo -e "${GREEN}✅ Environment configured${NC}"
else
    echo -e "${GREEN}✅ .env already exists${NC}"
fi

# ════════════════════════════════════════════════════════════════════════════
# STEP 4: Create Docker network
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════"
echo "STEP 4/7: Setting up Docker network"
echo "═══════════════════════════════════════════════════════"

if ! $SUDO docker network inspect traefik-net &> /dev/null; then
    echo "Creating traefik-net network..."
    $SUDO docker network create traefik-net
    echo -e "${GREEN}✅ Network created${NC}"
else
    echo -e "${GREEN}✅ Network already exists${NC}"
fi

# ════════════════════════════════════════════════════════════════════════════
# STEP 5: Build Docker images
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════"
echo "STEP 5/7: Building Docker images"
echo "═══════════════════════════════════════════════════════"
echo "⏳ This may take 5-10 minutes..."
echo ""

$SUDO docker-compose -f docker-compose-traefik.yml build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Images built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build images${NC}"
    exit 1
fi

# ════════════════════════════════════════════════════════════════════════════
# STEP 6: Start containers
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════"
echo "STEP 6/7: Starting containers"
echo "═══════════════════════════════════════════════════════"

$SUDO docker-compose -f docker-compose-traefik.yml up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Containers started${NC}"
else
    echo -e "${RED}❌ Failed to start containers${NC}"
    exit 1
fi

echo "⏳ Waiting for services to be ready (30 seconds)..."
sleep 30

# ════════════════════════════════════════════════════════════════════════════
# STEP 7: Initialize database and create admin
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════"
echo "STEP 7/7: Initializing database"
echo "═══════════════════════════════════════════════════════"

echo "Running migrations..."
$SUDO docker-compose -f docker-compose-traefik.yml exec -T backend \
    python -m backend.migrations.add_user_verification_fields 2>&1 | grep -v "already exists" || true

echo "Creating admin user..."
$SUDO docker-compose -f docker-compose-traefik.yml exec -T backend python << 'PYEOF' || true
from backend.database import SessionLocal
from backend.models import User
from backend.utils.security import hash_password

db = SessionLocal()
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
    print("✅ Admin user created")
else:
    print("ℹ️  Admin user already exists")

db.close()
PYEOF

# ════════════════════════════════════════════════════════════════════════════
# DEPLOYMENT COMPLETE
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║            ✅ DEPLOYMENT SUCCESSFUL! 🎉               ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Show container status
echo "═══════════════════════════════════════════════════════"
echo "📊 Container Status:"
echo "═══════════════════════════════════════════════════════"
$SUDO docker-compose -f docker-compose-traefik.yml ps
echo ""

# Test health
echo "═══════════════════════════════════════════════════════"
echo "🏥 Health Check:"
echo "═══════════════════════════════════════════════════════"

if $SUDO docker-compose -f docker-compose-traefik.yml exec -T backend curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend starting up (may need 1-2 more minutes)${NC}"
fi

if $SUDO docker-compose -f docker-compose-traefik.yml exec -T db pg_isready -U snapcheck_user > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Database starting up${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "🌐 YOUR APPLICATION IS READY!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Frontend:     https://$DOMAIN"
echo "API Health:   https://$DOMAIN/api/health"
echo "API Docs:     https://$DOMAIN/api/docs"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🔐 ADMIN CREDENTIALS"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Email:        admin@example.com"
echo "Password:     admin123"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Change password immediately after login!${NC}"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "📝 NEXT STEPS"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "1. Wait 2-3 minutes for SSL certificate (from Let's Encrypt)"
echo "2. Visit https://$DOMAIN"
echo "3. Login with credentials above"
echo "4. Change admin password"
echo "5. Configure email in Admin Panel → Email Settings"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🛠️  USEFUL COMMANDS"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "View logs:"
echo "  cd $INSTALL_DIR"
echo "  sudo docker-compose -f docker-compose-traefik.yml logs -f"
echo ""
echo "Restart services:"
echo "  sudo docker-compose -f docker-compose-traefik.yml restart"
echo ""
echo "Update from GitHub:"
echo "  cd $INSTALL_DIR"
echo "  sudo git pull origin main"
echo "  sudo docker-compose -f docker-compose-traefik.yml build"
echo "  sudo docker-compose -f docker-compose-traefik.yml up -d"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}🎉 Deployment complete! Enjoy SnapCheck!${NC}"
echo ""

exit 0
