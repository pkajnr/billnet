# 🚀 BillNet - Complete Hosting & Deployment Guide

## Quick Start Deployment (Recommended)

This guide will help you deploy your BillNet application to production in **under 30 minutes** using free hosting platforms.

### Architecture Overview
- **Frontend (React + Vite)**: Deploy to Vercel
- **Admin Panel (React + Vite)**: Deploy to Vercel
- **Backend (Node.js + Express)**: Deploy to Render
- **Database (PostgreSQL)**: Managed PostgreSQL on Render

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Git installed on your computer
- [ ] GitHub account (free)
- [ ] Vercel account (sign up with GitHub at https://vercel.com)
- [ ] Render account (sign up with GitHub at https://render.com)
- [ ] Your code pushed to a GitHub repository

---

## Step 1: Push Your Code to GitHub

If you haven't already:

```bash
# Initialize git (if not already done)
cd d:\appz\bilnet
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit - ready for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/pkajnr/billnet.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create PostgreSQL Database

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `billnet-db`
   - **Database**: `billnet`
   - **User**: `billnet`
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click **"Create Database"**
5. Wait for database to be created (~2-3 minutes)
6. Copy the **Internal Database URL** (starts with `postgresql://`)

### 2.2 Deploy Backend Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `billnet-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Add Environment Variables** (click "Advanced" or go to Environment tab):
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=CHANGE_THIS_TO_RANDOM_32_CHAR_STRING
   JWT_EXPIRES_IN=7d
   ```
   
   **Database Variables** (use the Internal Database URL you copied):
   ```
   DATABASE_URL=your_internal_database_url_here
   ```
   
   OR separately:
   ```
   DB_HOST=<from database dashboard>
   DB_PORT=5432
   DB_NAME=billnet
   DB_USER=billnet
   DB_PASSWORD=<from database dashboard>
   ```

5. Click **"Create Web Service"**
6. Wait for deployment (~5-10 minutes)
7. **Copy your backend URL**: `https://billnet-backend-XXXX.onrender.com`

### 2.3 Initialize Database

1. Open your Render backend logs
2. Go to **Shell** tab in Render dashboard
3. Run the database migrations:

```bash
# Connect to your database using psql
psql $DATABASE_URL

# Or copy and paste the SQL from database.sql
```

**OR** use the Render PostgreSQL dashboard:
1. Go to your database on Render
2. Click **"Connect"** → **"External Connection"**
3. Use a PostgreSQL client to connect and run `backend/database.sql`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Update Environment Variables

1. Open `frontend/.env.production`
2. Update the API URL with your Render backend URL:
   ```env
   VITE_API_URL=https://billnet-backend-XXXX.onrender.com
   ```

3. Commit this change:
   ```bash
   git add frontend/.env.production
   git commit -m "Update production API URL"
   git push
   ```

### 3.2 Deploy to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Environment Variables**:
   ```
   VITE_API_URL=https://billnet-backend-XXXX.onrender.com
   VITE_APP_NAME=BillNet
   VITE_APP_VERSION=1.0.0
   VITE_ENABLE_ANALYTICS=true
   VITE_ENABLE_DEBUG=false
   ```

6. Click **"Deploy"**
7. Wait for deployment (~2-3 minutes)
8. **Copy your frontend URL**: `https://billnet-XXXX.vercel.app`

---

## Step 4: Deploy Admin Panel to Vercel

### 4.1 Create .env.production for Admin

1. Create `admin/.env.production`:
   ```env
   VITE_API_URL=https://billnet-backend-XXXX.onrender.com
   ```

2. Commit:
   ```bash
   git add admin/.env.production
   git commit -m "Add admin production config"
   git push
   ```

### 4.2 Deploy Admin to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import the same GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `admin`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Environment Variables**:
   ```
   VITE_API_URL=https://billnet-backend-XXXX.onrender.com
   ```

6. Click **"Deploy"**
7. **Copy your admin URL**: `https://billnet-admin-XXXX.vercel.app`

---

## Step 5: Update Backend CORS Settings

Now that you have your frontend URLs, update the backend CORS settings:

1. Go to Render → Your Backend Service → Environment
2. Add/Update:
   ```
   CORS_ORIGIN=https://billnet-XXXX.vercel.app,https://billnet-admin-XXXX.vercel.app
   ```

3. Or if you want to allow all (not recommended for production):
   ```
   CORS_ORIGIN=*
   ```

4. Save and wait for automatic redeployment

---

## Step 6: Test Your Deployment

### Test Frontend
1. Visit your frontend URL: `https://billnet-XXXX.vercel.app`
2. Try to sign up / log in
3. Check browser console for any errors

### Test Admin Panel
1. Visit your admin URL: `https://billnet-admin-XXXX.vercel.app`
2. Log in with admin secret
3. Verify you can see dashboard

### Test Backend
1. Visit: `https://billnet-backend-XXXX.onrender.com/api/health`
2. Should see: `{"status":"ok"}`

---

## 🎉 You're Live!

Your application is now deployed:
- **Frontend**: https://billnet-XXXX.vercel.app
- **Admin Panel**: https://billnet-admin-XXXX.vercel.app
- **Backend API**: https://billnet-backend-XXXX.onrender.com

---

## 🔧 Post-Deployment Configuration

### Custom Domain (Optional)

#### For Vercel (Frontend/Admin):
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

#### For Render (Backend):
1. Go to Service → Settings → Custom Domain
2. Add your API subdomain (e.g., `api.yourdomain.com`)
3. Update DNS records

### Environment Variables Updates

If you need to update environment variables:

**Vercel**: Settings → Environment Variables → Edit → Redeploy
**Render**: Environment tab → Add Variable → Save (auto-redeploys)

### Database Backups

Render automatically backs up your free PostgreSQL database. For production:
1. Upgrade to paid plan for daily backups
2. Or manually backup using:
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```

### Monitoring

**Render**:
- View logs in real-time from dashboard
- Set up email alerts for service downtime

**Vercel**:
- View deployment logs
- Analytics available in dashboard

---

## 🐛 Troubleshooting

### Backend won't start
- Check environment variables are set correctly
- View logs in Render dashboard
- Ensure database is connected

### Frontend can't connect to backend
- Check CORS_ORIGIN includes your frontend URL
- Verify VITE_API_URL is correct in frontend
- Check browser console for CORS errors

### Database connection issues
- Verify DATABASE_URL or individual DB_* variables
- Check database is running in Render
- Try using Internal Database URL instead of External

### Render free tier sleeping
- Free tier services sleep after 15 minutes of inactivity
- First request takes ~30 seconds to wake up
- Upgrade to paid plan to prevent sleeping

---

## 💰 Cost Breakdown

### Free Tier (Perfect for testing)
- **Render Backend**: Free (sleeps after 15 min)
- **Render Database**: Free (limited to 256MB)
- **Vercel Frontend**: Free (unlimited bandwidth)
- **Vercel Admin**: Free
- **Total**: $0/month

### Production Tier
- **Render Backend**: $7/month (always on)
- **Render Database**: $7/month (1GB)
- **Vercel Pro** (optional): $20/month
- **Total**: ~$14-34/month

---

## 🔄 Continuous Deployment

Both Vercel and Render support automatic deployments:

1. **Auto-deploy on push**:
   - Push to `main` branch → Automatic deployment
   
2. **Preview deployments** (Vercel):
   - Push to any branch → Gets preview URL
   
3. **Rollback**:
   - Both platforms allow instant rollback to previous versions

---

## 📚 Next Steps

After deployment:
1. [ ] Set up custom domain
2. [ ] Configure email service (for password reset, etc.)
3. [ ] Set up monitoring and alerts
4. [ ] Configure SSL certificates (automatic on Vercel/Render)
5. [ ] Add error tracking (Sentry)
6. [ ] Set up analytics
7. [ ] Configure CDN for assets
8. [ ] Set up automated backups

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Issues**: Create an issue in your repository

---

## Alternative Hosting Options

### Backend Alternatives
- **Railway**: https://railway.app (similar to Render)
- **Fly.io**: https://fly.io (free tier available)
- **Heroku**: https://heroku.com (no longer has free tier)
- **AWS/GCP/Azure**: More complex, not recommended for beginners

### Frontend Alternatives
- **Netlify**: https://netlify.com (similar to Vercel)
- **GitHub Pages**: Free, but limited (static only)
- **Cloudflare Pages**: https://pages.cloudflare.com

### Database Alternatives
- **Supabase**: https://supabase.com (free PostgreSQL)
- **PlanetScale**: https://planetscale.com (MySQL)
- **MongoDB Atlas**: https://mongodb.com/atlas (NoSQL)

---

## 🔐 Security Checklist

Before going to production:
- [ ] Change JWT_SECRET to a strong random string
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable database SSL
- [ ] Regular security updates
- [ ] Set up automated backups

---

**Congratulations! Your BillNet application is now hosted and accessible worldwide! 🎉**
