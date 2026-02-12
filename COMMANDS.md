# 🚀 Deployment Commands Quick Reference

## Local Development

### Backend
```bash
# Navigate to backend
cd d:\appz\bilnet\backend

# Install dependencies
npm install

# Generate secure JWT secret
npm run generate-secret

# Start development server
npm run dev

# Start production server
npm start

# Test health endpoint
curl http://localhost:5000/api/health
```

### Frontend
```bash
# Navigate to frontend
cd d:\appz\bilnet\frontend

# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Admin Panel
```bash
# Navigate to admin
cd d:\appz\bilnet\admin

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Git Commands

### Initial Setup
```bash
# Initialize git repository
cd d:\appz\bilnet
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - ready for deployment"

# Add remote (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/billnet.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Regular Updates
```bash
# Add changes
git add .

# Commit with message
git commit -m "Your commit message here"

# Push to GitHub (triggers auto-deployment)
git push
```

### Check Status
```bash
# View changed files
git status

# View commit history
git log --oneline
```

---

## Database Commands

### Local PostgreSQL

#### Windows (using psql)
```bash
# Connect to database
psql -U postgres -d billnet

# List databases
\l

# List tables
\dt

# View table structure
\d users

# Run SQL file
\i d:\appz\bilnet\backend\database.sql

# Exit psql
\q
```

#### Run Migrations
```bash
# From backend directory
psql -U postgres -d billnet -f database.sql
psql -U postgres -d billnet -f marketplace_schema.sql
psql -U postgres -d billnet -f migrations_new_features.sql
```

### Production Database (Render)

#### Via Render Dashboard
1. Go to your database on Render
2. Click "Connect" → "External Connection"
3. Use provided connection details with your psql client

#### Via Command Line
```bash
# Using DATABASE_URL from Render
psql "your_database_url_from_render"

# Or using individual connection details
psql -h <host> -U <user> -d <database>
```

#### Backup Database
```bash
# Backup to file
pg_dump "your_database_url" > backup.sql

# Backup with timestamp
pg_dump "your_database_url" > backup-$(date +%Y%m%d-%H%M%S).sql
```

#### Restore Database
```bash
# Restore from backup
psql "your_database_url" < backup.sql
```

---

## Environment Setup

### Generate JWT Secret
```bash
# Using Node.js
cd backend
npm run generate-secret

# Or using PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Check Environment Variables
```bash
# Windows PowerShell
cat .env

# Check if variable is set
echo $env:PORT
```

---

## Testing Commands

### Test Backend Endpoints

#### Health Check
```bash
# Local
curl http://localhost:5000/api/health

# Production
curl https://your-backend-url.onrender.com/api/health
```

#### Root Endpoint
```bash
# Local
curl http://localhost:5000/

# Production
curl https://your-backend-url.onrender.com/
```

#### Test Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123",
    "role": "entrepreneur"
  }'
```

#### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Frontend

#### Check Build Output
```bash
cd frontend
npm run build

# Check dist folder size
ls -lh dist
```

#### Preview Production Build
```bash
npm run preview
# Opens http://localhost:4173
```

---

## Vercel CLI (Optional)

### Install Vercel CLI
```bash
npm install -g vercel
```

### Deploy from CLI
```bash
# Login to Vercel
vercel login

# Deploy frontend
cd frontend
vercel

# Deploy with production settings
vercel --prod

# Deploy admin
cd ../admin
vercel --prod
```

---

## Render CLI (Optional)

### Install Render CLI
```bash
# Using npm
npm install -g @render-apps/cli

# Or using pip
pip install render-cli
```

### Deploy from CLI
```bash
# Login to Render
render login

# Deploy service
cd backend
render deploy
```

---

## Monitoring & Logs

### View Backend Logs (Render)
- Go to: https://render.com/dashboard
- Select your service
- Click "Logs" tab
- Or use CLI: `render logs <service-name>`

### View Frontend Logs (Vercel)
- Go to: https://vercel.com/dashboard
- Select your project
- Click "Deployments" → Select deployment → "Function Logs"

### Real-time Backend Logs
```bash
# In Render dashboard
# Logs tab → Enable "Live tail"
```

---

## Package Management

### Update Dependencies
```bash
# Check outdated packages
npm outdated

# Update all packages
npm update

# Update specific package
npm update <package-name>

# Update to latest versions (use with caution)
npm install <package-name>@latest
```

### Install New Package
```bash
# Install and save to dependencies
npm install <package-name>

# Install and save to devDependencies
npm install -D <package-name>
```

---

## Troubleshooting Commands

### Clear node_modules and reinstall
```bash
# Remove node_modules
rm -rf node_modules
# Or on Windows
rmdir /s /q node_modules

# Remove package-lock.json
rm package-lock.json

# Reinstall
npm install
```

### Check Node and npm versions
```bash
node --version
npm --version
```

### Clear npm cache
```bash
npm cache clean --force
```

### Fix permission issues (Windows)
```bash
# Run PowerShell as Administrator
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## VS Code Tasks (Optional)

### Create tasks.json
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Backend",
      "type": "shell",
      "command": "cd backend && npm run dev",
      "problemMatcher": []
    },
    {
      "label": "Start Frontend",
      "type": "shell",
      "command": "cd frontend && npm run dev",
      "problemMatcher": []
    },
    {
      "label": "Start Admin",
      "type": "shell",
      "command": "cd admin && npm run dev",
      "problemMatcher": []
    }
  ]
}
```

---

## Quick Deploy Script

### Create deploy.bat (Windows)
```batch
@echo off
echo Deploying BillNet...

echo.
echo Step 1: Adding files to git...
git add .

echo.
echo Step 2: Committing changes...
set /p message="Enter commit message: "
git commit -m "%message%"

echo.
echo Step 3: Pushing to GitHub...
git push

echo.
echo ✅ Deployment triggered!
echo Frontend will auto-deploy to Vercel
echo Backend will auto-deploy to Render
echo.
pause
```

### Create deploy.sh (Mac/Linux)
```bash
#!/bin/bash
echo "Deploying BillNet..."

echo ""
echo "Step 1: Adding files to git..."
git add .

echo ""
echo "Step 2: Committing changes..."
read -p "Enter commit message: " message
git commit -m "$message"

echo ""
echo "Step 3: Pushing to GitHub..."
git push

echo ""
echo "✅ Deployment triggered!"
echo "Frontend will auto-deploy to Vercel"
echo "Backend will auto-deploy to Render"
```

---

## Environment Variables Check

### List all environment variables
```bash
# Windows PowerShell
Get-ChildItem Env:

# Or check specific variable
echo $env:VITE_API_URL
```

### Set environment variable temporarily
```bash
# Windows PowerShell
$env:NODE_ENV="production"

# Windows CMD
set NODE_ENV=production
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│              BILLNET DEPLOYMENT COMMANDS                │
├─────────────────────────────────────────────────────────┤
│ Local Dev:                                              │
│   npm run dev        → Start dev server                 │
│   npm start          → Start production server          │
│   npm run build      → Build for production             │
│                                                         │
│ Git:                                                    │
│   git add .          → Stage all changes                │
│   git commit -m ""   → Commit changes                   │
│   git push           → Push & auto-deploy               │
│                                                         │
│ Database:                                               │
│   psql -U postgres   → Connect to local DB              │
│   \dt                → List tables                      │
│   \q                 → Quit psql                        │
│                                                         │
│ Testing:                                                │
│   curl /api/health   → Test backend health              │
│   npm run preview    → Preview prod build               │
│                                                         │
│ Security:                                               │
│   npm run generate-secret → Generate JWT secret         │
└─────────────────────────────────────────────────────────┘
```

---

## Need More Help?

📖 **Full Guides**:
- [HOSTING_GUIDE.md](./HOSTING_GUIDE.md) - Complete deployment guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist
- [DEPLOYMENT_INFO.md](./DEPLOYMENT_INFO.md) - Quick reference

🔗 **Platform Docs**:
- Vercel: https://vercel.com/docs
- Render: https://render.com/docs
- PostgreSQL: https://www.postgresql.org/docs/

---

**Last Updated**: February 12, 2026
