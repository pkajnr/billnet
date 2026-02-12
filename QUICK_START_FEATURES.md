# BillNet v2.0 - Quick Start Guide for New Features

## 🚀 For Users

### How to Find Users
1. In the feed, click any user's avatar or their name
2. View their profile at `/profile/:userId`
3. See their posted ideas and investments
4. Click "Follow" to follow them

### How to Search & Filter Ideas
1. In Explore Ideas feed
2. Type keywords in the search box
3. Click "⚙️ Filters" for more options
4. Select category, post type, funding range
5. Choose sort: Latest, 🔥 Trending, or 💰 Most Funded
6. Click "Search" or "Clear All Filters"

### How to See Trending Ideas
1. Go to Explore Ideas
2. Click "⚙️ Filters"
3. Click "🔥 Trending" button
4. Click "Search"
5. Most engaged ideas appear first

### How to Manage Your Bids
1. Go to "My Ideas" page
2. Click "MANAGE BIDS" button on your idea
3. Modal shows all bids received
4. Click "✓ Accept" or "✕ Reject"
5. See notification when complete

### How to Know When Something Happens
- Notifications appear in top-right corner
- Auto-dismiss after ~4 seconds
- Click × to dismiss immediately
- Green = success, Red = error, Blue = info, Orange = warning

---

## 🛠️ For Developers

### New Files Added
```
frontend/src/
  ├── pages/
  │   └── UserProfile.tsx          (NEW - User profile page)
  ├── components/
  │   ├── NotificationToast.tsx    (NEW - Notification system)
  │   └── BidManagementModal.tsx   (NEW - Bid management)
  └── App.tsx                       (UPDATED - /profile/:userId route)
```

### New Routes
- `/profile/:userId` - View user profile
- Search uses existing `/explore` route with filters

### New Backend Endpoints (Already Implemented)
```
GET  /api/users/:userId
GET  /api/users/:userId/ideas
GET  /api/users/:userId/investments
GET  /api/ideas/search
GET  /api/ideas/:ideaId/bids/list
PUT  /api/bids/:bidId/accept
PUT  /api/bids/:bidId/reject
```

### Using Notifications in Code
```typescript
import { Notification } from './components/NotificationToast';

// Success (4 sec auto-dismiss)
Notification.success('Bid Accepted', 'Your bid was accepted');

// Error (5 sec auto-dismiss)
Notification.error('Failed', 'Could not save');

// Info (4 sec auto-dismiss)
Notification.info('Saved', 'Favorite saved');

// Warning (5 sec auto-dismiss)
Notification.warning('Warning', 'Please verify email');
```

### Linking to User Profile
```typescript
// In a component:
onClick={() => window.location.href = `/profile/${userId}`}

// Or with React Router:
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate(`/profile/${userId}`);
```

### Calling Search Endpoint
```typescript
const searchIdeas = async (query: string) => {
  const params = new URLSearchParams({
    q: query,
    category: 'tech',
    minFunding: '10000',
    maxFunding: '500000',
    postType: 'idea',
    sortBy: 'trending',
    limit: '10',
    offset: '0'
  });
  
  const response = await fetch(
    `http://localhost:5000/api/ideas/search?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.json();
};
```

### Fetching User Profile
```typescript
const fetchProfile = async (userId: string) => {
  const response = await fetch(
    `http://localhost:5000/api/users/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const user = await response.json();
  // Returns: { id, first_name, last_name, email, role, bio, wallet_balance, created_at }
  return user;
};
```

### Managing Bids
```typescript
const acceptBid = async (bidId: number) => {
  const response = await fetch(
    `http://localhost:5000/api/bids/${bidId}/accept`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.json();
};

const rejectBid = async (bidId: number) => {
  const response = await fetch(
    `http://localhost:5000/api/bids/${bidId}/reject`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.json();
};
```

### Filter Query Parameters
```
?q=search_term          - Text search
&category=tech          - Category filter
&minFunding=10000       - Minimum funding
&maxFunding=500000      - Maximum funding
&postType=idea          - Type (idea, business, share)
&sortBy=trending        - Sort (latest, trending, funded)
&limit=10               - Results per page
&offset=0               - Pagination offset
```

---

## 📊 Data Structures

### User Profile Response
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "role": "entrepreneur",
  "bio": "Building amazing products",
  "wallet_balance": 5000,
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Bid Response (from bids/list endpoint)
```json
[
  {
    "id": 42,
    "bid_amount": 50000,
    "equity_percentage": 10,
    "status": "pending",
    "first_name": "Jane",
    "last_name": "Investor",
    "email": "jane@example.com"
  }
]
```

### Search Results Response
```json
[
  {
    "id": 1,
    "title": "AI Chat App",
    "category": "tech",
    "description": "Description here...",
    "funding_goal": 100000,
    "current_funding": 45000,
    "comment_count": 5,
    "favorite_count": 12,
    "bid_count": 3,
    "post_type": "idea"
  }
]
```

---

## 🧪 Testing Commands

### Test Search Endpoint
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/ideas/search?q=tech&category=tech&sortBy=trending"
```

### Test User Profile
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/users/1"
```

### Test Bid Management
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:5000/api/bids/42/accept
```

---

## ⚙️ Troubleshooting

### Search Not Working
- Verify backend endpoint is at `/api/ideas/search`
- Check that `isSearching` state is true
- Verify token is valid

### Notifications Not Showing
- Check `NotificationToast` is imported in `Layout.tsx`
- Verify `Notification.success()` is called correctly
- Check browser console for errors

### Profile Page 404
- Verify `/profile/:userId` route is in `App.tsx`
- Check URL is `/profile/123` (numeric ID)
- Verify user exists in database

### Bid Modal Won't Open
- Check idea ID is correct
- Verify you own the idea
- Check token has proper permissions

### Trending Empty
- Ideas need engagement (comments, favorites, bids)
- Check `comment_count`, `favorite_count`, `bid_count`
- Create engagement on test ideas first

---

## 📱 Mobile Considerations

All features are mobile responsive:
- Search bar adapts to small screens
- Filter panel stacks vertically on mobile
- Notifications adjust position for mobile
- Profile page scrolls on mobile
- Bid modal is scrollable on small screens

---

## 🔒 Security Reminders

- Always send JWT token in Authorization header
- Only show user's own profile edit options
- Bid management only for idea owners
- Search results are public (no auth required for read)
- All endpoints validate user permissions

---

## 📚 Full Documentation

See these files for complete details:
- `HIGH_PRIORITY_FEATURES.md` - Complete feature documentation
- `IMPLEMENTATION_COMPLETE.md` - Implementation details
- Backend README in `/backend/README.md`

---

## 🎯 Feature Checklist

- [x] User Profiles - View entrepreneur/investor profiles
- [x] Search & Filters - Find ideas by criteria
- [x] Notifications - Toast alerts for actions
- [x] Trending Feed - Discover hot ideas
- [x] Deal Management - Accept/reject bids
- [ ] Email Notifications (future)
- [ ] Bid Counter Offers (future)
- [ ] Saved Searches (future)
- [ ] User Badges (future)
- [ ] Activity Timeline (future)

---

## Quick Links

- **Explore Ideas**: [/explore](/explore)
- **My Ideas**: [/my-ideas](/my-ideas)
- **My Investments**: [/my-investments](/my-investments)
- **Profile**: [/profile](/profile)
- **User Profile**: [/profile/1](/profile/1) (replace 1 with user ID)
- **Post Idea**: [/post-idea](/post-idea)

---

## Support

If you need help:
1. Check this quick start guide
2. Review `HIGH_PRIORITY_FEATURES.md` for full documentation
3. Check backend logs for API errors
4. Verify database tables are initialized
5. Check browser console for client-side errors

---

**Version**: 2.0  
**Release Date**: 2024  
**Status**: ✅ Production Ready (After Testing)
