#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🚀 DEPLOY FROM GITHUB TO PRODUCTION
# ═══════════════════════════════════════════════════════════════
#
# This script pulls latest code from GitHub and deploys to production
#
# Usage:
#   1. SSH to your server
#   2. Run: bash <(curl -s https://raw.githubusercontent.com/rakhatutebayev/snapcheck/main/deploy-from-github.sh)
#
# ═══════════════════════════════════════════════════════════════

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

INSTALL_DIR="/opt/SlideConfirm"
GITHUB_REPO="https://github.com/rakhatutebayev/snapcheck.git"

echo "╔════════════════════════════════════════════════════════╗"
echo "║     🚀 DEPLOY SNAPCHECK FROM GITHUB                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 1: CHECK PREREQUISITES
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════"
echo "STEP 1: Check Prerequisites"
echo "═══════════════════════════════════════════════════════"

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not installed${NC}"
    echo "Install: sudo apt install git"
    exit 1
fi
echo -e "${GREEN}✅${NC} Git installed"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not installed${NC}"
    echo "Install: curl -fsSL https://get.docker.com | sh"
    exit 1
fi
echo -e "${GREEN}✅${NC} Docker installed"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not installed${NC}"
    echo "Install: sudo apt install docker-compose"
    exit 1
fi
echo -e "${GREEN}✅${NC} Docker Compose installed"

echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 2: CLONE OR UPDATE REPOSITORY
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════"
echo "STEP 2: Clone/Update Repository"
echo "═══════════════════════════════════════════════════════"

if [ -d "$INSTALL_DIR/.git" ]; then
    echo "Repository exists, pulling latest changes..."
    cd "$INSTALL_DIR"
    sudo git fetch origin
    sudo git reset --hard origin/main
    echo -e "${GREEN}✅${NC} Repository updated"
else
    echo "Cloning repository..."
    sudo mkdir -p "$(dirname "$INSTALL_DIR")"
    sudo git clone "$GITHUB_REPO" "$INSTALL_DIR"
    echo -e "${GREEN}✅${NC} Repository cloned"
fi

cd "$INSTALL_DIR"
echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 3: CHECK .ENV FILE
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════"
echo "STEP 3: Check Environment Configuration"
echo "═══════════════════════════════════════════════════════"

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo ""
    echo "Creating .env file from template..."
    
    # Generate secure keys
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    DB_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")
    
    sudo tee .env > /dev/null << EOF
# SnapCheck Production Configuration
# Generated: $(date '+%Y-%m-%d %H:%M:%S')

# Security
SECRET_KEY=$SECRET_KEY
POSTGRES_PASSWORD=$DB_PASSWORD

# Database
POSTGRES_USER=snapcheck_user
POSTGRES_DB=snapcheck
DATABASE_URL=postgresql://snapcheck_user:$DB_PASSWORD@db:5432/snapcheck

# Domain Configuration
DOMAIN=lms.it-uae.com
ENVIRONMENT=production
ALLOWED_ORIGINS=https://lms.it-uae.com
FRONTEND_URL=https://lms.it-uae.com

# Email for Let's Encrypt
ACME_EMAIL=admin@lms.it-uae.com

# Optional Settings
WORKERS=4
LOG_LEVEL=info
ACCESS_TOKEN_EXPIRE_MINUTES=60
NODE_ENV=production
EOF

    sudo chmod 600 .env
    echo -e "${GREEN}✅${NC} .env file created with secure keys"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Review and update .env if needed!${NC}"
    echo ""
else
    echo -e "${GREEN}✅${NC} .env file exists"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 4: RUN DEPLOYMENT SCRIPT
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════"
echo "STEP 4: Run Deployment Script"
echo "═══════════════════════════════════════════════════════"

if [ -f deploy-to-server.sh ]; then
    chmod +x deploy-to-server.sh
    echo "Executing deployment script..."
    echo ""
    sudo ./deploy-to-server.sh
else
    echo -e "${RED}❌ deploy-to-server.sh not found${NC}"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║         ✅ DEPLOYMENT FROM GITHUB COMPLETE             ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 SnapCheck deployed from GitHub!"
echo ""
echo "Access your application:"
echo "  Frontend: https://lms.it-uae.com"
echo "  API:      https://lms.it-uae.com/api/health"
echo ""
echo "Default admin credentials:"
echo "  Email:    admin@example.com"
echo "  Password: admin123"
echo "  ⚠️  CHANGE PASSWORD IMMEDIATELY!"
echo ""

exit 0
