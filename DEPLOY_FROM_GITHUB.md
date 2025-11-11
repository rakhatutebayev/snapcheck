# 🚀 DEPLOY FROM GITHUB - Quick Guide

## ✅ Git Commit Status

**Commit:** `14a96c7`  
**Message:** Production ready: English UI/emails, email verification, password reset, deployment configs  
**Status:** ✅ Pushed to GitHub  
**Repository:** https://github.com/rakhatutebayev/snapcheck

---

## 📦 What's in the Commit

### Changes (26 files, 3089 insertions, 122 deletions)

**New Features:**
- ✅ Email verification flow with database migrations
- ✅ Password reset functionality (forgot/reset pages)
- ✅ Email notification system with admin recipients

**Translation:**
- ✅ All UI converted to English (Login, Register, Admin Panel, Slides, Email Settings)
- ✅ All email templates in English (verification, reset, notifications)

**Configuration:**
- ✅ `DEFAULT_SENDER_NAME` constant for easy customization
- ✅ Production `.env` template for lms.it-uae.com
- ✅ Secure SECRET_KEY and DB_PASSWORD generation

**Deployment:**
- ✅ `deploy-to-server.sh` - automated deployment script
- ✅ `deploy-from-github.sh` - deploy directly from GitHub
- ✅ Comprehensive deployment documentation
- ✅ Docker + Traefik configuration ready

---

## 🎯 Deploy to Production - ONE COMMAND

### Method 1: Deploy from GitHub (Recommended)

SSH to your server and run:

```bash
bash <(curl -s https://raw.githubusercontent.com/rakhatutebayev/snapcheck/main/deploy-from-github.sh)
```

**What it does:**
1. ✅ Clones/updates repository from GitHub
2. ✅ Creates .env with secure keys if missing
3. ✅ Runs automated deployment script
4. ✅ Sets up Docker containers
5. ✅ Runs database migrations
6. ✅ Creates admin user
7. ✅ Performs health checks

**Time:** ~10 minutes

---

### Method 2: Manual Deployment

```bash
# SSH to server
ssh user@your-server

# Clone repository
sudo git clone https://github.com/rakhatutebayev/snapcheck.git /opt/SlideConfirm
cd /opt/SlideConfirm

# Create .env file (or copy from template)
sudo nano .env
# Add required values:
# - DOMAIN=lms.it-uae.com
# - SECRET_KEY=<generate with: python3 -c "import secrets; print(secrets.token_urlsafe(32))">
# - POSTGRES_PASSWORD=<secure password>
# - DATABASE_URL=postgresql://snapcheck_user:<password>@db:5432/snapcheck
# - FRONTEND_URL=https://lms.it-uae.com

# Run deployment
sudo ./deploy-to-server.sh
```

---

## 🔍 Verify Deployment

### Check Container Status
```bash
cd /opt/SlideConfirm
docker-compose -f docker-compose-traefik.yml ps
```

Expected: All containers show "Up (healthy)"

### Test Backend
```bash
curl https://lms.it-uae.com/api/health
```

Expected: `{"status":"healthy"}`

### Test Frontend
```bash
curl -I https://lms.it-uae.com
```

Expected: `200 OK`

### Browser Test
1. Open: https://lms.it-uae.com
2. Should see login page in English
3. Login: admin@example.com / admin123
4. **Change password immediately!**

---

## 📧 Configure Email After Deployment

1. Login to Admin Panel
2. Click "Email Settings"
3. Choose provider (Gmail/Office365/Yandex)
4. Enter SMTP credentials
5. Configure sender name (default: "Training System")
6. Add notification recipients
7. Send test email

---

## 🔄 Update Deployment

To deploy new changes:

```bash
# SSH to server
ssh user@your-server
cd /opt/SlideConfirm

# Pull latest changes
sudo git pull origin main

# Rebuild and restart
docker-compose -f docker-compose-traefik.yml build
docker-compose -f docker-compose-traefik.yml up -d

# Run migrations if needed
docker-compose -f docker-compose-traefik.yml exec backend \
  python -m backend.migrations.add_user_verification_fields
```

Or simply run the GitHub deploy script again:
```bash
bash <(curl -s https://raw.githubusercontent.com/rakhatutebayev/snapcheck/main/deploy-from-github.sh)
```

---

## 📊 Deployment URLs

### GitHub Repository
https://github.com/rakhatutebayev/snapcheck

### Production URLs
- **Frontend:** https://lms.it-uae.com
- **API:** https://lms.it-uae.com/api/health
- **API Docs:** https://lms.it-uae.com/api/docs

### Deployment Scripts
- **GitHub Deploy:** https://raw.githubusercontent.com/rakhatutebayev/snapcheck/main/deploy-from-github.sh
- **Server Deploy:** `/opt/SlideConfirm/deploy-to-server.sh`

---

## 🆘 Troubleshooting

### View Logs
```bash
cd /opt/SlideConfirm
docker-compose -f docker-compose-traefik.yml logs -f backend
```

### Restart Services
```bash
docker-compose -f docker-compose-traefik.yml restart
```

### Check Git Status
```bash
cd /opt/SlideConfirm
git status
git log --oneline -5
```

### Rebuild from Scratch
```bash
cd /opt/SlideConfirm
docker-compose -f docker-compose-traefik.yml down
docker-compose -f docker-compose-traefik.yml build --no-cache
docker-compose -f docker-compose-traefik.yml up -d
```

---

## 📚 Documentation

- **DEPLOY_TO_PRODUCTION.md** - Complete deployment guide
- **READY_FOR_DEPLOYMENT.md** - Status summary
- **DEPLOYMENT_GUIDE.md** - Step-by-step manual deployment

---

## ✅ Success Checklist

After deployment:

- [ ] Containers running and healthy
- [ ] Backend health check passes
- [ ] Frontend loads in browser
- [ ] Can login with admin credentials
- [ ] Admin Panel accessible
- [ ] Email Settings page loads
- [ ] SSL certificate valid
- [ ] All UI in English
- [ ] Changed admin password
- [ ] Email configured and tested

---

## 🎉 Ready to Deploy!

**Latest commit:** `14a96c7` (Production ready)  
**Repository:** https://github.com/rakhatutebayev/snapcheck  
**Status:** ✅ All changes committed and pushed

**Next step:** SSH to server and run:

```bash
bash <(curl -s https://raw.githubusercontent.com/rakhatutebayev/snapcheck/main/deploy-from-github.sh)
```

**Time required:** ~10 minutes

**Good luck! 🚀**
