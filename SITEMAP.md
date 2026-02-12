# 🗺️ BillNet Site Map & Navigation Structure

## Site Navigation Hierarchy

```
BILLNET
├── PUBLIC PAGES (No Authentication Required)
│   ├── HOME (/)
│   │   ├── Hero Section
│   │   ├── Features Showcase
│   │   ├── Call-to-Action Buttons
│   │   │   ├── Sign Up
│   │   │   └── Learn More (About)
│   │   └── Footer Links
│   │
│   ├── SIGN UP (/signup)
│   │   ├── First Name Field
│   │   ├── Last Name Field
│   │   ├── Email Field
│   │   ├── Password Field
│   │   ├── Confirm Password Field
│   │   ├── Role Selection
│   │   │   ├── Entrepreneur/Founder
│   │   │   └── Investor
│   │   ├── Terms Checkbox
│   │   ├── Sign Up Button
│   │   └── Link to Sign In
│   │
│   ├── SIGN IN (/signin)
│   │   ├── Email Field
│   │   ├── Password Field
│   │   ├── Sign In Button
│   │   └── Link to Sign Up
│   │
│   ├── ABOUT (/about)
│   │   ├── Mission Statement
│   │   ├── What We Do
│   │   ├── Core Values (4 sections)
│   │   └── Contact Information
│   │
│   ├── TERMS (/terms)
│   │   ├── Agreement to Terms
│   │   ├── Use License
│   │   ├── Disclaimer
│   │   ├── Limitations
│   │   ├── Accuracy of Materials
│   │   ├── Links Policy
│   │   ├── Modifications
│   │   └── Governing Law
│   │
│   ├── PRIVACY (/privacy)
│   │   ├── Introduction
│   │   ├── Information Collection
│   │   ├── Use of Data
│   │   ├── Security of Data
│   │   ├── User Rights
│   │   ├── Third-Party Services
│   │   └── Policy Changes
│   │
│   └── COOKIES (/cookies)
│       ├── Essential Cookies (Always On)
│       ├── Analytics Cookies (Toggle)
│       ├── Marketing Cookies (Toggle)
│       ├── Personalization Cookies (Toggle)
│       ├── Save Preferences Button
│       └── Reset to Essential Button
│
└── PROTECTED PAGES (Authentication Required)
    └── DASHBOARD (/dashboard) ⚠️ Login Required
        ├── Welcome Header
        ├── Profile Card
        │   ├── First Name
        │   ├── Last Name
        │   ├── Email
        │   ├── Account Type
        │   ├── Member Since
        │   ├── Edit Profile Button
        │   └── Change Password Button
        ├── Quick Actions (Role-Specific)
        │   │
        │   ├── FOR ENTREPRENEURS:
        │   │   ├── Post an Idea
        │   │   ├── My Ideas
        │   │   └── Messages
        │   │
        │   └── FOR INVESTORS:
        │       ├── Browse Ideas
        │       ├── Saved Ideas
        │       └── My Portfolio
        │
        └── Statistics Dashboard
            ├── Ideas Posted / Investments
            ├── Messages Count
            ├── Connections Count
            └── Profile Completion %
```

---

## User Flow Diagram

### New User Journey
```
Landing Page (/)
    ↓
Click "Get Started"
    ↓
Sign Up Page (/signup)
    ├── Fill Form
    ├── Select Role
    ├── Agree to Terms
    └── Click Sign Up
    ↓
Submit to Backend
    ├── Validation
    ├── Create Account
    └── Issue JWT Token
    ↓
Token Stored in localStorage
    ↓
Redirect to Dashboard (/dashboard)
    ↓
View Role-Specific Content
```

### Returning User Journey
```
Landing Page (/)
    ↓
Click "Sign In"
    ↓
Sign In Page (/signin)
    ├── Enter Email
    ├── Enter Password
    └── Click Sign In
    ↓
Submit to Backend
    ├── Validate Credentials
    └── Issue JWT Token
    ↓
Token Stored in localStorage
    ↓
Redirect to Dashboard (/dashboard)
    ↓
View Role-Specific Content
```

---

## Navigation Components

### Navbar Links
```
Logo (BillNet)  Home  About  [Sign In | Sign Up] or [Dashboard | Logout]
                                    (based on login status)
```

### Footer Links
```
BillNet          Quick Links      Legal            Contact
├── Description  ├── Home         ├── Terms        ├── Email
├── Socials      ├── About        ├── Privacy      ├── Phone
└── Year         ├── Sign In      └── Cookies      └── Address
                 └── Sign Up
```

---

## Page Details & Components

### Home Page (/)
- **Hero Section** - Large title, subtitle, CTA buttons
- **Features Section** - 3-column grid with icons and descriptions
- **Call-to-Action** - Sign up and learn more buttons
- **Responsive** - Stacks on mobile

### Sign Up Page (/signup)
- **Form Fields:**
  - First Name (text input)
  - Last Name (text input)
  - Email (email input)
  - Role Selection (dropdown)
  - Password (password input)
  - Confirm Password (password input)
  - Terms Checkbox
- **Buttons:**
  - Sign Up (primary)
  - Sign In Link (secondary)
- **Validation:** All fields required
- **Responsive:** Full-width form on mobile

### Sign In Page (/signin)
- **Form Fields:**
  - Email (email input)
  - Password (password input)
- **Buttons:**
  - Sign In (primary)
  - Sign Up Link (secondary)
- **Responsive:** Full-width form on mobile

### About Page (/about)
- **Mission Section** - Main value proposition
- **What We Do** - Bullet points of services
- **Core Values** - 4-box grid with descriptions
- **Contact Info** - Email, phone, address
- **Responsive** - Stacks on mobile

### Terms Page (/terms)
- **8 Sections** - Standard terms content
- **Scrollable** - Long-form content
- **Professional** - Legal formatting
- **Responsive** - Full-width on mobile

### Privacy Page (/privacy)
- **8 Sections** - Standard privacy content
- **Data Types** - Clearly outlined
- **Rights** - User rights listed
- **Contact** - Privacy officer info
- **Responsive** - Full-width on mobile

### Cookies Page (/cookies)
- **Cookie Types:**
  - Essential (always enabled)
  - Analytics (toggleable)
  - Marketing (toggleable)
  - Personalization (toggleable)
- **Buttons:**
  - Save Preferences
  - Reset to Essential
- **Storage:** localStorage for preferences
- **Responsive** - Full-width on mobile

### Dashboard Page (/dashboard)
- **Requires:** Valid JWT token
- **Redirects to /signin:** If no token
- **Profile Card** - User information display
- **Quick Actions** - Different for Entrepreneurs vs Investors
- **Statistics** - 4-stat cards
- **Responsive** - Multi-column on desktop, single on mobile

---

## URL Structure

```
Base URL: http://localhost:5173 (development)
          https://billnet.com (production)

Public Routes:
  /                      → Home page
  /signin                → Sign in page
  /signup                → Sign up page
  /about                 → About page
  /terms                 → Terms of service
  /privacy               → Privacy policy
  /cookies               → Cookie settings

Protected Routes:
  /dashboard             → User dashboard (requires auth)

Future Routes:
  /dashboard/profile     → Profile editing
  /dashboard/ideas       → Manage ideas (entrepreneurs)
  /dashboard/investments → Manage investments (investors)
  /dashboard/messages    → Messaging interface
```

---

## Component Reusability

### Shared Components
```
Navbar
├── Used on: All pages
├── Props: None (checks localStorage internally)
└── Features: Mobile menu, responsive

Footer
├── Used on: All pages
├── Props: None
└── Features: Links, contact info, socials

Layout
├── Used on: Every page via App.tsx
├── Props: children (React.ReactNode)
└── Features: Wraps Navbar, Footer, content
```

### Form Components
```
Sign Up Form
├── Fields: 7 inputs
├── Validation: Frontend + Backend
└── Submission: POST /api/auth/signup

Sign In Form
├── Fields: 2 inputs
├── Validation: Frontend + Backend
└── Submission: POST /api/auth/signin
```

---

## State Management

### Global State (localStorage)
```
token: string (JWT)
  ├── Set on: Sign up / Sign in
  ├── Used for: API authentication
  ├── Cleared on: Logout / Token expiration
  └── Access: getAuthHeaders() in api.ts

cookie_analytics: boolean
cookie_marketing: boolean
cookie_personalization: boolean
  ├── Set on: Cookie settings page
  ├── Used for: User preferences
  └── Access: Direct localStorage access
```

### Component State
```
Home Page: Static content
Sign In Page: email, password, isLoading
Sign Up Page: formData (7 fields), isLoading
Dashboard Page: user, isLoading
```

---

## API Integration Points

### Frontend → Backend Communication

| Page | Endpoint | Method | Purpose |
|------|----------|--------|---------|
| Sign Up | /api/auth/signup | POST | Create account |
| Sign In | /api/auth/signin | POST | Login user |
| Dashboard | /api/user/profile | GET | Get user info |

---

## Mobile Responsiveness Breakpoints

```
Mobile (< 768px)
├── Single column layout
├── Hamburger menu
├── Full-width forms
└── Stacked cards

Tablet (768px - 1024px)
├── 2-column layout
├── Horizontal menu
├── Adjusted spacing
└── Side-by-side forms

Desktop (> 1024px)
├── 3+ column layout
├── Full navbar
├── Optimized spacing
└── Multi-column forms
```

---

## Authentication & Authorization

### Public Access
- Home page
- Sign In/Up pages
- About, Terms, Privacy, Cookies

### Protected Access
- Dashboard (requires valid token)

### Role-Based Features (Frontend)
```
Entrepreneur Dashboard Shows:
├── Post an Idea
├── My Ideas
└── Messages

Investor Dashboard Shows:
├── Browse Ideas
├── Saved Ideas
└── My Portfolio
```

---

## Error Handling Flows

### Sign In Errors
```
Invalid Email → Error message displayed
Invalid Password → Error message displayed
Server Error → General error message
Network Error → Connection error message
```

### Sign Up Errors
```
Email Exists → "Email already registered"
Password Mismatch → "Passwords don't match"
Weak Password → "Password too weak"
Missing Field → "This field is required"
```

### Dashboard Access Errors
```
No Token → Redirect to /signin
Invalid Token → Redirect to /signin
Expired Token → Redirect to /signin
Server Error → Error message
```

---

## Future Expansion Routes (Planned)

```
/dashboard/profile       → Edit profile
/dashboard/ideas         → Manage ideas (entrepreneurs)
/dashboard/ideas/new     → Post new idea
/dashboard/ideas/:id     → View idea details
/dashboard/investments   → My investments (investors)
/dashboard/messages      → Messaging interface
/dashboard/messages/:id  → Chat with user
/search                  → Advanced search
/ideas/:id               → Public idea view
/user/:id                → Public user profile
/settings                → User settings
/admin                   → Admin dashboard (future)
```

---

## Performance Optimization

### Code Splitting Opportunities
- Dashboard component (lazy load)
- About/Terms/Privacy pages (lazy load)
- Message component (when added)

### Caching Strategy
```
Navbar: Cache busted on logout
User profile: Cache 5 minutes
Ideas list: Cache 10 minutes
Static pages: Cache 1 hour
```

---

## Security Considerations

### Frontend Security
✅ No hardcoded credentials
✅ Token in localStorage (secure, not in URL)
✅ Password inputs masked
✅ Form validation
✅ XSS prevention (React auto-escape)

### Backend Security (Required)
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] JWT validation
- [ ] HTTPS enforcement
- [ ] Secure headers

---

## Browser Compatibility

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Accessibility Features

✅ Semantic HTML
✅ ARIA labels (where needed)
✅ Keyboard navigation
✅ Form labels
✅ Color contrast
✅ Mobile touch targets
✅ Screen reader friendly

---

## Site Statistics

| Metric | Value |
|--------|-------|
| **Total Pages** | 8 |
| **Public Pages** | 7 |
| **Protected Pages** | 1 |
| **Components** | 11 |
| **Routes** | 8 |
| **User Roles** | 2 (Entrepreneur, Investor) |
| **Forms** | 3 (Sign Up, Sign In, Cookies) |
| **API Endpoints (Ready)** | 12+ |

---

## User Journey Time Estimates

| Action | Time |
|--------|------|
| **View home page** | 5-10 seconds |
| **Sign up** | 2-3 minutes |
| **First login** | 1-2 minutes |
| **View dashboard** | 30 seconds |
| **Read about page** | 2-5 minutes |
| **Review privacy policy** | 5-10 minutes |
| **Adjust cookie settings** | 1 minute |

---

## Content Overview

```
Total Text: ~15,000 words
├── Home: 200 words
├── About: 800 words
├── Terms: 2,000 words
├── Privacy: 1,800 words
├── Cookies: 500 words
├── Dashboard: 300 words
├── Sign In/Up: 400 words
└── Help/Tooltips: 200 words

Total Code: ~2,500+ lines
├── Components: 500 lines
├── Pages: 1,800 lines
├── Utilities: 200 lines
└── Config: 50 lines
```

---

**Last Updated:** January 21, 2026

This site map provides a complete overview of BillNet's structure and navigation. Use it as a reference when developing, deploying, or extending the platform.
