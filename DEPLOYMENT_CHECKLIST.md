# 🚀 Quick Deployment Checklist

Use this checklist to deploy your BillNet application.

## ✅ Pre-Deployment

- [ ] Code is committed to Git
- [ ] Code is pushed to GitHub
- [ ] All features tested locally
- [ ] Environment files configured

## 📦 Backend (Render)

- [ ] Create PostgreSQL database on Render
- [ ] Copy Internal Database URL
- [ ] Create Web Service for backend
- [ ] Set environment variables:
  - [ ] NODE_ENV=production
  - [ ] PORT=5000
  - [ ] DATABASE_URL
  - [ ] JWT_SECRET (use random 32 char string)
  - [ ] CORS_ORIGIN (will add frontend URLs later)
- [ ] Deploy backend
- [ ] Copy backend URL: `https://billnet-backend-XXXX.onrender.com`
- [ ] Run database migrations
- [ ] Test API: Visit `/api/health` endpoint

## 🎨 Frontend (Vercel)

- [ ] Update `frontend/.env.production` with backend URL
- [ ] Commit and push changes
- [ ] Create new project on Vercel
- [ ] Select `frontend` as root directory
- [ ] Set environment variables:
  - [ ] VITE_API_URL (backend URL from above)
  - [ ] VITE_APP_NAME=BillNet
  - [ ] VITE_ENABLE_DEBUG=false
- [ ] Deploy frontend
- [ ] Copy frontend URL: `https://billnet-XXXX.vercel.app`
- [ ] Test: Open URL and try signup/login

## 🛠️ Admin Panel (Vercel)

- [ ] Create `admin/.env.production` with backend URL
- [ ] Commit and push changes
- [ ] Create new project on Vercel
- [ ] Select `admin` as root directory
- [ ] Set VITE_API_URL environment variable
- [ ] Deploy admin panel
- [ ] Copy admin URL: `https://billnet-admin-XXXX.vercel.app`
- [ ] Test: Login with admin secret

## 🔗 Final Configuration

- [ ] Update backend CORS_ORIGIN with frontend and admin URLs
- [ ] Wait for backend to redeploy
- [ ] Test full user flow (signup → login → create post)
- [ ] Test admin panel (login → view users/ideas)
- [ ] Check browser console for errors
- [ ] Test on mobile device

## 🎉 Post-Deployment

- [ ] Bookmark your URLs
- [ ] Set up custom domain (optional)
- [ ] Configure email service (optional)
- [ ] Set up monitoring/alerts
- [ ] Share with users!

---

## 📝 Your Deployment URLs

Fill these in as you deploy:

```
Backend:  https://_____________________________.onrender.com
Frontend: https://_____________________________.vercel.app
Admin:    https://_____________________________.vercel.app
Database: (internal) postgresql://________________
```

---

## ⚡ Quick Commands

### Check if services are running:
```bash
# Backend health check
curl https://your-backend-url.onrender.com/api/health

# Should return: {"status":"ok"}
```

### View logs:
- **Render**: Dashboard → Your Service → Logs
- **Vercel**: Dashboard → Your Project → Deployments → View Function Logs

### Redeploy:
- **Render**: Click "Manual Deploy" button
- **Vercel**: Push to GitHub or click "Redeploy"

---

**Total Time**: ~30 minutes for complete deployment
