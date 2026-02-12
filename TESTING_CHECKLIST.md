# 🧪 BillNet Platform - Testing Checklist

## Pre-Launch Testing Checklist

Use this checklist to verify all functionality before deploying to production.

---

## ✅ Setup & Infrastructure

- [ ] PostgreSQL database running on localhost:5432
- [ ] Backend dependencies installed (`npm install` in `/backend`)
- [ ] Frontend dependencies installed (`npm install` in `/frontend`)
- [ ] Backend starts without errors (`npm start`)
  - [ ] Database connection successful
  - [ ] Users table created automatically
  - [ ] Ideas table created automatically
  - [ ] Investments table created automatically
  - [ ] Messages table created automatically
  - [ ] All indexes created
- [ ] Frontend dev server starts (`npm run dev`)
  - [ ] Accessible at http://localhost:5173
  - [ ] No console errors

---

## ✅ Authentication System

### Sign Up Flow
- [ ] Navigate to Sign Up page
- [ ] Form displays all fields (first name, last name, email, password, role)
- [ ] Role dropdown shows: Entrepreneur, Investor
- [ ] Submit with valid data
  - [ ] Account created successfully
  - [ ] Email verification page shown
  - [ ] User redirected to verification page
- [ ] Submit with missing fields
  - [ ] Error message displayed
  - [ ] Form persists data
- [ ] Submit with invalid email format
  - [ ] Error message shown
- [ ] Submit with duplicate email
  - [ ] Error message displayed
- [ ] Verification email link shown in console
  - [ ] Link format: `http://localhost:5000/api/auth/verify-email?token={token}`

### Email Verification Flow
- [ ] Verification page displays waiting message
- [ ] Click verification link from console
- [ ] Page shows "Email verified successfully"
- [ ] User can now sign in

### Sign In Flow
- [ ] Navigate to Sign In page
- [ ] Form displays email and password fields
- [ ] Submit with unverified account
  - [ ] Error: "Please verify your email first"
- [ ] Submit with verified account and correct password
  - [ ] JWT token stored in localStorage
  - [ ] User redirected to Dashboard
- [ ] Submit with incorrect password
  - [ ] Error: "Invalid credentials"
- [ ] Submit with non-existent email
  - [ ] Error: "Invalid credentials"
- [ ] Check localStorage contains 'token' after sign in

---

## ✅ Dashboard Page

### Entrepreneur Dashboard
- [ ] Dashboard loads without errors
- [ ] User profile card displays:
  - [ ] First name, last name
  - [ ] Email address
  - [ ] Profile image (if set)
- [ ] "Edit Profile" button visible
- [ ] Quick Actions section shows:
  - [ ] "Post an Idea" button → links to `/post-idea`
  - [ ] "My Ideas" button → links to `/my-ideas`
  - [ ] "Messages" button → links to `/messages`
- [ ] Featured Opportunities section displays (3 sample cards)
- [ ] Portfolio stats section visible

### Investor Dashboard
- [ ] Dashboard loads without errors
- [ ] User profile card displays correctly
- [ ] Quick Actions section shows:
  - [ ] "Browse Ideas" button → links to `/explore`
  - [ ] "My Portfolio" button → links to `/my-investments`
  - [ ] "Messages" button → links to `/messages`
- [ ] Featured Opportunities section displays (3 sample cards)
- [ ] Portfolio stats section visible

### Profile Editing
- [ ] Click "Edit Profile" button
- [ ] Profile page loads
- [ ] Profile form displays with current data
- [ ] Edit first name, last name, and bio
- [ ] Save changes
- [ ] Changes reflected on Dashboard
- [ ] Change password functionality works
  - [ ] Enter old password, new password
  - [ ] Success message displayed

---

## ✅ Explore Ideas Page (`/explore`)

### Page Load
- [ ] Page loads with "Explore Investment Ideas" heading
- [ ] Loading skeleton appears initially
- [ ] Ideas load from backend
- [ ] No console errors

### Search Functionality
- [ ] Search input field present
- [ ] Type in search query
- [ ] Ideas filtered by title/description in real-time
- [ ] Clear search shows all ideas again
- [ ] Search is case-insensitive

### Filter Functionality
- [ ] Filter dropdown shows options:
  - [ ] All Ideas
  - [ ] Active
  - [ ] Funded
  - [ ] Closed
- [ ] Select "Active" → only active ideas show
- [ ] Select "Funded" → only funded ideas show
- [ ] Select "All Ideas" → all ideas show again

### Idea Cards Display
- [ ] Each idea card displays:
  - [ ] Status badge (color-coded)
  - [ ] Category
  - [ ] Title
  - [ ] Description (truncated)
  - [ ] Entrepreneur name
  - [ ] Funding progress bar
  - [ ] Current funding / Goal funding
  - [ ] Percentage completed
  - [ ] "INVEST NOW" button
- [ ] Progress bars show correct percentages
- [ ] Hover effect on cards (border color changes to yellow)

### Empty State
- [ ] Search with no results
  - [ ] Message: "No ideas match your search criteria"
  - [ ] "RESET FILTERS" button present
- [ ] Click reset button → all ideas show again

### Responsive Design
- [ ] Desktop view (3 columns)
- [ ] Tablet view (2 columns)
- [ ] Mobile view (1 column)
- [ ] All elements readable on mobile

---

## ✅ Post Idea Page (`/post-idea`)

### Page Load
- [ ] Page loads with "Post an Idea" heading
- [ ] Form displays all fields

### Form Fields
- [ ] Title input field
- [ ] Description textarea
- [ ] Category dropdown with options:
  - [ ] Technology
  - [ ] Healthcare
  - [ ] Finance
  - [ ] Real Estate
  - [ ] Energy
  - [ ] Consumer
  - [ ] Other
- [ ] Funding Goal input field
- [ ] Submit button

### Form Submission
- [ ] Fill all fields with valid data
- [ ] Click Submit
- [ ] Success message: "Idea posted successfully!"
- [ ] Form clears after success
- [ ] Page redirects to `/my-ideas` after 2 seconds
- [ ] New idea appears in My Ideas page

### Form Validation
- [ ] Submit with empty title
  - [ ] Error: "All fields are required"
- [ ] Submit with empty description
  - [ ] Error: "All fields are required"
- [ ] Submit with empty funding goal
  - [ ] Error: "All fields are required"
- [ ] Submit with non-numeric funding goal
  - [ ] Error or field rejects input
- [ ] Submit with negative funding goal
  - [ ] Rejected or shows error

### Loading State
- [ ] Button shows loading indicator while submitting
- [ ] Form disabled during submission
- [ ] Button text changes to "POSTING..."

---

## ✅ My Ideas Page (`/my-ideas`)

### Page Load
- [ ] Page loads with "My Ideas" or similar heading
- [ ] Loading skeleton appears
- [ ] User's ideas load from backend

### Filter Functionality
- [ ] Filter tabs display: All, Active, Funded, Closed
- [ ] Select each filter
- [ ] Ideas filtered correctly by status

### Ideas Display
- [ ] Each idea shows:
  - [ ] Title
  - [ ] Description (snippet)
  - [ ] Status badge (color-coded)
  - [ ] Category
  - [ ] Funding goal amount
  - [ ] Current funding amount
  - [ ] Progress bar (correct percentage)
  - [ ] Posted date
  - [ ] Edit button
  - [ ] View Details button
  - [ ] Delete button
- [ ] Progress bar fills correctly (current/goal)

### Edit Functionality (UI)
- [ ] Click "Edit" button
- [ ] Edit page/modal appears (or redirects)
- [ ] Current values populated in form

### Delete Functionality
- [ ] Click Delete button
- [ ] Confirmation dialog appears
- [ ] Click Cancel → dialog closes, no change
- [ ] Click Confirm → idea deleted
- [ ] Idea removed from list
- [ ] Backend confirms deletion

### Empty State
- [ ] User with no ideas
- [ ] "Post New Idea" button visible
- [ ] Message: "No ideas posted yet"
- [ ] Button redirects to `/post-idea`

### Post New Idea Button
- [ ] Button visible at top or bottom
- [ ] Clicking redirects to `/post-idea`

### Responsive Design
- [ ] Desktop layout works
- [ ] Tablet layout works
- [ ] Mobile layout works (cards stack vertically)

---

## ✅ My Investments Page (`/my-investments`)

### Page Load
- [ ] Page loads with "My Portfolio" or "My Investments" heading
- [ ] Loading skeleton appears initially
- [ ] Investments load from backend
- [ ] No console errors

### Stats Cards
- [ ] Three stats cards display:
  - [ ] **Total Invested**: Sum of all investment amounts
  - [ ] **Active Investments**: Count of pending investments
  - [ ] **Portfolio Value**: Total value
- [ ] Values calculated correctly
- [ ] Numbers formatted with commas (e.g., "$1,000,000")

### Filter Functionality
- [ ] Filter tabs: All, Pending, Completed, Cancelled
- [ ] Select each filter
- [ ] Investments filtered by status

### Investment List
- [ ] Each investment shows:
  - [ ] Idea title (linked to idea details)
  - [ ] Entrepreneur name
  - [ ] Investment amount
  - [ ] Status badge (color-coded)
  - [ ] Investment date
  - [ ] View Details button
  - [ ] Contact Entrepreneur button
- [ ] Rows alternate background colors (if designed)
- [ ] Hover effects work on rows

### Action Buttons
- [ ] "View Details" button → shows investment details
- [ ] "Contact Entrepreneur" button → opens messaging or sends preset message

### Empty State
- [ ] Investor with no investments
- [ ] "Explore Opportunities" button visible
- [ ] Message: "No investments yet. Start exploring ideas!"
- [ ] Button redirects to `/explore`

### Responsive Design
- [ ] Desktop: Table-like layout
- [ ] Tablet: Adjusted column widths
- [ ] Mobile: Cards or full-width rows

---

## ✅ Messages Page (`/messages`)

### Page Load
- [ ] Page loads with "Messages" or "Messaging" heading
- [ ] Loading skeleton appears
- [ ] Messages load from backend

### Message List (Left Column)
- [ ] Displays all messages for user
- [ ] Each message shows:
  - [ ] Sender name
  - [ ] Message preview text (first 50 chars)
  - [ ] Timestamp (relative time: "2 hours ago")
  - [ ] Unread indicator (if unread)
  - [ ] "NEW" badge (if unread)
- [ ] Unread messages highlighted with light blue background
- [ ] Unread messages have blue dot indicator

### Filter Tabs
- [ ] Three tabs: "Unread Messages (count)", "All Messages", "Read Messages"
- [ ] Count updates correctly for unread messages
- [ ] Select each tab → messages filtered
- [ ] "All Messages" shows everything

### Message Detail (Right Column)
- [ ] Clicking message shows detail view
- [ ] Details display:
  - [ ] Sender name
  - [ ] Subject line
  - [ ] Full message content
  - [ ] Timestamp (full date/time)
- [ ] Message automatically marked as read
- [ ] Unread indicator removed after click
- [ ] Blue highlight removes after reading

### Reply Functionality
- [ ] Reply text area visible
- [ ] "Send Reply" button present
- [ ] Type message → click Send
- [ ] Reply submitted to backend
- [ ] Success message shown
- [ ] Reply text area clears
- [ ] New message appears in list (if using same thread)

### Mark as Read/Unread (if implemented)
- [ ] Mark as read button changes state
- [ ] UI updates to reflect new state
- [ ] Backend persists the state

### Empty State
- [ ] User with no messages
- [ ] Message: "No messages yet"
- [ ] Back to dashboard or explore option

### Responsive Design
- [ ] Desktop: Two-column layout
- [ ] Tablet: Two-column (adjusted widths)
- [ ] Mobile: Single column (list with detail modal/drawer)

### Loading States
- [ ] Initial load shows skeleton
- [ ] Replying shows loading indicator
- [ ] Prevent double-submit of replies

---

## ✅ API Integration

### Idea Endpoints
- [ ] **GET /api/ideas**
  - [ ] Returns all active/funded ideas
  - [ ] Includes entrepreneur info
  - [ ] JSON format correct
  - [ ] Pagination works (if implemented)

- [ ] **GET /api/ideas/my-ideas**
  - [ ] Returns only current user's ideas
  - [ ] Returns 401 without token
  - [ ] Returns empty array if no ideas

- [ ] **POST /api/ideas**
  - [ ] Creates idea with valid data
  - [ ] Returns 400 with missing fields
  - [ ] Returns 401 without token
  - [ ] Returns created idea object

- [ ] **DELETE /api/ideas/:id**
  - [ ] Deletes only user's own ideas
  - [ ] Returns 404 for non-existent idea
  - [ ] Returns 403 if not idea owner
  - [ ] Returns 401 without token

### Investment Endpoints
- [ ] **GET /api/investments/my-investments**
  - [ ] Returns user's investments
  - [ ] Returns 401 without token
  - [ ] Includes summary stats
  - [ ] JSON format correct

- [ ] **POST /api/investments**
  - [ ] Creates investment with valid data
  - [ ] Updates idea's current_funding
  - [ ] Returns 400 with missing fields
  - [ ] Returns 404 for non-existent idea

### Message Endpoints
- [ ] **GET /api/messages**
  - [ ] Returns messages for current user
  - [ ] Returns 401 without token
  - [ ] Includes sender info
  - [ ] Ordered by date (newest first)

- [ ] **PUT /api/messages/:id/read**
  - [ ] Marks message as read
  - [ ] Updates is_read to true
  - [ ] Updates read_at timestamp
  - [ ] Returns 401 without token
  - [ ] Returns 404 for non-existent message

- [ ] **POST /api/messages/reply**
  - [ ] Creates message with valid data
  - [ ] Returns 400 with missing fields
  - [ ] Returns 401 without token
  - [ ] Recipient_id and content required

---

## ✅ Authentication & Security

### Token Management
- [ ] JWT token stored in localStorage after sign in
- [ ] Token included in `Authorization: Bearer {token}` header
- [ ] Token persists on page refresh
- [ ] Token cleared on logout

### Token Validation
- [ ] Expired token → 401 error → redirected to sign in
- [ ] Invalid token → 401 error → redirected to sign in
- [ ] Valid token → requests proceed

### Protected Routes
- [ ] Unauthenticated user visiting `/dashboard` → redirected to `/signin`
- [ ] Unauthenticated user visiting `/my-ideas` → redirected to `/signin`
- [ ] Unauthenticated user visiting `/explore` → redirected to `/signin`
- [ ] Authenticated user can access all protected routes

### Authorization
- [ ] User A cannot delete User B's ideas
- [ ] User A cannot see User B's investments (unless shared)
- [ ] User can only see their own messages

### Password Security
- [ ] Passwords not visible in forms (masked with dots)
- [ ] Passwords not logged in console
- [ ] Passwords hashed on backend (bcryptjs)
- [ ] Passwords not returned in API responses

---

## ✅ Error Handling

### Network Errors
- [ ] Network failure → error message shown
- [ ] Retry button provided
- [ ] No infinite loops of requests

### Validation Errors
- [ ] Missing fields → error message per field
- [ ] Invalid format → specific error message
- [ ] User-friendly error text

### Server Errors
- [ ] 500 error → "Something went wrong" message
- [ ] Unclear errors not shown to user
- [ ] Backend logs contain detailed errors

### Client Errors
- [ ] 404 errors → "Not found" message
- [ ] 403 errors → "Unauthorized access" message
- [ ] 401 errors → redirect to sign in

---

## ✅ Performance

### Load Times
- [ ] Ideas list loads in < 2 seconds
- [ ] Dashboard loads in < 2 seconds
- [ ] Ideas filter/search is instant (< 500ms)
- [ ] No lag on input fields

### Data Loading
- [ ] SkeletonLoader displays while fetching
- [ ] Prevents "loading flash" (SkeletonLoader visible before content)
- [ ] No duplicate API calls on mount

### Large Data Sets
- [ ] 100+ ideas load without hanging
- [ ] Scrolling is smooth
- [ ] No memory leaks (DevTools check)

### Network Throttling (Dev Tools)
- [ ] Test on "Slow 3G"
- [ ] Loading states appear
- [ ] Timeouts don't occur
- [ ] Error messages appear if connection drops

---

## ✅ Responsive Design

### Mobile (375px width)
- [ ] All text readable
- [ ] Buttons large enough to tap (44x44px minimum)
- [ ] No horizontal scroll
- [ ] Forms stack vertically
- [ ] Two-column layouts become single column
- [ ] Images scale properly

### Tablet (768px width)
- [ ] Layouts optimized for 2-column design
- [ ] Touch targets appropriately sized
- [ ] Navigation accessible
- [ ] Images and text readable

### Desktop (1024px+ width)
- [ ] Multi-column layouts display
- [ ] No content too wide
- [ ] Spacing appropriate
- [ ] Hover states work

### Device Testing
- [ ] Test on actual mobile device (not just DevTools)
- [ ] Test on actual tablet (not just DevTools)
- [ ] Test on desktop monitor
- [ ] Test browser zoom (100%, 125%, 150%)

---

## ✅ Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Features Tested
- [ ] Forms work
- [ ] Fetch API works
- [ ] LocalStorage works
- [ ] CSS Grid/Flexbox render correctly
- [ ] Images load
- [ ] Fonts load properly

---

## ✅ Accessibility

### Keyboard Navigation
- [ ] Tab through all inputs
- [ ] Tab order is logical
- [ ] All buttons accessible via keyboard
- [ ] No keyboard traps

### Screen Readers
- [ ] Use NVDA or JAWS to test
- [ ] Labels associated with inputs
- [ ] Images have alt text (if any)
- [ ] Form errors announced

### Color Contrast
- [ ] Text has sufficient contrast (WCAG AA)
- [ ] Status badges readable for colorblind users
- [ ] Not relying on color alone for meaning

### Form Labels
- [ ] All form fields have labels
- [ ] Labels associated with inputs via `<label>`
- [ ] Error messages linked to fields

---

## ✅ Design & UX

### Visual Consistency
- [ ] Colors consistent across pages
  - [ ] White background (#ffffff)
  - [ ] Gray borders (#e5e7eb)
  - [ ] Yellow accents (#ca8a04)
- [ ] Typography consistent
  - [ ] Poppins for body text
  - [ ] Playfair Display for headers
- [ ] Spacing consistent
- [ ] Button styles consistent

### User Experience
- [ ] Clear loading states
- [ ] Success feedback (toasts/messages)
- [ ] Error feedback is helpful
- [ ] No dead links
- [ ] All CTAs lead somewhere
- [ ] Back button works
- [ ] Navigation intuitive

### Feedback
- [ ] Hover states on clickable elements
- [ ] Active states on buttons during submit
- [ ] Loading indicators during requests
- [ ] Success messages after actions
- [ ] Error messages clear

---

## ✅ Database

### Tables
- [ ] `users` table exists with all columns
- [ ] `ideas` table exists with all columns
- [ ] `investments` table exists with all columns
- [ ] `messages` table exists with all columns

### Relationships
- [ ] Foreign keys properly set
- [ ] CASCADE deletes configured
- [ ] Indexes on foreign keys

### Sample Data
- [ ] Create 2-3 sample users
- [ ] Create 2-3 sample ideas
- [ ] Create 1-2 sample investments
- [ ] Create 1-2 sample messages

### Data Integrity
- [ ] Cannot create duplicate emails
- [ ] Cannot set invalid role
- [ ] Cannot create idea without user_id
- [ ] Cannot delete user with ideas (should cascade)

---

## ✅ Logout & Session

### Sign Out
- [ ] Logout button visible on all pages
- [ ] Click logout → token removed from localStorage
- [ ] Redirect to home page
- [ ] Protected pages no longer accessible

### Session Persistence
- [ ] Refresh page → user still logged in
- [ ] Close browser → session might persist (depending on design)
- [ ] Token expires after 7 days

### Multiple Tabs
- [ ] Sign in in one tab → reflected in other tabs
- [ ] Sign out in one tab → sign out reflected in others

---

## ✅ Final Verification

- [ ] All endpoints return correct status codes
- [ ] All pages load without console errors
- [ ] All pages responsive on mobile, tablet, desktop
- [ ] All forms validate correctly
- [ ] All buttons have clear purpose
- [ ] All links work
- [ ] Database properly initialized
- [ ] No sensitive data in localStorage except token
- [ ] CORS properly configured
- [ ] All error scenarios handled

---

## Notes & Issues Found

Use this section to document any issues found during testing:

```
Issue #1:
- Page: [page name]
- Description: [what's wrong]
- Steps to reproduce: [how to trigger the issue]
- Expected behavior: [what should happen]
- Actual behavior: [what does happen]
- Severity: [Critical/High/Medium/Low]
- Fix: [solution if known]

Issue #2:
...
```

---

## Sign-Off

- [ ] All critical issues resolved
- [ ] All high priority issues resolved
- [ ] Medium priority issues documented
- [ ] Low priority issues noted for future
- [ ] Performance acceptable
- [ ] Security verified
- [ ] UX satisfactory
- [ ] Ready for production deployment

**Tested By:** _________________ **Date:** ________

**Approved By:** ________________ **Date:** ________

---

**Thank you for thoroughly testing BillNet! Your diligence ensures a great user experience.** ✨
