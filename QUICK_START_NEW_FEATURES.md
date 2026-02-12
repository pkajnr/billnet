# 🚀 BillNet Platform - Quick Start Guide

## What's New? ✨

Your investment platform now has **5 complete authenticated pages** with full backend support:

### 📱 New Pages for Users

1. **Explore Ideas** (`/explore`) - Browse investment opportunities
2. **Post Idea** (`/post-idea`) - Create new business ideas
3. **My Ideas** (`/my-ideas`) - Manage posted ideas
4. **My Investments** (`/my-investments`) - Track portfolio
5. **Messages** (`/messages`) - Communicate with other users

---

## 🎯 Quick Start

### Step 1: Start Backend Server
```bash
cd backend
npm start
```

**Expected Output:**
```
✓ Database connected successfully
✓ All tables created successfully
BillNet API server running on http://localhost:5000
```

### Step 2: Start Frontend Dev Server
```bash
cd frontend
npm run dev
```

**Access at:** `http://localhost:5173`

### Step 3: Test the Platform

#### As an Entrepreneur:
1. Sign up with role: **Entrepreneur**
2. Verify email (check console)
3. Go to Dashboard → **Post an Idea**
4. Fill in the form and submit
5. View your ideas in Dashboard → **My Ideas**
6. Receive messages from interested investors

#### As an Investor:
1. Sign up with role: **Investor**
2. Verify email (check console)
3. Go to Dashboard → **Browse Ideas**
4. Explore all available opportunities
5. Click **INVEST NOW** to track investments
6. View your portfolio in Dashboard → **My Portfolio**
7. Message entrepreneurs about opportunities

---

## 📊 Dashboard Quick Actions

Once logged in, the Dashboard shows **role-specific buttons**:

### Entrepreneur View:
- ✍️ **Post an Idea** - Share your business concept
- 📋 **My Ideas** - Manage your posted ideas
- 💬 **Messages** - Connect with investors

### Investor View:
- 🔍 **Browse Ideas** - Find opportunities
- 📈 **My Portfolio** - Track investments
- 💬 **Messages** - Talk to entrepreneurs

---

## 🔌 API Endpoints Overview

All endpoints require JWT token in header:
```
Authorization: Bearer {your_jwt_token}
```

### Ideas Management
- `GET /api/ideas` - List all opportunities
- `GET /api/ideas/my-ideas` - Your posted ideas
- `POST /api/ideas` - Post new idea
- `DELETE /api/ideas/{id}` - Delete idea

### Investment Tracking
- `GET /api/investments/my-investments` - Your investments
- `POST /api/investments` - Make investment

### Messaging
- `GET /api/messages` - Get messages
- `PUT /api/messages/{id}/read` - Mark as read
- `POST /api/messages/reply` - Send message

---

## 🗄️ Database Schema

### users table
```
- id (PRIMARY KEY)
- first_name, last_name
- email (UNIQUE), password_hash
- role (entrepreneur/investor)
- is_email_verified, verification_token
- created_at, updated_at
```

### ideas table
```
- id (PRIMARY KEY)
- user_id (FK to users)
- title, description, category
- funding_goal, current_funding
- status (active/funded/closed)
- created_at, updated_at
```

### investments table
```
- id (PRIMARY KEY)
- idea_id (FK to ideas)
- investor_id (FK to users)
- amount, status
- created_at, updated_at
```

### messages table
```
- id (PRIMARY KEY)
- sender_id, recipient_id (FK to users)
- subject, content
- is_read, read_at
- related_idea_id (FK to ideas)
- created_at
```

---

## 🎨 Design Features

All pages include:
- ✅ Clean white background (`bg-white`)
- ✅ Subtle gray borders (`border-gray-200`)
- ✅ Yellow accent color (`text-yellow-600`)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Loading states with SkeletonLoader
- ✅ Error messages and validation
- ✅ Smooth transitions and hover effects

---

## 🧪 Testing Scenarios

### Scenario 1: Post Idea & Get Interest
1. Sign up as Entrepreneur
2. Post a business idea (e.g., "AI Chat Platform")
3. Sign up as Investor (different account)
4. Browse ideas and see the posted idea
5. "Invest" (will add to portfolio)
6. Send message to entrepreneur

### Scenario 2: Track Portfolio
1. As investor, go to My Investments
2. See stats: Total Invested, Active Deals, Portfolio Value
3. View investment history
4. Filter by status

### Scenario 3: Manage Ideas
1. As entrepreneur, go to My Ideas
2. See all your posted ideas with funding progress
3. Monitor which ideas are attracting investors
4. Delete ideas if needed

### Scenario 4: Messaging
1. Go to Messages page
2. See all messages from other users
3. Click to view full message
4. Reply to messages
5. Mark as read/unread

---

## 🔐 Security Features

- ✅ JWT authentication on all protected routes
- ✅ Password hashing with bcryptjs
- ✅ Email verification required
- ✅ Role-based access control (entrepreneur/investor)
- ✅ User can only modify/delete own data
- ✅ CORS enabled for cross-origin requests
- ✅ Input validation on all endpoints

---

## 📝 Sample API Requests

### Post an Idea
```bash
curl -X POST http://localhost:5000/api/ideas \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Chat Platform",
    "description": "A revolutionary AI chat application",
    "category": "technology",
    "fundingGoal": 500000
  }'
```

### Get All Ideas
```bash
curl -X GET http://localhost:5000/api/ideas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Make Investment
```bash
curl -X POST http://localhost:5000/api/investments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ideaId": 1,
    "amount": 50000
  }'
```

### Send Message
```bash
curl -X POST http://localhost:5000/api/messages/reply \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": 2,
    "subject": "Investment Interest",
    "content": "I'm interested in your idea"
  }'
```

---

## 🛠️ Troubleshooting

### Issue: "Database connection error"
- ✅ Check PostgreSQL is running
- ✅ Verify connection credentials in `backend/index.js`
- ✅ Ensure `billnet` database exists

### Issue: "Unauthorized" (401)
- ✅ Check JWT token is included in header
- ✅ Verify token hasn't expired (7 days)
- ✅ Sign in again to get fresh token

### Issue: "Idea not found" (404)
- ✅ Verify idea ID exists
- ✅ Check that idea belongs to current user (for delete)

### Issue: Pages not showing data
- ✅ Check browser console for errors
- ✅ Verify JWT token in localStorage
- ✅ Check backend is running and responding

---

## 📁 Project Structure

```
bilnet/
├── backend/
│   ├── index.js              ← API server (12 endpoints)
│   ├── database.sql          ← SQL migrations
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx           ← Main app (routing updated)
│   │   ├── pages/
│   │   │   ├── ExploreIdeas.tsx      ← NEW
│   │   │   ├── PostIdea.tsx          ← NEW
│   │   │   ├── MyIdeas.tsx           ← NEW
│   │   │   ├── MyInvestments.tsx     ← NEW
│   │   │   ├── Messages.tsx          ← NEW
│   │   │   ├── Dashboard.tsx         ← UPDATED
│   │   │   └── ... (other pages)
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── SkeletonLoader.tsx
│   │   └── libs/
│   │       └── api.ts
│   └── package.json
└── PLATFORM_SETUP_COMPLETE.md
```

---

## 🎓 Learning Path

1. **User Auth Flow**: Sign up → Verify Email → Sign In
2. **Entrepreneur Flow**: Post Idea → Track Funding → Receive Messages
3. **Investor Flow**: Browse Ideas → Invest → Manage Portfolio → Message
4. **Data Flow**: Frontend → Backend API → PostgreSQL → Response

---

## 🚀 Next Steps

After confirming everything works:

1. **Styling**: Customize colors, fonts, spacing
2. **Features**: Add edit idea, investment details, real-time notifications
3. **Payments**: Integrate Stripe for actual investments
4. **Analytics**: Add dashboard metrics and charts
5. **Performance**: Optimize queries, add caching
6. **Testing**: Add unit and integration tests
7. **Deployment**: Deploy to production (Vercel, Heroku, AWS)

---

## 📞 Support

For issues or questions:
1. Check console logs (browser DevTools & backend terminal)
2. Verify all services are running
3. Check database tables exist
4. Review API endpoint responses
5. Check authentication token is valid

---

**Your investment platform is now fully functional!** 🎉

Start exploring and building with BillNet.
