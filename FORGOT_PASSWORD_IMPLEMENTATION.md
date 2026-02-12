# Forgot Password Feature

## Overview
Complete forgot password and reset password functionality has been implemented for the BillNet application.

## Components

### Backend (d:\appz\bilnet\backend)

#### 1. Email Service (`emailService.js`)
- Added `sendPasswordResetEmail()` method that sends password reset emails with secure token links
- Email includes:
  - Reset link with token
  - 1-hour expiration notice
  - Security message for users who didn't request reset

#### 2. API Endpoints (`index.js`)
- **POST `/api/auth/forgot-password`**
  - Accepts: `{ email }`
  - Generates secure reset token
  - Stores token and expiry in database
  - Sends email with reset link
  - Returns success message (doesn't reveal if email exists for security)

- **POST `/api/auth/reset-password`**
  - Accepts: `{ token, newPassword }`
  - Validates token and expiry
  - Hashes new password
  - Updates password and clears reset token
  - Returns success message

#### 3. Database Changes
Added columns to `users` table:
- `reset_token` (VARCHAR 255) - Stores password reset token
- `reset_token_expiry` (TIMESTAMP) - Token expiration timestamp

### Frontend (d:\appz\bilnet\frontend)

#### 1. ForgotPassword Page (`src/pages/ForgotPassword.tsx`)
- Clean form for entering email address
- Sends request to `/api/auth/forgot-password`
- Shows success message (doesn't reveal if email exists)
- Displays error messages if request fails
- Link back to sign-in page

#### 2. ResetPassword Page (`src/pages/ResetPassword.tsx`)
- Extracts token from URL query parameters
- Form for entering new password and confirmation
- Validates password length (minimum 8 characters)
- Validates password match
- Sends request to `/api/auth/reset-password`
- Shows success toast and redirects to sign-in
- Handles invalid/expired tokens gracefully

#### 3. App.tsx Updates
- Added routes for `/forgot-password` and `/reset-password`
- Both routes are public (no authentication required)

## User Flow

1. **Request Password Reset**
   - User clicks "Forgot password?" link on sign-in page
   - Enters email address on forgot password page
   - Receives success message
   - Email sent with reset link (if account exists)

2. **Reset Password**
   - User clicks link in email
   - Redirected to reset password page with token
   - Enters new password (twice for confirmation)
   - Submits form
   - Success message shown
   - Redirected to sign-in page
   - Can now sign in with new password

## Security Features

1. **Token Security**
   - Cryptographically secure random tokens (32 bytes)
   - Tokens are hashed before storing
   - Tokens expire after 1 hour
   - One-time use (cleared after password reset)

2. **Email Privacy**
   - Doesn't reveal if email exists in system
   - Same success message for existing and non-existing emails

3. **Password Requirements**
   - Minimum 8 characters
   - Must match confirmation
   - Hashed with bcrypt before storing

## Testing

### Manual Testing Steps

1. **Test Forgot Password Request**
   ```
   - Navigate to http://localhost:3000/signin
   - Click "Forgot password?"
   - Enter a registered email
   - Verify success message appears
   - Check backend console for email preview URL
   ```

2. **Test Password Reset**
   ```
   - Click reset link from email preview
   - Enter new password (min 8 chars)
   - Confirm password
   - Click "Reset Password"
   - Verify success message and redirect
   - Try signing in with new password
   ```

3. **Test Invalid Token**
   ```
   - Navigate to http://localhost:3000/reset-password?token=invalid
   - Verify error message shown
   - Verify "Request New Reset Link" button appears
   ```

4. **Test Token Expiry**
   ```
   - Request password reset
   - Wait 1+ hour (or manually update DB)
   - Try to use reset link
   - Verify "expired token" error
   ```

### Email Testing

For development, the app uses Ethereal Email (fake SMTP):
- Check backend console for preview URLs
- Preview URLs look like: `https://ethereal.email/message/[id]`
- Click the URL to view the email in browser

For production:
- Set environment variables:
  - `EMAIL_HOST` - SMTP server
  - `EMAIL_PORT` - SMTP port
  - `EMAIL_USER` - SMTP username
  - `EMAIL_PASS` - SMTP password
  - `EMAIL_FROM` - From email address
  - `APP_URL` - Frontend URL for reset links

## Files Modified/Created

### Backend
- ✅ `backend/emailService.js` - Added password reset email method
- ✅ `backend/index.js` - Added reset endpoints and database columns

### Frontend
- ✅ `frontend/src/pages/ForgotPassword.tsx` - New file
- ✅ `frontend/src/pages/ResetPassword.tsx` - New file
- ✅ `frontend/src/App.tsx` - Added routes

## Next Steps (Optional Enhancements)

1. **Rate Limiting** - Prevent abuse of forgot password endpoint
2. **Password Strength Meter** - Visual feedback on password strength
3. **Email Templates** - More polished HTML email templates
4. **Multi-factor Authentication** - Additional security layer
5. **Password History** - Prevent reusing recent passwords
6. **Account Recovery Options** - Additional recovery methods (SMS, security questions)

## Troubleshooting

**Issue: Email not received**
- Check backend console for email preview URL
- Verify email service is initialized
- Check spam/junk folder in production

**Issue: Invalid token error**
- Token may have expired (1 hour limit)
- Token may have been used already
- Request a new reset link

**Issue: Password reset not working**
- Check browser console for errors
- Verify backend is running on port 5000
- Check database columns exist (reset_token, reset_token_expiry)
