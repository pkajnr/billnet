# 🔐 BillNet Admin Authentication System

## Enterprise-Grade Security Implementation

### Overview

The BillNet admin panel has been upgraded with enterprise-standard security features:

✅ **Username/Password Authentication**  
✅ **Multi-Factor Authentication (MFA)**  
✅ **Role-Based Access Control (RBAC)**  
✅ **Session Management**  
✅ **Activity Logging**  
✅ **Account Lockout Protection**  

---

## 📋 Admin Roles & Permissions

### Available Roles

#### 1. **Super Administrator**
- **Full system access**
- Can manage all admin users
- Access to system settings
- Cannot be deleted or deactivated
- **Permissions**: All resources (read, create, update, delete)

#### 2. **Administrator**
- High-level access to most features
- Can manage users, ideas, verifications
- Can create/edit other admins (except super admins)
- Cannot modify critical system settings
- **Permissions**: Users, Ideas, Verifications, Reports, Settings (no system-level)

#### 3. **Moderator**
- Content review and user management
- Can approve/reject ideas
- Can manage user verifications
- Read-only access to reports
- **Permissions**: Users (read/update), Ideas (read/update/delete), Verifications (read/update)

#### 4. **Data Analyst**
- Read-only access to reports and analytics
- Can create custom reports
- Access to audit logs
- No modification permissions
- **Permissions**: All resources (read-only), Reports (create), Analytics (read)

#### 5. **Support Specialist**
- User management and verification handling
- Can update user profiles
- Can process verification requests
- Limited access to other features
- **Permissions**: Users (read/update), Verifications (read/update), Reports (read)

#### 6. **Content Manager**
- Manage ideas and content moderation
- Can create, edit, delete ideas
- Review user-submitted content
- **Permissions**: Ideas (full access), Users (read), Reports (read)

#### 7. **Financial Manager**
- Transaction and payment management
- Access to financial reports
- Can view user wallets
- **Permissions**: Transactions (read/update), Reports (read/create), Analytics (read)

#### 8. **Auditor**
- Read-only access to all system data
- Access to all audit logs
- Cannot modify anything
- Used for compliance and auditing
- **Permissions**: All resources (read-only), Audit Logs (read)

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install speakeasy qrcode
```

### 2. Run Database Migration

```bash
# Connect to your database and run:
psql your_database_url < admin_users_schema.sql
```

This creates:
- `admin_users` table
- `admin_roles` table  
- `admin_activity_log` table
- `admin_sessions` table
- Default roles with permissions
- Default super admin account

### 3. Create Initial Super Admin

The migration creates a default super admin:
- **Username**: `superadmin`
- **Email**: admin@billnet.com
- **Password**: (needs to be set - see below)

**Generate Password Hash:**

```javascript
const bcrypt = require('bcryptjs');
const password = 'YourSecurePassword123!';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

Update the SQL with the generated hash before running the migration.

### 4. Update Backend

The backend has been configured with the new admin authentication routes at `/api/admin/auth/*`

### 5. Start Services

```bash
# Backend
cd backend
npm start

# Admin Panel
cd admin
npm run dev
```

---

## 🔑 Authentication Flow

### Login Process

1. **Enter Credentials**
   - Username
   - Password

2. **Password Verification**
   - Checks against hashed password
   - Tracks login attempts
   - Locks account after 5 failed attempts (15 min)

3. **MFA Challenge** (if enabled)
   - Prompts for 6-digit code
   - Validates against TOTP secret
   - 2-minute window for code validity

4. **Session Creation**
   - Generates JWT token (8-hour expiry)
   - Stores session in database
   - Returns admin profile + permissions

5. **Access Control**
   - Token sent with each API request
   - Middleware validates token + permissions
   - Checks specific resource/action permissions

---

## 🛡️ Security Features

### 1. Account Lockout
- 5 failed login attempts
- 15-minute lockout period
- Automatic unlock after timeout

### 2. Session Management
- 8-hour session expiry
- Token stored in database
- Invalidated on logout
- Tracks IP address and user agent

### 3. Activity Logging
- All admin actions logged
- Includes resource type, action, details
- IP address and timestamp
- Searchable audit trail

### 4. Multi-Factor Authentication
- TOTP-based (Google Authenticator, Authy, etc.)
- QR code generation for setup
- 30-second token refresh
- Backup codes (future enhancement)

### 5. Role-Based Permissions
- Granular permission system
- Resource-level control
- Action-level control (read/create/update/delete)
- Enforced at API level

---

## 📱 MFA Setup Process

### For Admin Users:

1. **Login** to admin panel
2. Go to **Profile** → **Security**
3. Click **"Enable MFA"**
4. Scan QR code with authenticator app:
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
   - 1Password
5. Enter 6-digit code to verify
6. MFA now required for all logins

### For Super Admins Creating Users:

1. Go to **Admin Users** page
2. Click **"Create Admin User"**
3. Fill in details (username, email, password, role)
4. User can enable MFA after first login

---

## 🔧 API Endpoints

### Authentication

```
POST /api/admin/auth/login
Body: { username, password, mfaCode? }
Response: { token, admin { id, username, email, role, permissions } }

POST /api/admin/auth/logout
Headers: Authorization: Bearer <token>
Response: { success: true }

GET /api/admin/auth/profile
Headers: Authorization: Bearer <token>
Response: { id, username, email, role, permissions, ... }
```

### MFA Management

```
POST /api/admin/auth/mfa/setup
Headers: Authorization: Bearer <token>
Response: { secret, qrCode }

POST /api/admin/auth/mfa/verify
Headers: Authorization: Bearer <token>
Body: { token }
Response: { success: true }

POST /api/admin/auth/mfa/disable
Headers: Authorization: Bearer <token>
Body: { password }
Response: { success: true }
```

### Admin User Management

```
GET /api/admin/auth/users
Headers: Authorization: Bearer <token>
Response: { users: [...] }

POST /api/admin/auth/users
Headers: Authorization: Bearer <token>
Body: { username, email, password, firstName, lastName, role, phone }
Response: { success: true, user }

PUT /api/admin/auth/users/:id
Headers: Authorization: Bearer <token>
Body: { email, firstName, lastName, role, phone, isActive }
Response: { success: true, user }

DELETE /api/admin/auth/users/:id
Headers: Authorization: Bearer <token>
Response: { success: true }
```

### Roles & Permissions

```
GET /api/admin/auth/roles
Headers: Authorization: Bearer <token>
Response: { roles: [...] }

GET /api/admin/auth/activity-log
Headers: Authorization: Bearer <token>
Query: ?limit=100&offset=0
Response: { logs: [...] }
```

---

## 🎯 Permission System

### Permission Structure

```json
{
  "users": ["read", "create", "update", "delete"],
  "ideas": ["read", "create", "update", "delete"],
  "verifications": ["read", "update"],
  "reports": ["read", "create"],
  "settings": ["read", "update"],
  "admins": ["read", "create", "update", "delete"],
  "analytics": ["read"],
  "audit_logs": ["read"],
  "system": ["read", "update"]
}
```

### Checking Permissions

Backend middleware automatically checks permissions:

```javascript
router.get('/api/admin/users', 
  authenticateAdmin, 
  checkPermission('users', 'read'), 
  async (req, res) => {
    // Your code here
  }
);
```

Frontend permission checks:

```typescript
const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
const canCreateUsers = adminUser.permissions?.users?.includes('create');
```

---

## 📊 Activity Logging

All admin actions are automatically logged:

- **Login/Logout** events
- **User creation/modification/deletion**
- **Role changes**
- **Settings updates**
- **Verification decisions**
- **Content moderation actions**

### Viewing Activity Logs

1. Login as **Super Admin** or **Auditor**
2. Navigate to activity logs page
3. Filter by:
   - Admin user
   - Action type
   - Date range
   - Resource type

---

## 🔐 Best Practices

### For Super Admins:

1. **Enable MFA immediately** after first login
2. **Create individual accounts** for each admin (don't share credentials)
3. **Assign minimum required role** (principle of least privilege)
4. **Regularly review** activity logs
5. **Deactivate accounts** for inactive admins
6. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)

### For All Admins:

1. **Never share your password**
2. **Enable MFA** for additional security
3. **Logout when done** using shared computers
4. **Report suspicious activity** immediately
5. **Change password** if compromised
6. **Keep authenticator app secure**

### Password Requirements:

- Minimum 8 characters
- Mix of uppercase and lowercase
- At least one number
- Special characters recommended
- No common passwords

---

## 🚨 Troubleshooting

### Cannot Login

- **Check credentials** are correct
- **Account locked?** Wait 15 minutes
- **MFA code invalid?** Ensure device time is synchronized
- **Contact super admin** for account unlock

### MFA Not Working

- **Verify time sync** on your device
- **Try next code** (30-second window)
- **Contact super admin** to disable MFA temporarily
- **Re-setup MFA** if persistent issues

### Permission Denied

- **Check your role permissions**
- **Contact administrator** for role upgrade
- **Verify you're using correct account**

### Session Expired

- **Login again** (8-hour expiry)
- **Enable "Remember Me"** (future feature)
- **Check system time** is correct

---

## 📈 Future Enhancements

- [ ] Backup codes for MFA
- [ ] Email notifications for suspicious logins
- [ ] IP whitelist/blacklist
- [ ] Password expiry and rotation
- [ ] Custom role creation
- [ ] Permission templates
- [ ] Advanced audit log filtering
- [ ] Session management dashboard
- [ ] Biometric authentication
- [ ] SSO integration (OAuth, SAML)

---

## 🆘 Support

For issues or questions:
- **Email**: admin@billnet.com
- **Documentation**: See ADMIN_REDESIGN.md
- **Emergency**: Contact super administrator

---

## 📝 Database Schema

### admin_users
- id, username, email, password_hash
- first_name, last_name, role, phone
- is_active, mfa_enabled, mfa_secret
- last_login, login_attempts, locked_until
- created_at, created_by, updated_at

### admin_roles
- id, role_name, display_name, description
- permissions (JSONB)
- is_system_role, created_at

### admin_sessions
- id, admin_user_id, session_token
- ip_address, user_agent
- expires_at, created_at

### admin_activity_log
- id, admin_user_id, action
- resource_type, resource_id, details (JSONB)
- ip_address, user_agent, created_at

---

**Your admin panel is now protected by enterprise-grade security! 🔒**
