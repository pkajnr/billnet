# BillNet - Frontend Setup Guide

## Project Overview

BillNet is a platform where investors meet ideas to create wealth. The frontend is built with **Vite + React** with **TypeScript** and **Tailwind CSS**.

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Backend server running (PostgreSQL database should be set up)

## Database Configuration (Backend)

The backend uses PostgreSQL:
- **Database:** billnet
- **User:** postgres
- **Password:** !!@@Root@2009
- **Backend URL:** http://localhost:5000

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.tsx      # Navigation bar
│   │   ├── Footer.tsx      # Footer component
│   │   └── Layout.tsx      # Layout wrapper
│   ├── pages/              # Page components (routing)
│   │   ├── Home.tsx        # Landing page
│   │   ├── SignIn.tsx      # Sign in page
│   │   ├── SignUp.tsx      # Sign up page
│   │   ├── Dashboard.tsx   # User dashboard
│   │   ├── About.tsx       # About page
│   │   ├── Terms.tsx       # Terms of service
│   │   ├── Privacy.tsx     # Privacy policy
│   │   └── CookieSettings.tsx # Cookie settings
│   ├── libs/               # Utility libraries
│   │   └── api.ts          # API configuration and helpers
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main app with routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Installation

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Install react-router-dom (if not already installed):**
   ```bash
   npm install react-router-dom
   ```

## Environment Setup

Create a `.env.local` file in the frontend directory (optional):

```
VITE_API_URL=http://localhost:5000
```

## Running the Application

**Development Mode:**
```bash
npm run dev
```

The application will start at `http://localhost:5173` (or the next available port).

**Production Build:**
```bash
npm run build
```

**Preview Build:**
```bash
npm run preview
```

## Available Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Landing page |
| `/signin` | SignIn | User login |
| `/signup` | SignUp | New user registration |
| `/about` | About | About BillNet |
| `/terms` | Terms | Terms of service |
| `/privacy` | Privacy | Privacy policy |
| `/cookies` | CookieSettings | Cookie preferences |
| `/dashboard` | Dashboard | User dashboard (requires auth) |

## API Integration

### Authentication Flow

1. **Sign Up**
   ```
   POST /api/auth/signup
   Body: { firstName, lastName, email, password, role }
   Response: { token, user }
   ```

2. **Sign In**
   ```
   POST /api/auth/signin
   Body: { email, password }
   Response: { token, user }
   ```

3. **Get Profile**
   ```
   GET /api/user/profile
   Headers: { Authorization: Bearer <token> }
   Response: { user profile }
   ```

### Tokens

- Tokens are stored in `localStorage` as `token`
- All authenticated requests include: `Authorization: Bearer <token>`
- Automatic redirect to `/signin` on token expiration

### API Helper Functions

Use the `apiCall` helper from `libs/api.ts`:

```typescript
import { apiCall, API_ENDPOINTS } from '@/libs/api';

// Example: Get user profile
const profile = await apiCall(API_ENDPOINTS.USER.PROFILE, {
  method: 'GET',
});

// Example: Create an idea
const idea = await apiCall(API_ENDPOINTS.IDEAS.CREATE, {
  method: 'POST',
  body: JSON.stringify({ title, description }),
});
```

## Component Features

### Home Page
- Hero section with call-to-action
- Feature highlights
- Links to Sign Up and About pages

### Sign In / Sign Up
- Email and password validation
- Role selection (Entrepreneur or Investor)
- Terms agreement checkbox
- Backend integration with JWT tokens

### Dashboard
- User profile information
- Role-specific quick actions
- Statistics dashboard
- Profile editing (UI ready, backend integration pending)

### Footer / Navbar
- Responsive navigation
- Mobile-friendly menu
- Quick links to all pages
- User logout functionality

## Styling with Tailwind CSS

Tailwind CSS is pre-configured and ready to use. All components use Tailwind utility classes.

**Common classes used:**
- `bg-gradient-to-br` - Gradient backgrounds
- `rounded-lg` - Border radius
- `shadow-lg` - Shadows
- `hover:` - Hover effects
- `md:` - Responsive breakpoints
- `flex`, `grid` - Layout

## Authentication Flow

1. User signs up/in
2. Backend returns JWT token
3. Token stored in localStorage
4. Token sent with every authenticated request
5. Dashboard accessible with valid token
6. Auto-logout on token expiration

## Backend API Requirements

Ensure your backend provides these endpoints:

```
POST   /api/auth/signin
POST   /api/auth/signup
GET    /api/user/profile
POST   /api/ideas
GET    /api/ideas
GET    /api/ideas/:id
POST   /api/investments
GET    /api/messages
```

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

## Troubleshooting

**Issue: CORS errors**
- Ensure backend is running on http://localhost:5000
- Check backend CORS configuration
- Verify API_BASE_URL in `libs/api.ts`

**Issue: 404 routes not working**
- Check browser routing (client-side routing is implemented in App.tsx)
- Ensure all page components are imported

**Issue: Token not persisting**
- Check localStorage in browser DevTools
- Verify sign-in response includes token

## Next Steps

1. Complete backend API endpoints
2. Implement idea posting and browsing features
3. Add investment features for investors
4. Implement messaging system
5. Add profile editing functionality
6. Deploy to production (Vercel, Netlify, etc.)

## Support

For issues or questions, contact: support@billnet.com

---

**Last Updated:** January 21, 2026
