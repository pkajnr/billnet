# BillNet - Deployment Guide

## 🚀 Deployment Options

### Frontend Deployment

#### Option 1: Vercel (Recommended)

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Connect Your Repository**
   ```bash
   # Push your code to GitHub first
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/billnet.git
   git push -u origin main
   ```

3. **Deploy to Vercel**
   - Import project from GitHub
   - Select `frontend` directory
   - Add environment variables:
     - `VITE_API_URL=https://api.billnet.com`
   - Deploy!

4. **Access Your Site**
   ```
   https://billnet.vercel.app (or your custom domain)
   ```

#### Option 2: Netlify

1. **Build the project**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify**
   - Go to https://netlify.com
   - Drag and drop `dist/` folder
   - Or connect GitHub for auto-deployment

#### Option 3: Traditional Hosting

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload `dist/` folder to hosting**
   - AWS S3 + CloudFront
   - DigitalOcean
   - Bluehost
   - Any static hosting

3. **Set up redirect rules** (for SPA)
   - All 404s should redirect to `index.html`

---

### Backend Deployment

#### Option 1: Heroku

1. **Create Heroku Account**
   - Go to https://heroku.com
   - Sign up

2. **Install Heroku CLI**
   ```bash
   # Windows
   npm install -g heroku
   
   # Or download from https://devcenter.heroku.com/articles/heroku-cli
   ```

3. **Login to Heroku**
   ```bash
   heroku login
   ```

4. **Create Heroku App**
   ```bash
   cd backend
   heroku create billnet-api
   ```

5. **Add PostgreSQL Database**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

6. **Set Environment Variables**
   ```bash
   heroku config:set JWT_SECRET=your_secret_key
   heroku config:set NODE_ENV=production
   heroku config:set CORS_ORIGIN=https://billnet.vercel.app
   ```

7. **Deploy**
   ```bash
   git push heroku main
   ```

#### Option 2: DigitalOcean

1. **Create DigitalOcean Account**
   - Go to https://digitalocean.com

2. **Create Droplet**
   - Ubuntu 22.04
   - $5-10/month plan

3. **SSH into Droplet**
   ```bash
   ssh root@your_droplet_ip
   ```

4. **Setup Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

5. **Setup PostgreSQL**
   ```bash
   sudo apt-get install postgresql postgresql-contrib
   sudo -u postgres createdb billnet
   sudo -u postgres createuser postgres
   ```

6. **Clone and Deploy**
   ```bash
   git clone your_repo
   cd billnet/backend
   npm install
   npm start
   ```

7. **Setup Nginx Reverse Proxy**
   ```bash
   sudo apt-get install nginx
   
   # Configure nginx for your backend
   ```

8. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.billnet.com
   ```

#### Option 3: AWS (EC2)

1. **Launch EC2 Instance**
   - Ubuntu 22.04
   - t3.micro (free tier eligible)

2. **Configure Security Groups**
   - Allow SSH (port 22)
   - Allow HTTP (port 80)
   - Allow HTTPS (port 443)
   - Allow Custom TCP (port 5000)

3. **SSH and Setup**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   sudo apt update
   sudo apt install nodejs npm postgresql
   ```

4. **Deploy Application**
   - Clone repository
   - Install dependencies
   - Start with PM2 for process management

5. **Setup RDS Database** (Optional)
   - AWS RDS PostgreSQL
   - Managed database service

---

## 🗄️ Database Deployment

### Option 1: Heroku PostgreSQL (Included with backend)
Already configured when you deploy backend to Heroku

### Option 2: AWS RDS
1. Go to AWS Console
2. Create RDS PostgreSQL instance
3. Update DB credentials in backend

### Option 3: DigitalOcean Managed Database
1. Create managed PostgreSQL database
2. Configure security rules
3. Update connection string

### Option 4: Self-Hosted PostgreSQL
1. Install PostgreSQL on your server
2. Create database and user
3. Backup regularly

---

## 📋 Deployment Checklist

Before deploying to production:

### Frontend
- [ ] Remove debug mode (`VITE_ENABLE_DEBUG=false`)
- [ ] Set correct API_URL to production backend
- [ ] Run `npm run build` locally and test
- [ ] Check bundle size (`npm run build` output)
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Check for console errors
- [ ] Verify environment variables
- [ ] Setup redirects for SPA
- [ ] Enable gzip compression
- [ ] Setup CDN if needed

### Backend
- [ ] Change JWT_SECRET to strong random value
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for frontend domain
- [ ] Setup database backups
- [ ] Enable SSL/HTTPS
- [ ] Configure logging
- [ ] Setup error monitoring (Sentry)
- [ ] Test all API endpoints
- [ ] Load test the API
- [ ] Setup monitoring and alerts
- [ ] Document deployment process
- [ ] Create rollback plan

### General
- [ ] Custom domain name configured
- [ ] SSL certificates installed
- [ ] Email notifications setup
- [ ] Monitoring tools configured
- [ ] Backup strategy in place
- [ ] Disaster recovery plan
- [ ] Documentation updated
- [ ] Team trained on deployment

---

## 🔒 Security Configuration

### HTTPS/SSL
```bash
# Get free SSL from Let's Encrypt
certbot certonly --standalone -d billnet.com -d api.billnet.com
```

### CORS Configuration
```javascript
// backend/server.js
const cors = require('cors');

app.use(cors({
  origin: 'https://billnet.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Database Backups
```bash
# Daily backup to AWS S3
pg_dump billnet | gzip | aws s3 cp - s3://billnet-backups/daily-$(date +%Y%m%d).sql.gz
```

---

## 📊 Monitoring & Analytics

### Frontend Monitoring
- **Google Analytics**
- **Sentry** (for error tracking)
- **Hotjar** (for user behavior)

### Backend Monitoring
- **PM2 Plus** (process monitoring)
- **New Relic** (performance monitoring)
- **Datadog** (infrastructure monitoring)
- **Sentry** (error tracking)

### Database Monitoring
- **PostgreSQL logs**
- **Query performance**
- **Backup verification**

---

## 🔄 Continuous Integration/Deployment

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: npm run deploy
```

---

## 📈 Scaling Strategy

### Phase 1: Launch
- Single server for backend
- Database on managed service
- CDN for frontend
- Estimated users: 100-1000

### Phase 2: Growth
- Load balancer
- Multiple backend instances
- Read replicas for database
- Estimated users: 1000-10,000

### Phase 3: Scale
- Kubernetes for containers
- Multi-region deployment
- Advanced caching
- Estimated users: 10,000+

---

## 🆘 Rollback Procedure

If deployment goes wrong:

1. **Frontend Rollback** (Vercel)
   - Go to Deployments
   - Click "Rollback" on previous version

2. **Backend Rollback** (Heroku)
   ```bash
   heroku releases
   heroku rollback v123
   ```

3. **Database Rollback**
   - Restore from backup
   - Test thoroughly before going live

---

## 📞 Post-Deployment Support

1. **Monitor System Health**
   - Check server status
   - Review error logs
   - Monitor API response times

2. **Collect Feedback**
   - User feedback forms
   - Error reports
   - Performance metrics

3. **Hot Fixes**
   - Critical bugs only
   - Follow proper deployment process
   - Test locally first

4. **Documentation**
   - Update runbooks
   - Document issues and solutions
   - Create troubleshooting guides

---

## 💰 Cost Estimation

### Minimum Setup (Monthly)
| Service | Cost |
|---------|------|
| Vercel (Frontend) | Free - $20 |
| Heroku (Backend) | $7 - $25 |
| Database | $9 - $50 |
| Domain | $12 |
| **Total** | **~$28 - $107** |

### Recommended Setup (Monthly)
| Service | Cost |
|---------|------|
| Vercel Pro (Frontend) | $20 |
| DigitalOcean (Backend) | $6 - $12 |
| DigitalOcean DB | $15 |
| Domain | $12 |
| CDN | $0 - $20 |
| Monitoring | $0 - $30 |
| **Total** | **~$53 - $99** |

---

## 📚 Additional Resources

- **Vercel Docs:** https://vercel.com/docs
- **Heroku Docs:** https://devcenter.heroku.com
- **DigitalOcean:** https://docs.digitalocean.com
- **AWS:** https://docs.aws.amazon.com
- **PostgreSQL:** https://www.postgresql.org/docs/

---

## ✅ Deployment Complete!

Once deployed:
1. Test all functionality
2. Monitor for 24 hours
3. Collect user feedback
4. Plan improvements
5. Schedule next iteration

---

**Last Updated:** January 21, 2026

For questions: support@billnet.com
