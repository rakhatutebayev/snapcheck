# SnapCheck Deployment Guide

## ✅ Pre-Deployment Checklist

- [x] All UI strings converted to English
- [x] All email templates converted to English  
- [x] Frontend production build created (`frontend/dist/`)
- [x] Backend health endpoint working (`/health`)
- [x] SMTP email service configured and tested

## 🚀 Deployment Steps

### 1. Environment Configuration

Create `.env` file in project root with production values:

```bash
# Database (PostgreSQL recommended for production)
DATABASE_URL=postgresql://user:password@localhost:5432/snapcheck

# Security
SECRET_KEY=your-strong-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend URL (used for email verification/reset links)
FRONTEND_URL=https://yourdomain.com

# SMTP Email (configure via Admin Panel UI after deployment)
# No environment variables needed - all configured in database
```

### 2. Database Setup

#### Option A: PostgreSQL (Recommended)

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE snapcheck;
CREATE USER snapcheck_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE snapcheck TO snapcheck_user;
\q

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://snapcheck_user:your_password@localhost:5432/snapcheck
```

#### Option B: SQLite (Development/Small Scale)

```bash
# Default configuration (no changes needed)
DATABASE_URL=sqlite:////tmp/snapcheck.db
```

### 3. Run Database Migrations

```bash
cd /Users/rakhat/Documents/webhosting/SnapCheck

# Apply migrations
python3 -m backend.migrations.add_user_verification_fields

# Or run all migrations
python3 -m alembic upgrade head
```

### 4. Create Admin User

```bash
python3 << 'EOF'
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
    print("Email: admin@example.com")
    print("Password: admin123")
    print("⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!")
else:
    print("Admin user already exists")

db.close()
EOF
```

### 5. Backend Deployment

#### Option A: Systemd Service (Linux)

Create `/etc/systemd/system/snapcheck-backend.service`:

```ini
[Unit]
Description=SnapCheck Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/snapcheck
Environment="PATH=/var/www/snapcheck/venv/bin"
ExecStart=/var/www/snapcheck/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable snapcheck-backend
sudo systemctl start snapcheck-backend
sudo systemctl status snapcheck-backend
```

#### Option B: Docker

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/snapcheck
      - SECRET_KEY=${SECRET_KEY}
      - FRONTEND_URL=${FRONTEND_URL}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=snapcheck
      - POSTGRES_USER=snapcheck
      - POSTGRES_PASSWORD=snapcheck_pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Deploy:

```bash
docker-compose up -d
```

#### Option C: Direct Process (Development/Testing)

```bash
# Start backend
cd /Users/rakhat/Documents/webhosting/SnapCheck
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 6. Frontend Deployment

#### Nginx Configuration

Create `/etc/nginx/sites-available/snapcheck`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend static files
    root /var/www/snapcheck/frontend/dist;
    index index.html;

    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend health endpoint
    location /health {
        proxy_pass http://localhost:8000;
    }

    # SSL configuration (after certbot)
    # listen 443 ssl;
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/snapcheck /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Apache Configuration

Create `/etc/apache2/sites-available/snapcheck.conf`:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    
    DocumentRoot /var/www/snapcheck/frontend/dist
    
    <Directory /var/www/snapcheck/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # SPA routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # API proxy
    ProxyPass /api http://localhost:8000/api
    ProxyPassReverse /api http://localhost:8000/api
    
    ProxyPass /health http://localhost:8000/health
    ProxyPassReverse /health http://localhost:8000/health
</VirtualHost>
```

Enable:

```bash
sudo a2enmod rewrite proxy proxy_http
sudo a2ensite snapcheck
sudo systemctl reload apache2
```

### 7. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# For Nginx
sudo certbot --nginx -d yourdomain.com

# For Apache
sudo certbot --apache -d yourdomain.com

# Auto-renewal
sudo systemctl status certbot.timer
```

### 8. Configure Email (SMTP)

1. Login as admin: `https://yourdomain.com/login`
2. Navigate to **Admin Panel → Email Settings**
3. Configure SMTP:
   - **Gmail**: smtp.gmail.com:587 (App Password required)
   - **Office 365**: smtp.office365.com:587 (App Password + SMTP AUTH)
   - **Yandex**: smtp.yandex.ru:587
4. Add notification recipients
5. Send test email to verify

### 9. Post-Deployment Verification

```bash
# Check backend health
curl https://yourdomain.com/health
# Expected: {"status":"ok"}

# Check frontend
curl -I https://yourdomain.com/
# Expected: HTTP 200 OK

# Check API
curl https://yourdomain.com/api/user/presentations
# Expected: 401 Unauthorized (auth required - correct!)

# Check logs
sudo journalctl -u snapcheck-backend -f
tail -f /var/log/nginx/error.log
```

### 10. Security Checklist

- [ ] Change default admin password
- [ ] Set strong SECRET_KEY (min 32 characters)
- [ ] Configure firewall (ufw/iptables)
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set secure file permissions (chmod 600 .env)
- [ ] Configure CORS if needed
- [ ] Set up database backups
- [ ] Monitor logs regularly
- [ ] Keep dependencies updated

## 📊 System Requirements

### Minimum
- CPU: 1 core
- RAM: 512 MB
- Disk: 1 GB
- OS: Linux (Ubuntu 20.04+, Debian 11+)

### Recommended
- CPU: 2 cores
- RAM: 2 GB
- Disk: 10 GB (for uploads/logs)
- OS: Ubuntu 22.04 LTS

## 🔧 Maintenance

### Backup Database

```bash
# PostgreSQL
pg_dump -U snapcheck_user snapcheck > backup_$(date +%Y%m%d).sql

# SQLite
cp /tmp/snapcheck.db backup_$(date +%Y%m%d).db
```

### Update Application

```bash
cd /var/www/snapcheck
git pull origin main

# Rebuild frontend
cd frontend && npm run build

# Restart backend
sudo systemctl restart snapcheck-backend

# Reload nginx
sudo systemctl reload nginx
```

### Monitor Logs

```bash
# Backend logs
sudo journalctl -u snapcheck-backend -f --since "1 hour ago"

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

## 🆘 Troubleshooting

### Backend not starting

```bash
# Check logs
sudo journalctl -u snapcheck-backend -n 50

# Check port availability
sudo lsof -i :8000

# Test manually
cd /var/www/snapcheck
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### Database connection errors

```bash
# Test PostgreSQL connection
psql -U snapcheck_user -d snapcheck -h localhost

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Verify migrations
python3 -m alembic current
```

### Email not sending

1. Check SMTP settings in Admin Panel
2. Verify SMTP credentials (use App Password for Gmail/Office365)
3. Check firewall allows outbound port 587/465
4. Test with manual SMTP connection:

```bash
telnet smtp.gmail.com 587
```

### Frontend 404 errors

```bash
# Verify build exists
ls -la /var/www/snapcheck/frontend/dist/

# Check nginx configuration
sudo nginx -t

# Verify SPA fallback
curl https://yourdomain.com/some-route
# Should return index.html (not 404)
```

## 📞 Support

- GitHub Issues: https://github.com/rakhatutebayev/snapcheck/issues
- Documentation: See README.md
- Email: Configure in Admin Panel after deployment

---

**Version**: 1.3  
**Last Updated**: 2024-11-12  
**Status**: Production Ready ✅
