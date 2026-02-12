# 🏗️ BillNet Deployment Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS / CLIENTS                          │
└────────────────────┬────────────────┬───────────────────────────┘
                     │                │
                     ▼                ▼
         ┌───────────────────┐  ┌──────────────────┐
         │   Frontend App    │  │   Admin Panel    │
         │  (React + Vite)   │  │  (React + Vite)  │
         │                   │  │                  │
         │ 🌐 Vercel         │  │ 🌐 Vercel        │
         │ billnet.vercel    │  │ admin.vercel     │
         │                   │  │                  │
         │ Port: 443 (HTTPS) │  │ Port: 443        │
         └─────────┬─────────┘  └────────┬─────────┘
                   │                     │
                   │  API Requests       │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │    Backend API       │
                   │  (Node.js/Express)   │
                   │                      │
                   │  🚀 Render.com       │
                   │  billnet-backend     │
                   │                      │
                   │  Port: 5000 (HTTPS)  │
                   └──────────┬───────────┘
                              │
                              │ SQL Queries
                              ▼
                   ┌──────────────────────┐
                   │  PostgreSQL Database │
                   │                      │
                   │  🗄️  Render.com      │
                   │  billnet-db          │
                   │                      │
                   │  Port: 5432 (SSL)    │
                   └──────────────────────┘
```

---

## Data Flow

### User Registration Flow
```
User Browser
    ↓ 1. Fill signup form
Frontend (Vercel)
    ↓ 2. POST /api/auth/signup
Backend (Render)
    ↓ 3. Hash password & INSERT
Database (PostgreSQL)
    ↑ 4. Return user data
Backend (Render)
    ↑ 5. Generate JWT token
Frontend (Vercel)
    ↑ 6. Store token & redirect
User Dashboard
```

### Authentication Flow
```
User Login
    ↓ POST /api/auth/signin
Backend API
    ↓ Verify credentials
Database
    ↑ User data
Backend API
    ↑ JWT Token (7 days validity)
Frontend
    ↑ Store in localStorage
Protected Routes
```

### API Request Flow
```
Frontend App
    ↓ Request with JWT in Authorization header
Backend API (Middleware)
    ↓ Verify JWT token
    ↓ Check user permissions
Backend API (Route Handler)
    ↓ Process request
Database
    ↑ Return data
Backend API
    ↑ Format & return JSON
Frontend App
```

---

## Environment Configuration

### Development (Local)
```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Frontend      │────▶│    Backend      │────▶│  PostgreSQL  │
│ localhost:5173  │     │ localhost:5000  │     │ localhost    │
│   (Vite Dev)    │     │   (Node.js)     │     │   :5432      │
└─────────────────┘     └─────────────────┘     └──────────────┘
       │                        │
       └────────────────────────┘
       Uses: .env (development)
```

### Production (Cloud)
```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Frontend      │────▶│    Backend      │────▶│  PostgreSQL  │
│ Vercel (CDN)    │     │ Render (Docker) │     │ Render (SSL) │
│   HTTPS         │     │   HTTPS         │     │   Internal   │
└─────────────────┘     └─────────────────┘     └──────────────┘
       │                        │
       └────────────────────────┘
       Uses: .env.production
```

---

## Technology Stack

### Frontend Stack
```
React 19.2.0
    ↓
TypeScript 5.9.3
    ↓
Vite 7.2.4 (Build Tool)
    ↓
Tailwind CSS 4.1.18
    ↓
React Router 7.12.0
```

### Backend Stack
```
Node.js
    ↓
Express 5.2.1
    ↓
PostgreSQL 8.11.3 (pg driver)
    ↓
JWT (jsonwebtoken)
    ↓
bcryptjs (password hashing)
```

---

## Deployment Process

### Step 1: Push to GitHub
```
Local Machine
    ↓ git push
GitHub Repository
    ↓ Webhook triggers
Vercel & Render
```

### Step 2: Backend Deployment (Render)
```
GitHub Code
    ↓ Pull latest
Render Build Server
    ↓ npm install
    ↓ Start: npm start
Render Container (Live)
    ↓ Health check: /api/health
Production URL
```

### Step 3: Frontend Deployment (Vercel)
```
GitHub Code
    ↓ Pull latest
Vercel Build Server
    ↓ npm run build
    ↓ Optimize assets
Vercel Edge Network (CDN)
    ↓ Distribute globally
Production URL
```

---

## Security Architecture

### Request Security
```
User Request (HTTPS)
    ↓
Vercel Edge (SSL/TLS)
    ↓
Frontend (Origin Check)
    ↓ Add JWT token
Backend (CORS Check)
    ↓ Verify JWT
    ↓ Check permissions
Database (SSL Connection)
```

### Data Security
```
User Password (plain text)
    ↓ bcrypt.hash() [10 rounds]
Hashed Password (stored)

JWT Token
    ↓ Signed with JWT_SECRET
    ↓ Expires in 7 days
    ↓ Stored in localStorage

Database Connection
    ↓ SSL/TLS encrypted
    ↓ Internal network (Render)
```

---

## File Upload Flow

### Upload Process
```
User selects file
    ↓
Frontend validation (10MB max, specific types)
    ↓
POST /api/upload with multipart/form-data
    ↓
Backend (Multer middleware)
    ↓ Validate file type
    ↓ Generate unique filename
    ↓ Save to /uploads directory
Database (Store file path)
    ↓
Return file URL to frontend
```

### File Storage
```
/backend/uploads/
    ├── 1234567890-file1.pdf
    ├── 1234567891-file2.jpg
    └── 1234567892-file3.docx

Served via: /uploads/filename
```

---

## Database Schema (Simplified)

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ email (UNIQUE)  │
│ password_hash   │
│ role            │
│ created_at      │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│     ideas       │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ title           │
│ description     │
│ amount_needed   │
│ status          │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│  investments    │
├─────────────────┤
│ id (PK)         │
│ idea_id (FK)    │
│ investor_id(FK) │
│ amount          │
│ status          │
└─────────────────┘
```

---

## Monitoring & Health Checks

### Backend Health Check
```bash
GET /api/health

Response:
{
  "status": "ok",
  "message": "BillNet API is running",
  "timestamp": "2026-02-12T10:30:00.000Z",
  "environment": "production"
}
```

### Database Health Check
```javascript
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed');
  } else {
    console.log('✅ Database connected');
    release();
  }
});
```

### Frontend Health
- Build succeeds on Vercel
- All routes accessible
- API calls successful
- No console errors

---

## Scaling Strategy

### Current Setup (Free Tier)
```
Render Backend: 1 instance (sleeps after 15min)
Render DB: 256MB storage
Vercel Frontend: Global CDN
Vercel Admin: Global CDN

Max Users: ~100 concurrent
```

### Production Setup ($14/month)
```
Render Backend: 1 always-on instance (512MB RAM)
Render DB: 1GB storage with backups
Vercel Frontend: Global CDN
Vercel Admin: Global CDN

Max Users: ~1000 concurrent
```

### Scale-Up ($50+/month)
```
Render Backend: 2+ instances with load balancer
Render DB: Dedicated 4GB+ with replicas
Vercel Pro: Advanced analytics & DDoS protection
CDN: CloudFlare for static assets

Max Users: 10,000+ concurrent
```

---

## Backup Strategy

### Automatic Backups (Render)
```
Daily backups (paid plans)
    ↓ Stored for 7 days
    ↓ One-click restore
Point-in-time recovery
```

### Manual Backups
```bash
# Export database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Export uploads
tar -czf uploads-backup.tar.gz backend/uploads/
```

---

## Cost Breakdown

### Free Tier
```
Render Backend:     $0/month (with sleep)
Render Database:    $0/month (256MB)
Vercel Frontend:    $0/month (unlimited)
Vercel Admin:       $0/month (unlimited)
─────────────────────────────────────
TOTAL:              $0/month
```

### Production Tier
```
Render Backend:     $7/month (always-on)
Render Database:    $7/month (1GB + backups)
Vercel Frontend:    $0/month (or $20 for Pro)
Vercel Admin:       $0/month
─────────────────────────────────────
TOTAL:              $14-34/month
```

### Enterprise Tier
```
Render Backend:     $25+/month (scaled)
Render Database:    $25+/month (4GB+ + replicas)
Vercel Pro:         $20/month
CDN (CloudFlare):   $20/month
Monitoring:         $10/month
─────────────────────────────────────
TOTAL:              $100+/month
```

---

## Deployment Timeline

```
Time    Task                          Platform    Status
────────────────────────────────────────────────────────
0:00    Push code to GitHub           GitHub      ✅
0:05    Create PostgreSQL database    Render      ⏳
0:10    Deploy backend service        Render      ⏳
0:15    Run database migrations       Render      ⏳
0:20    Deploy frontend               Vercel      ⏳
0:25    Deploy admin panel            Vercel      ⏳
0:28    Update CORS settings          Render      ⏳
0:30    Test & verify                 Browser     ✅

Total:  ~30 minutes
```

---

**This architecture is optimized for:**
- ✅ Fast deployment
- ✅ Low cost
- ✅ Easy scaling
- ✅ High availability
- ✅ Global reach
- ✅ Security

**Ready to deploy? Follow the [HOSTING_GUIDE.md](./HOSTING_GUIDE.md)!**
