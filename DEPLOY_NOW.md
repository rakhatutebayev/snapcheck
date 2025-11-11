# 🚀 SnapCheck - Quick Deployment Guide

## ✅ Pre-Deployment Status

- ✅ All UI strings converted to English
- ✅ All email templates converted to English  
- ✅ Frontend production build ready (`frontend/dist/`)
- ✅ Backend configured and tested
- ✅ Environment file configured for lms.it-uae.com
- ✅ Deployment scripts ready

## 📦 What You Have

### Production-Ready Files
```
SlideConfirm/
├── .env                           # ✅ Configured for lms.it-uae.com
├── frontend/dist/                 # ✅ Production build ready
├── docker-compose-traefik.yml     # ✅ Docker configuration
├── Dockerfile.backend             # ✅ Backend image
├── Dockerfile.frontend            # ✅ Frontend image
└── deploy-to-server.sh            # ✅ Automated deployment script
```

### Environment Configuration (.env)
```bash
DOMAIN=lms.it-uae.com
FRONTEND_URL=https://lms.it-uae.com
DATABASE_URL=postgresql://snapcheck_user:***@db:5432/snapcheck
SECRET_KEY=*** (32+ chars, cryptographically secure)
POSTGRES_PASSWORD=*** (secure)
ENVIRONMENT=production
```

## 🎯 Deployment Options

### Option 1: Automated Deployment (Recommended)

**Upload project to server and run the automated script:**

```bash
# 1. Upload project to your server
scp -r SlideConfirm/ user@your-server:/opt/

# 2. SSH to server
ssh user@your-server

# 3. Run deployment script
cd /opt/SlideConfirm
sudo ./deploy-to-server.sh
```

**What it does:**
- ✅ Verifies Docker is installed and running
- ✅ Creates traefik-net network
- ✅ Builds Docker images (backend, frontend, database)
- ✅ Starts all containers with docker-compose
- ✅ Runs database migrations
- ✅ Creates admin user (admin@example.com / admin123)
- ✅ Performs health checks
- ✅ Shows access information and next steps

**Time:** ~10 minutes (mostly waiting for Docker build)

---

### Option 2: Manual Deployment

**Step-by-step deployment:**

```bash
# 1. Upload project
scp -r SlideConfirm/ user@server:/opt/

# 2. SSH to server
ssh user@server
cd /opt/SlideConfirm

# 3. Verify .env is configured
cat .env | grep -E "^(DOMAIN|SECRET_KEY|POSTGRES_PASSWORD|FRONTEND_URL)="

# 4. Create Docker network
docker network create traefik-net

# 5. Build images
docker-compose -f docker-compose-traefik.yml build

# 6. Start containers
docker-compose -f docker-compose-traefik.yml up -d

# 7. Wait 30 seconds for startup
sleep 30

# 8. Check container status
docker-compose -f docker-compose-traefik.yml ps

# 9. Run migrations
docker-compose -f docker-compose-traefik.yml exec backend \
    python -m backend.migrations.add_user_verification_fields

# 10. Create admin user
docker-compose -f docker-compose-traefik.yml exec backend python << 'EOF'
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
    print("✅ Admin created: admin@example.com / admin123")
else:
    print("Admin already exists")

db.close()
EOF

# 11. Health check
curl http://localhost:8000/health
```

---

### Option 3: Local Docker Testing (Mac)

**Test deployment locally before uploading to server:**

```bash
# 1. Start Docker Desktop on Mac

# 2. Create network
docker network create traefik-net

# 3. Build and start
cd /Users/rakhat/Documents/webhosting/SlideConfirm
docker-compose -f docker-compose-traefik.yml build
docker-compose -f docker-compose-traefik.yml up -d

# 4. Run migrations and create admin
docker-compose -f docker-compose-traefik.yml exec backend \
    python -m backend.migrations.add_user_verification_fields

docker-compose -f docker-compose-traefik.yml exec backend python << 'EOF'
from backend.database import SessionLocal
from backend.models import User
from backend.utils.security import hash_password

db = SessionLocal()
admin = db.query(User).filter(User.email == "admin@example.com").first()
if not admin:
    admin = User(first_name="Admin", last_name="User", 
                 email="admin@example.com", 
                 password_hash=hash_password("admin123"),
                 role="admin", is_verified=True)
    db.add(admin)
    db.commit()
    print("Admin created")
db.close()
EOF

# 5. Test
curl http://localhost:8000/health
```

---

## 🔍 Verification Checklist

After deployment, verify:

```bash
# 1. Check DNS
nslookup lms.it-uae.com
# Should point to your server IP

# 2. Check containers
docker-compose -f docker-compose-traefik.yml ps
# All should be "Up" and "healthy"

# 3. Check backend health
curl https://lms.it-uae.com/api/health
# Should return: {"status":"healthy"}

# 4. Check frontend
curl -I https://lms.it-uae.com
# Should return: 200 OK

# 5. Test login page
open https://lms.it-uae.com
# Should load login page in English

# 6. Login as admin
# Email: admin@example.com
# Password: admin123
```

---

## 📊 Useful Commands

### Container Management
```bash
# View all logs
docker-compose -f docker-compose-traefik.yml logs -f

# View backend logs only
docker-compose -f docker-compose-traefik.yml logs -f backend

# View frontend logs only
docker-compose -f docker-compose-traefik.yml logs -f frontend

# View database logs
docker-compose -f docker-compose-traefik.yml logs -f db

# Check container status
docker-compose -f docker-compose-traefik.yml ps

# Restart all services
docker-compose -f docker-compose-traefik.yml restart

# Restart specific service
docker-compose -f docker-compose-traefik.yml restart backend

# Stop all
docker-compose -f docker-compose-traefik.yml stop

# Start all
docker-compose -f docker-compose-traefik.yml start

# Remove all (careful!)
docker-compose -f docker-compose-traefik.yml down
```

### Database Management
```bash
# Connect to database
docker-compose -f docker-compose-traefik.yml exec db \
    psql -U snapcheck_user -d snapcheck

# Backup database
docker-compose -f docker-compose-traefik.yml exec db \
    pg_dump -U snapcheck_user snapcheck > backup.sql

# Restore database
cat backup.sql | docker-compose -f docker-compose-traefik.yml exec -T db \
    psql -U snapcheck_user snapcheck
```

### Debugging
```bash
# Execute commands in backend container
docker-compose -f docker-compose-traefik.yml exec backend bash

# Check backend Python environment
docker-compose -f docker-compose-traefik.yml exec backend python --version

# Check backend dependencies
docker-compose -f docker-compose-traefik.yml exec backend pip list

# Test backend from inside container
docker-compose -f docker-compose-traefik.yml exec backend \
    curl http://localhost:8000/health
```

---

## 🆘 Troubleshooting

### Issue: Containers won't start

```bash
# Check Docker daemon
sudo systemctl status docker

# Check logs
docker-compose -f docker-compose-traefik.yml logs

# Check port conflicts
sudo ss -tlnp | grep -E ':(80|443|5432|8000)'

# Remove and rebuild
docker-compose -f docker-compose-traefik.yml down
docker-compose -f docker-compose-traefik.yml build --no-cache
docker-compose -f docker-compose-traefik.yml up -d
```

### Issue: SSL certificate not working

```bash
# Check Traefik logs
docker logs traefik 2>&1 | grep -i certificate

# Verify DNS
dig lms.it-uae.com

# Check .env DOMAIN value
grep DOMAIN= .env

# Restart Traefik
docker restart traefik
```

### Issue: Backend not responding

```bash
# Check backend logs
docker-compose -f docker-compose-traefik.yml logs backend

# Check if backend is running
docker-compose -f docker-compose-traefik.yml ps backend

# Restart backend
docker-compose -f docker-compose-traefik.yml restart backend

# Check backend health from inside container
docker-compose -f docker-compose-traefik.yml exec backend \
    curl http://localhost:8000/health
```

### Issue: Database connection errors

```bash
# Check database is running
docker-compose -f docker-compose-traefik.yml ps db

# Check database logs
docker-compose -f docker-compose-traefik.yml logs db

# Test database connection
docker-compose -f docker-compose-traefik.yml exec db \
    pg_isready -U snapcheck_user

# Verify DATABASE_URL in .env
grep DATABASE_URL= .env
```

### Issue: Frontend showing old version

```bash
# Rebuild frontend
docker-compose -f docker-compose-traefik.yml build frontend

# Restart frontend
docker-compose -f docker-compose-traefik.yml restart frontend

# Clear browser cache and refresh
# Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

---

## 🔐 Security Checklist

After deployment:

- [ ] Change admin password (admin@example.com / admin123)
- [ ] Set `.env` file permissions: `chmod 600 .env`
- [ ] Configure email settings in Admin Panel
- [ ] Test email verification flow
- [ ] Test password reset flow
- [ ] Enable firewall: `sudo ufw enable`
- [ ] Allow HTTP/HTTPS: `sudo ufw allow 80,443/tcp`
- [ ] Set up automated backups
- [ ] Monitor logs regularly
- [ ] Update DNS TTL to reasonable value (3600)

---

## 📚 Additional Resources

- **Full Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Docker Traefik Installation:** `DOCKER_TRAEFIK_INSTALLATION.md`
- **Docker Quick Start:** `DOCKER_TRAEFIK_QUICK_START.md`
- **Troubleshooting:** Check container logs first

---

## ⚡ Quick Deploy Commands (Copy-Paste Ready)

**Upload and deploy in one command:**
```bash
# Replace 'user' and 'your-server' with your values
scp -r SlideConfirm/ user@your-server:/opt/ && \
ssh user@your-server "cd /opt/SlideConfirm && sudo ./deploy-to-server.sh"
```

**Check deployment status:**
```bash
ssh user@your-server "cd /opt/SlideConfirm && docker-compose -f docker-compose-traefik.yml ps"
```

**View live logs:**
```bash
ssh user@your-server "cd /opt/SlideConfirm && docker-compose -f docker-compose-traefik.yml logs -f"
```

---

## 🎉 Success Criteria

Deployment is successful when:

1. ✅ `docker-compose ps` shows all containers healthy
2. ✅ `curl https://lms.it-uae.com/api/health` returns `{"status":"healthy"}`
3. ✅ https://lms.it-uae.com loads login page in English
4. ✅ Can login with admin@example.com / admin123
5. ✅ Admin Panel loads and shows all features in English
6. ✅ Can create presentations and upload PPTX files
7. ✅ Email settings page accessible in Admin Panel
8. ✅ SSL certificate is valid (green padlock in browser)

---

**Need help?** Check the logs:
```bash
docker-compose -f docker-compose-traefik.yml logs -f backend
```
