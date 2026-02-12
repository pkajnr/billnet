# QUICK REFERENCE - EXPLORER PAGE & NOTIFICATIONS

## Explorer Page Button Guide

| Button | Function | Working? | Notes |
|--------|----------|----------|-------|
| 🔍 Search | `handleSearch()` | ✅ | Full-text search |
| ⚙️ Filters | `setShowFilters()` | ✅ | Show/hide filter panel |
| 📁 Category | Filter by category | ✅ | tech, finance, health, retail |
| 📊 Sort | `setSortBy()` | ✅ | Latest, Trending, Most Funded |
| Clear | `handleClearFilters()` | ✅ | Reset all filters |
| ❤️ Save | `toggleFavorite()` | ✅ | Add/remove favorite |
| 💬 Comment | `toggleComments()` | ✅ | Show/hide comments |
| 💰 Invest | `handleBidClick()` | ✅ | Open bidding modal |
| 🔗 Share | `handleShare()` | ✅ | Copy link or native share |
| 🚩 Report | `handleReport()` | ✅ | Report content |
| 👤 Follow | `toggleFollow()` | ✅ | Follow/unfollow user |

## Notification System Quick Start

### View Notifications
1. Look for 🔔 bell icon in top-right navbar
2. Click bell to open dropdown
3. See all recent notifications

### Manage Notifications
- **Mark as Read**: Click any notification
- **Delete**: Click × button
- **Mark All**: Click "Mark all as read" button
- **Close**: Click outside dropdown

### Notification Types
- 💰 Bid received on your idea
- 👤 User followed you
- 💬 Comment on your post
- ❤️ Someone favorited your post
- 📧 New message received

## Backend APIs Used

### Ideas & Posts
- `GET /api/ideas` - Load posts with pagination
- `POST /api/ideas/search` - Search with filters

### Social Features
- `POST /api/favorites/:ideaId` - Toggle favorite
- `POST /api/follows/:userId` - Toggle follow
- `POST /api/comments` - Add comment
- `GET /api/comments/:ideaId` - Get comments

### User & Wallet
- `GET /api/wallet/balance` - Check wallet
- `GET /api/user/profile` - Get user info

### Notifications (NEW)
- `GET /api/notifications` - Load notifications

## File Locations

### Frontend Components
- `frontend/src/pages/ExploreIdeas.tsx` - Main page (1045 lines)
- `frontend/src/components/Navbar.tsx` - With new notification dropdown

### Backend Endpoints
- `backend/index.js` - All API endpoints
  - Line 282: `initializeDatabaseTables()`
  - Line 2582: Notifications endpoint (NEW)

### Documentation
- `EXPLORER_PAGE_FUNCTIONS.md` - All functions detailed
- `NOTIFICATION_SYSTEM.md` - Notification feature details
- `FINAL_IMPLEMENTATION_STATUS.md` - Complete status report

## Hot Tips

💡 **Widget Composition:**
- Explore = Left Sidebar + Center Feed + Right Sidebar
- Left = Wallet + Filters + Who to Follow
- Center = Search + Posts + Comments
- Right = Trending + Suggestions

💡 **State Management:**
- `ideas` array - All loaded posts
- `favorites` array - User's favorite IDs
- `following` array - User's following IDs
- `comments` object - Cached comments per idea

💡 **Performance:**
- Infinite scroll with Intersection Observer
- 10 posts per page
- Lazy load comments on toggle
- Cache favorites and follows

💡 **Error Handling:**
- All functions have try-catch
- Toast notifications on error/success
- Console logging for debugging
- Loading states prevent duplicates

---

**Everything is working and tested!** ✅
