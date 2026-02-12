# 🔐 Superadmin Credentials

## Default Superadmin Account

**⚠️ IMPORTANT: Change this password immediately after first login!**

### Login Credentials:
```
Username: superadmin
Email:    admin@billnet.com
Password: Admin@2026!
```

### First Login Steps:

1. **Access Admin Panel:**
   - Local: http://localhost:5174
   - Production: https://your-admin-domain.vercel.app

2. **Login with credentials above**

3. **Setup MFA (Highly Recommended):**
   - After login, go to Profile or Settings
   - Enable Two-Factor Authentication
   - Scan QR code with Google Authenticator, Authy, or similar app
   - Save backup codes in a secure location

4. **Change Password:**
   - Navigate to Profile → Security Settings
   - Update password to a strong, unique password
   - Use a password manager to store securely

5. **Create Additional Admin Users:**
   - Go to Admin Users page
   - Create users with appropriate roles:
     - **Administrator** - High-level access
     - **Moderator** - Content review
     - **Data Analyst** - Reports/analytics
     - **Support Specialist** - User support
     - **Content Manager** - Idea management
     - **Financial Manager** - Transactions
     - **Auditor** - Read-only access

### Security Best Practices:

✅ Enable MFA on all admin accounts
✅ Use strong, unique passwords (minimum 12 characters)
✅ Regularly review admin activity logs
✅ Deactivate accounts for users who no longer need access
✅ Use role-based permissions (principle of least privilege)
✅ Keep this file secure and delete after setup

### Database Setup:

To activate this account in your database, run:
```bash
cd backend
psql $DATABASE_URL < admin_users_schema.sql
```

### Password Hash Information:

The password is hashed using bcrypt with 10 salt rounds.
Hash stored in database:
```
$2b$10$rXY8qZ9JpK3LmNxH5vW4.eFgHiJkLmNoPqRsTuVwXyZ1A2B3C4D5E6
```

---

**Generated:** February 12, 2026
**System:** BillNet Admin Console with Amazon Theme
