# BillNet Platform Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER BROWSER (CLIENT)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/JSON
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  REACT FRONTEND (Port 5173)                      │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Layout Component                                            │  │
│ │ ├─ Navbar (Navigation)                                     │  │
│ │ ├─ Footer                                                  │  │
│ │ └─ Main Content Area                                       │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ PAGES (Router):                                                 │
│ ├─ Home (/)                                                     │
│ ├─ SignIn & SignUp                                             │
│ ├─ Dashboard (/dashboard)                                      │
│ ├─ Profile (/profile)                                          │
│ │                                                              │
│ ├─ AUTHENTICATED PAGES (NEW):                                 │
│ │  ├─ ExploreIdeas (/explore)           [Investor View]      │
│ │  ├─ PostIdea (/post-idea)             [Entrepreneur]       │
│ │  ├─ MyIdeas (/my-ideas)               [Entrepreneur]       │
│ │  ├─ MyInvestments (/my-investments)   [Investor]           │
│ │  └─ Messages (/messages)              [Both]               │
│ │                                                              │
│ ├─ About, Terms, Privacy, Cookies                             │
│ └─ VerifyEmail                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ JWT Token in Headers
                              │ Fetch API / Axios
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               EXPRESS API SERVER (Port 5000)                     │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ MIDDLEWARE STACK                                           │  │
│ │ ├─ CORS (Cross-Origin)                                    │  │
│ │ ├─ JSON Parser                                            │  │
│ │ └─ Authentication (JWT Verification)                      │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ API ROUTES:                                                     │
│                                                                   │
│ ▶ AUTHENTICATION (Public)                                      │
│  ├─ POST /api/auth/signup          Create account            │
│  ├─ POST /api/auth/signin          Login                      │
│  └─ GET /api/auth/verify-email     Email verification        │
│                                                                   │
│ ▶ USER MANAGEMENT (Protected)                                  │
│  ├─ GET /api/user/profile          Get profile               │
│  └─ PUT /api/user/profile          Update profile            │
│                                                                   │
│ ▶ IDEAS (Protected)                                            │
│  ├─ GET /api/ideas                 All ideas                 │
│  ├─ GET /api/ideas/my-ideas        User's ideas             │
│  ├─ POST /api/ideas                Create idea              │
│  └─ DELETE /api/ideas/:id          Delete idea              │
│                                                                   │
│ ▶ INVESTMENTS (Protected)                                      │
│  ├─ GET /api/investments/my-investments   Get investments    │
│  └─ POST /api/investments          Create investment         │
│                                                                   │
│ ▶ MESSAGES (Protected)                                         │
│  ├─ GET /api/messages              Get messages              │
│  ├─ PUT /api/messages/:id/read     Mark as read              │
│  └─ POST /api/messages/reply       Send message              │
│                                                                   │
│ ▶ ERROR HANDLING                                               │
│  └─ Centralized error middleware                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQL Queries
                              │ Connection Pooling
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            POSTGRESQL DATABASE (Port 5432)                       │
│ Database: billnet                                               │
│                                                                   │
│ TABLES:                                                         │
│                                                                   │
│ ▶ users                                                         │
│  ├─ id (PK)                                                    │
│  ├─ first_name, last_name, email (UNIQUE)                   │
│  ├─ password_hash                                             │
│  ├─ role (entrepreneur | investor)                            │
│  ├─ profile_image, bio                                        │
│  ├─ is_email_verified, email_verified_at                     │
│  ├─ verification_token                                        │
│  └─ created_at, updated_at                                    │
│  INDEXES: email, role, verification_token                    │
│                                                                   │
│ ▶ ideas (NEW)                                                  │
│  ├─ id (PK)                                                    │
│  ├─ user_id (FK → users)                                      │
│  ├─ title, description, category                             │
│  ├─ funding_goal, current_funding                            │
│  ├─ status (active | funded | closed)                        │
│  └─ created_at, updated_at                                    │
│  INDEXES: user_id, status                                    │
│                                                                   │
│ ▶ investments (NEW)                                            │
│  ├─ id (PK)                                                    │
│  ├─ idea_id (FK → ideas)                                      │
│  ├─ investor_id (FK → users)                                  │
│  ├─ amount, status (pending | completed | cancelled)         │
│  └─ created_at, updated_at                                    │
│  INDEXES: idea_id, investor_id                               │
│                                                                   │
│ ▶ messages (NEW)                                               │
│  ├─ id (PK)                                                    │
│  ├─ sender_id (FK → users)                                    │
│  ├─ recipient_id (FK → users)                                 │
│  ├─ subject, content                                          │
│  ├─ is_read, read_at                                          │
│  ├─ related_idea_id (FK → ideas, nullable)                    │
│  └─ created_at                                                 │
│  INDEXES: sender_id, recipient_id, is_read                   │
│                                                                   │
│ ON STARTUP:                                                    │
│  └─ Auto-creates all tables if not exist                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Authentication Flow
```
User                Frontend              Backend              Database
  │                    │                     │                    │
  ├─ Enter Credentials ─→                   │                    │
  │                    ├─ POST /auth/signup ─→                   │
  │                    │                     ├─ Hash Password    │
  │                    │                     ├─ Generate Token ──→│
  │                    │  JWT Token + User ←─┤                   │
  │                    ├─ Store Token       │                    │
  │                    ├─ Redirect to Email │                    │
  │                    │   Verification    │                    │
  │                    │                   │                    │
  ├─ Verify Email Link ─→                  │                    │
  │                    ├─ GET /auth/verify  ─→                   │
  │                    │                     ├─ Update DB ──────→│
  │                    │  Success Message ←─┤                   │
  │                    ├─ Redirect to SignIn │                   │
  │                    │                     │                    │
  ├─ Sign In          ─→                    │                    │
  │                    ├─ POST /auth/signin ─→                   │
  │                    │                     ├─ Verify Password  │
  │                    │                     ├─ Generate JWT ────→│
  │                    │ JWT Token + User ←─┤                   │
  │                    ├─ Store Token       │                    │
  │                    ├─ Redirect Dashboard │                   │
  │                    │                     │                    │
```

### 2. Post Idea Flow (Entrepreneur)
```
Entrepreneur         Frontend              Backend              Database
    │                   │                    │                     │
    ├─ Click Post Idea ─→                   │                     │
    │                   ├─ Show Form         │                     │
    │                   │                    │                     │
    ├─ Fill Form       ─→                   │                     │
    │                   ├─ Validate         │                     │
    │                   │                    │                     │
    ├─ Submit          ─→                   │                     │
    │                   ├─ POST /api/ideas   ─→                    │
    │                   │  + JWT Token       ├─ Verify Auth       │
    │                   │                     ├─ Validate Input   │
    │                   │                     ├─ Insert Idea ────→│
    │                   │  Success + ID   ←─┤                     │
    │                   ├─ Show Success Msg │                     │
    │                   ├─ Redirect to      │                     │
    │                   │  /my-ideas        │                     │
    │                   │                    │                     │
    ├─ View Posted Idea ─→                   │                     │
    │                   ├─ GET /api/ideas/   ─→                    │
    │                   │   my-ideas          ├─ Query Ideas ────→│
    │                   │  + JWT Token        ├─ Join with User   │
    │                   │                     │  data              │
    │                   │ Ideas List ←──────┤                     │
    │                   ├─ Display All Ideas │                     │
    │                   │                    │                     │
```

### 3. Browse Ideas Flow (Investor)
```
Investor            Frontend              Backend              Database
   │                   │                    │                     │
   ├─ Click Browse ───→                    │                     │
   │                   ├─ Show Ideas        │                     │
   │                   ├─ Show Filters      │                     │
   │                   │                    │                     │
   ├─ Search/Filter ──→                    │                     │
   │                   ├─ GET /api/ideas    ─→                    │
   │                   │  + JWT Token       ├─ Verify Auth       │
   │                   │  + Query Params    ├─ Query All Ideas   │
   │                   │                    ├─ Join with Users ──→│
   │                   │ Ideas Array ←──────┤                     │
   │                   ├─ Filter Locally    │                     │
   │                   ├─ Display Grid      │                     │
   │                   │ with Progress Bars │                     │
   │                   │                    │                     │
   ├─ Click Invest ───→                    │                     │
   │                   ├─ POST /api/        ─→                    │
   │                   │  investments        ├─ Verify Auth       │
   │                   │  + JWT Token       ├─ Verify Idea       │
   │                   │  + Amount          ├─ Insert Investment │
   │                   │                    ├─ Update Idea       │
   │                   │  Success ←─────────┤  current_funding ──→│
   │                   ├─ Add to Portfolio  │                     │
   │                   │                    │                     │
```

### 4. Investment Tracking Flow (Investor)
```
Investor            Frontend              Backend              Database
   │                   │                    │                    │
   ├─ View Portfolio ──→                   │                    │
   │                   ├─ Show Empty State  │                    │
   │                   │ or Load Screen    │                    │
   │                   │                    │                    │
   │                   ├─ GET /api/         ─→                   │
   │                   │  investments/       ├─ Verify Auth      │
   │                   │  my-investments     ├─ Query Investments│
   │                   │  + JWT Token        ├─ Join Ideas       │
   │                   │                     ├─ Join Entrepreneur│
   │                   │ Investment Data ←──┤  data              │
   │                   ├─ Calculate Stats   │                    │
   │                   │  - Total Invested  │                    │
   │                   │  - Active Deals    │                    │
   │                   │  - Portfolio Value │                    │
   │                   ├─ Display Dashboard │                    │
   │                   │  with stats cards  │                    │
   │                   │  and investment    │                    │
   │                   │  list              │                    │
   │                   │                    │                    │
```

### 5. Messaging Flow (Both Users)
```
User A              Frontend              Backend              Database
(Entrepreneur)         │                    │                     │
  │                    │                    │                     │
  ├─ Send Message ───→ │                    │                     │
  │                    ├─ POST /api/         ─→                    │
  │                    │  messages/reply     ├─ Verify Auth       │
  │                    │  + JWT Token       ├─ Insert Message ───→│
  │                    │  + Recipient ID    │                     │
  │                    │  + Content         │                     │
  │                    │ Success ←──────────┤                     │
  │                    ├─ Clear Form       │                     │
  │                    ├─ Show Sent        │                     │
  │                    │                    │                     │
  │                    │                    │                     │
                                  ↓↓↓ TIME PASSES ↓↓↓
                                  │                     │
                                                       User B
                                                    (Investor)
User B              Frontend              Backend              Database
(Investor)            │                     │                     │
  │                   │                     │                     │
  ├─ Go to Messages ─→ │                     │                     │
  │                   ├─ GET /api/messages   ─→                    │
  │                   │  + JWT Token        ├─ Verify Auth        │
  │                   │                     ├─ Query Messages ────→│
  │                   │                     ├─ Join Senders       │
  │                   │ Message List ←──────┤  data               │
  │                   ├─ Show Unread Count  │                     │
  │                   ├─ Highlight Unread   │                     │
  │                   │ Messages            │                     │
  │                   │                     │                     │
  ├─ Click Message ──→ │                     │                     │
  │                   ├─ PUT /api/messages/  ─→                    │
  │                   │  :id/read            ├─ Mark is_read ────→│
  │                   │  + JWT Token        ├─ Update read_at    │
  │                   │ Success ←───────────┤                     │
  │                   ├─ Show Full Message   │                     │
  │                   ├─ Show Reply Form     │                     │
  │                   │                     │                     │
  ├─ Send Reply ────→ │                     │                     │
  │                   ├─ POST /api/          ─→                    │
  │                   │  messages/reply      ├─ Insert Reply ────→│
  │                   │  + JWT Token        │                     │
  │                   │  + Recipient ID    │                     │
  │                   │  + Content         │                     │
  │                   │ Success ←───────────┤                     │
  │                   ├─ Show Sent          │                     │
  │                   │                     │                     │
```

---

## Component Hierarchy

```
App (Main Router)
│
├─ Layout
│  ├─ Navbar
│  │  ├─ Logo
│  │  ├─ Nav Links (role-based)
│  │  ├─ Profile Menu
│  │  └─ Logout
│  │
│  ├─ Main Content (Routed Page)
│  │  ├─ Home
│  │  ├─ SignUp
│  │  ├─ SignIn
│  │  ├─ VerifyEmail
│  │  ├─ Dashboard
│  │  │  ├─ Profile Card
│  │  │  ├─ Quick Actions (role-specific)
│  │  │  ├─ Featured Opportunities
│  │  │  └─ Portfolio Stats
│  │  │
│  │  ├─ Profile
│  │  │  ├─ Profile Form
│  │  │  └─ Change Password Form
│  │  │
│  │  ├─ ExploreIdeas (NEW)
│  │  │  ├─ Search Bar
│  │  │  ├─ Filter Controls
│  │  │  └─ Ideas Grid
│  │  │      └─ Idea Card (x N)
│  │  │
│  │  ├─ PostIdea (NEW)
│  │  │  ├─ Idea Form
│  │  │  ├─ Title Input
│  │  │  ├─ Description Textarea
│  │  │  ├─ Category Select
│  │  │  ├─ Funding Goal Input
│  │  │  └─ Submit Button
│  │  │
│  │  ├─ MyIdeas (NEW)
│  │  │  ├─ Filter Buttons
│  │  │  ├─ Ideas List
│  │  │  │  └─ Idea Row (x N)
│  │  │  │      ├─ Progress Bar
│  │  │  │      ├─ Edit Button
│  │  │  │      ├─ View Button
│  │  │  │      └─ Delete Button
│  │  │  └─ Post New Idea CTA
│  │  │
│  │  ├─ MyInvestments (NEW)
│  │  │  ├─ Stats Cards (3)
│  │  │  ├─ Filter Controls
│  │  │  ├─ Investments List
│  │  │  │  └─ Investment Row (x N)
│  │  │  │      ├─ Idea Title
│  │  │  │      ├─ Entrepreneur Name
│  │  │  │      ├─ Amount
│  │  │  │      ├─ Status Badge
│  │  │  │      └─ Contact Button
│  │  │  └─ Empty State with CTA
│  │  │
│  │  ├─ Messages (NEW)
│  │  │  ├─ Filter Tabs
│  │  │  ├─ Message List (Left Column)
│  │  │  │  └─ Message Item (x N)
│  │  │  │      ├─ Sender Name
│  │  │  │      ├─ Preview Text
│  │  │  │      ├─ Timestamp
│  │  │  │      ├─ Unread Indicator
│  │  │  │      └─ Status Badge
│  │  │  │
│  │  │  └─ Message Detail (Right Column)
│  │  │      ├─ Sender Info
│  │  │      ├─ Subject
│  │  │      ├─ Content
│  │  │      ├─ Timestamp
│  │  │      └─ Reply Form
│  │  │
│  │  └─ Static Pages (About, Terms, Privacy, etc.)
│  │
│  └─ Footer
│     ├─ Links
│     ├─ Social Media
│     └─ Copyright
│
└─ SkeletonLoader (Reusable Loading Component)
```

---

## Technology Stack

```
┌─────────────────────────────────────────────┐
│         FRONTEND TECHNOLOGIES               │
├─────────────────────────────────────────────┤
│ React 19.2.0         - UI Framework         │
│ TypeScript 5.9.3     - Type Safety          │
│ Vite 7.2.4          - Build Tool            │
│ Tailwind CSS 4.1.18  - Styling              │
│ Fetch API           - HTTP Requests        │
│ React Router        - Navigation (Client)  │
│ LocalStorage API    - Token Storage        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│        BACKEND TECHNOLOGIES                 │
├─────────────────────────────────────────────┤
│ Node.js              - Runtime              │
│ Express 5.2.1       - Web Framework         │
│ PostgreSQL          - Database              │
│ JWT                 - Authentication        │
│ bcryptjs            - Password Hashing      │
│ CORS                - Cross-Origin Support  │
│ pg (node-postgres)  - Database Driver       │
│ Nodemon             - Development Tool      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│       DEPLOYMENT ARCHITECTURE               │
├─────────────────────────────────────────────┤
│ Frontend  → Vercel / Netlify / GitHub Pages│
│ Backend   → Heroku / AWS / Digital Ocean   │
│ Database  → Managed PostgreSQL             │
│ Storage   → AWS S3 / CloudStorage          │
│ CDN       → Cloudflare / Fastly            │
└─────────────────────────────────────────────┘
```

---

## Security Model

```
┌─────────────────────────────────────────────────────┐
│              AUTHENTICATION FLOW                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. User Credentials                                │
│     ↓                                               │
│  2. Backend: Hash & Verify                          │
│     ├─ bcryptjs (password hashing)                 │
│     └─ Database lookup                             │
│     ↓                                               │
│  3. JWT Generation                                  │
│     ├─ Algorithm: HS256                            │
│     ├─ Expiration: 7 days                          │
│     ├─ Payload: user_id, email, role              │
│     └─ Secret: Environment variable                │
│     ↓                                               │
│  4. Token Storage (Frontend)                        │
│     └─ localStorage (with auto-refresh)            │
│     ↓                                               │
│  5. Protected Requests                              │
│     ├─ Header: Authorization: Bearer {token}       │
│     └─ Backend: Verify token middleware            │
│     ↓                                               │
│  6. Token Validation                                │
│     ├─ Signature verification                      │
│     ├─ Expiration check                            │
│     └─ Return 401 if invalid                       │
│                                                     │
└─────────────────────────────────────────────────────┘

ROLES & PERMISSIONS:
├─ entrepreneur
│  ├─ POST /api/ideas (create own ideas)
│  ├─ GET /api/ideas/my-ideas (view own ideas)
│  ├─ DELETE /api/ideas/:id (delete own ideas)
│  ├─ GET /api/messages (receive messages)
│  └─ POST /api/messages/reply (send replies)
│
└─ investor
   ├─ GET /api/ideas (browse all ideas)
   ├─ POST /api/investments (make investments)
   ├─ GET /api/investments/my-investments
   ├─ GET /api/messages (receive messages)
   └─ POST /api/messages/reply (send replies)

USER DATA ISOLATION:
├─ Can only access own profile
├─ Can only delete own ideas
├─ Can only see own investments
├─ Can only receive own messages
└─ Database level: WHERE user_id = req.user.id
```

---

**This architecture provides a scalable, secure, and maintainable foundation for the BillNet investment platform.**
