# Environment Variables Configuration

## Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory with the following variables:

### Development Environment
```env
# API Configuration
VITE_API_URL=http://localhost:5000

# App Configuration
VITE_APP_NAME=BillNet
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

### Production Environment
```env
# API Configuration
VITE_API_URL=https://api.billnet.com

# App Configuration
VITE_APP_NAME=BillNet
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
```

### Build Configuration
To use different environment variables for different builds, create:
- `.env.development` - For development
- `.env.production` - For production
- `.env.test` - For testing

---

## Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

### Database Configuration
```env
# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=billnet
DB_USER=postgres
DB_PASSWORD=!!@@Root@2009
DB_SSL=false
```

### Server Configuration
```env
# Server
PORT=5000
NODE_ENV=development
HOST=localhost
```

### Authentication
```env
# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=24h
REFRESH_TOKEN_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true
```

### Email Configuration (Optional)
```env
# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@billnet.com
```

### Payment Integration (Optional)
```env
# Stripe (for future payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
```

### Logging
```env
# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
```

---

## How to Use Environment Variables

### In Vite Frontend (JavaScript)
```typescript
// Access variables with VITE_ prefix
const apiUrl = import.meta.env.VITE_API_URL;
const appName = import.meta.env.VITE_APP_NAME;
```

### In Node.js Backend
```javascript
// Use dotenv package
require('dotenv').config();

const dbName = process.env.DB_NAME;
const jwtSecret = process.env.JWT_SECRET;
```

---

## Security Best Practices

⚠️ **IMPORTANT:**

1. **Never commit `.env` files to Git**
   - Add to `.gitignore`
   - Share `.env.example` instead

2. **Use strong secrets**
   - Change JWT_SECRET in production
   - Use secure, random passwords
   - Store in secure credential manager

3. **Different credentials per environment**
   - Development, Staging, Production
   - Never reuse passwords

4. **Rotate secrets regularly**
   - Change JWT_SECRET monthly
   - Rotate database passwords
   - Update API keys

---

## Deployment Configuration

### Vercel (Frontend)
Add environment variables in Vercel dashboard:
```
Project Settings → Environment Variables
```

### Heroku (Backend)
```bash
heroku config:set DB_HOST=your_db_host
heroku config:set JWT_SECRET=your_secret
```

### AWS (Backend)
Use AWS Secrets Manager or Parameter Store

### Docker
Pass environment variables:
```bash
docker run -e DB_HOST=localhost -e DB_NAME=billnet ...
```

---

## Example .env.example Files

### Frontend `.env.example`
```env
# Backend API URL
VITE_API_URL=http://localhost:5000

# App settings
VITE_APP_NAME=BillNet
VITE_APP_VERSION=1.0.0

# Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

### Backend `.env.example`
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=billnet
DB_USER=postgres
DB_PASSWORD=your_password_here

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=24h

# CORS
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true
```

---

## Troubleshooting

### Variables not loading?
1. Restart development server
2. Check file name spelling (`.env.local`, not `.env`)
3. Verify format: `KEY=value` (no spaces around `=`)

### Secrets exposed by accident?
1. Rotate all passwords immediately
2. Generate new JWT_SECRET
3. Revoke old API keys
4. Check Git history

### Different values per developer?
1. Use `.env.local` (git ignored)
2. Share `.env.example`
3. Document required variables

---

## Production Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Generate new JWT_SECRET
- [ ] Set NODE_ENV=production
- [ ] Disable DEBUG mode
- [ ] Enable HTTPS
- [ ] Configure proper CORS
- [ ] Setup logging
- [ ] Enable analytics
- [ ] Test all endpoints
- [ ] Backup database credentials

---

## Support

For environment issues:
- Check `.env` file format
- Verify file location
- Restart development server
- Check documentation

**Last Updated:** January 21, 2026
