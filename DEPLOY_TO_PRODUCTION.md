# 🚀 DEPLOY TO PRODUCTION - lms.it-uae.com

## ✅ Pre-Deployment Checklist

- ✅ All UI strings in English
- ✅ All email templates in English
- ✅ Frontend production build ready (`frontend/dist/`)
- ✅ `.env` configured for lms.it-uae.com
- ✅ Backend tested and working
- ✅ Database migrations ready
- ✅ Email sender name: "Training System" (configurable via constant)

---

## 🎯 Deployment Method: Docker + Traefik

Your project is configured to deploy with:
- **Domain:** lms.it-uae.com
- **Frontend:** Nginx serving React build
- **Backend:** FastAPI with Uvicorn
- **Database:** PostgreSQL
- **Reverse Proxy:** Traefik (with auto SSL)

---

## 📦 STEP 1: Upload Project to Server

```bash
# Upload entire project to server
scp -r /Users/rakhat/Documents/webhosting/SlideConfirm/ user@your-server:/opt/

# OR use rsync for faster sync (excludes node_modules, .git)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '__pycache__' \
  /Users/rakhat/Documents/webhosting/SlideConfirm/ \
  user@your-server:/opt/SlideConfirm/
```

---

## 🔧 STEP 2: SSH to Server and Run Deployment

```bash
# SSH to your server
ssh user@your-server

# Navigate to project
cd /opt/SlideConfirm

# Run automated deployment script
sudo ./deploy-to-server.sh
```

**The script will automatically:**
1. ✅ Check Docker installation
2. ✅ Create `traefik-net` network
3. ✅ Build Docker images (backend, frontend, database)
4. ✅ Start all containers
5. ✅ Run database migrations
6. ✅ Create admin user
7. ✅ Perform health checks

**Time:** ~10 minutes

---

## 📋 STEP 3: Verify Deployment

```bash
# Check container status
docker-compose -f docker-compose-traefik.yml ps

# All should show "Up" and "healthy"
```

**Expected output:**
```
NAME                      STATUS
slideconfirm-backend      Up (healthy)
slideconfirm-frontend     Up (healthy)
slideconfirm-db           Up (healthy)
```

---

## 🌐 STEP 4: Test Your Application

### Frontend
```bash
# Test frontend
curl -I https://lms.it-uae.com

# Should return: 200 OK
```

### Backend API
```bash
# Test backend health
curl https://lms.it-uae.com/api/health

# Should return: {"status":"healthy"}
```

### Browser Test
1. Open: https://lms.it-uae.com
2. Should see login page in English
3. Login with:
   - Email: `admin@example.com`
   - Password: `admin123`
4. **⚠️ CHANGE PASSWORD IMMEDIATELY!**

---

## 📧 STEP 5: Configure Email Settings

1. Login to Admin Panel
2. Click "Email Settings" in sidebar
3. Choose email provider:
   - **Gmail:** Use App Password from https://myaccount.google.com/apppasswords
   - **Office 365:** Enable SMTP AUTH + use App Password
   - **Yandex:** Use email password
4. Enter SMTP credentials
5. Click "Save Settings"
6. Send test email to verify

---

## 🔍 Monitoring & Logs

### View Logs
```bash
# All services
docker-compose -f docker-compose-traefik.yml logs -f

# Backend only
docker-compose -f docker-compose-traefik.yml logs -f backend

# Frontend only
docker-compose -f docker-compose-traefik.yml logs -f frontend

# Database only
docker-compose -f docker-compose-traefik.yml logs -f db
```

### Container Management
```bash
# Restart all services
docker-compose -f docker-compose-traefik.yml restart

# Restart specific service
docker-compose -f docker-compose-traefik.yml restart backend

# Stop all
docker-compose -f docker-compose-traefik.yml stop

# Start all
docker-compose -f docker-compose-traefik.yml start
```

---

## 🆘 Troubleshooting

### Issue: Containers not starting

```bash
# Check logs
docker-compose -f docker-compose-traefik.yml logs

# Check Docker daemon
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker
```

### Issue: SSL certificate not working

```bash
# Check Traefik logs
docker logs traefik 2>&1 | grep -i certificate

# Verify DNS
nslookup lms.it-uae.com

# Should point to your server IP
```

### Issue: Backend errors

```bash
# Check backend logs
docker-compose -f docker-compose-traefik.yml logs backend

# Restart backend
docker-compose -f docker-compose-traefik.yml restart backend

# Check database connection
docker-compose -f docker-compose-traefik.yml exec backend \
  python -c "from backend.database import engine; engine.connect()"
```

### Issue: Database connection errors

```bash
# Check database status
docker-compose -f docker-compose-traefik.yml exec db \
  pg_isready -U snapcheck_user

# Check database logs
docker-compose -f docker-compose-traefik.yml logs db

# Verify .env DATABASE_URL
grep DATABASE_URL .env
```

---

## 🔒 Security Checklist

After deployment:

- [ ] Change admin password (admin@example.com)
- [ ] Set `.env` file permissions: `chmod 600 .env`
- [ ] Configure email settings in Admin Panel
- [ ] Test email verification flow
- [ ] Test password reset flow
- [ ] Enable firewall: `sudo ufw enable`
- [ ] Allow HTTP/HTTPS: `sudo ufw allow 80,443/tcp`
- [ ] Set up automated backups
- [ ] Monitor logs regularly
- [ ] Update DNS TTL if needed

---

## 💾 Database Backup

### Create Backup
```bash
# Manual backup
docker-compose -f docker-compose-traefik.yml exec db \
  pg_dump -U snapcheck_user snapcheck > backup_$(date +%Y%m%d).sql

# Compress backup
gzip backup_$(date +%Y%m%d).sql
```

### Restore Backup
```bash
# Decompress
gunzip backup_20241112.sql.gz

# Restore
cat backup_20241112.sql | docker-compose -f docker-compose-traefik.yml exec -T db \
  psql -U snapcheck_user snapcheck
```

### Automated Backups (Cron)
```bash
# Add to crontab (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * cd /opt/SlideConfirm && docker-compose -f docker-compose-traefik.yml exec -T db pg_dump -U snapcheck_user snapcheck | gzip > /opt/backups/snapcheck_$(date +\%Y\%m\%d).sql.gz
```

---

## 🔄 Update Deployment

### Update Code
```bash
# SSH to server
ssh user@your-server
cd /opt/SlideConfirm

# Pull latest changes (if using git)
git pull origin main

# Or upload new files
# scp -r local_files/ user@server:/opt/SlideConfirm/

# Rebuild and restart
docker-compose -f docker-compose-traefik.yml build
docker-compose -f docker-compose-traefik.yml up -d

# Run migrations if needed
docker-compose -f docker-compose-traefik.yml exec backend \
  python -m backend.migrations.add_user_verification_fields
```

---

## 📊 Production Status

### Current Configuration
- **Domain:** lms.it-uae.com
- **Frontend URL:** https://lms.it-uae.com
- **API URL:** https://lms.it-uae.com/api
- **Database:** PostgreSQL (snapcheck_user/snapcheck)
- **Email Sender:** Training System (configurable)
- **Admin User:** admin@example.com / admin123

### Environment Variables (.env)
```bash
DOMAIN=lms.it-uae.com
FRONTEND_URL=https://lms.it-uae.com
DATABASE_URL=postgresql://snapcheck_user:***@db:5432/snapcheck
SECRET_KEY=*** (32+ chars)
POSTGRES_PASSWORD=*** (secure)
ENVIRONMENT=production
```

---

## ✅ Success Criteria

Deployment is successful when:

1. ✅ `docker-compose ps` shows all containers healthy
2. ✅ `curl https://lms.it-uae.com/api/health` returns `{"status":"healthy"}`
3. ✅ https://lms.it-uae.com loads login page
4. ✅ Can login as admin
5. ✅ Admin Panel loads with all features
6. ✅ Can create presentations
7. ✅ Can upload PPTX files
8. ✅ Email settings page accessible
9. ✅ SSL certificate valid (green padlock)
10. ✅ All UI in English

---

## 📞 Quick Commands Reference

```bash
# Deploy
cd /opt/SlideConfirm && sudo ./deploy-to-server.sh

# Status
docker-compose -f docker-compose-traefik.yml ps

# Logs
docker-compose -f docker-compose-traefik.yml logs -f backend

# Restart
docker-compose -f docker-compose-traefik.yml restart

# Stop
docker-compose -f docker-compose-traefik.yml stop

# Start
docker-compose -f docker-compose-traefik.yml start

# Health Check
curl https://lms.it-uae.com/api/health

# Backup Database
docker-compose -f docker-compose-traefik.yml exec db pg_dump -U snapcheck_user snapcheck > backup.sql
```

---

## 🎉 Ready to Deploy!

**Everything is prepared:**
- ✅ Frontend built
- ✅ Environment configured
- ✅ Deployment script ready
- ✅ Documentation complete

**Next step:** Upload to server and run `./deploy-to-server.sh`

**Good luck! 🚀**
