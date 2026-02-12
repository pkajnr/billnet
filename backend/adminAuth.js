const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { Pool } = require('pg');

const router = express.Router();

// Database connection - support both DATABASE_URL and individual variables
const dbConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'billnet',
      password: process.env.DB_PASSWORD || '!!@@Root@2009',
      port: parseInt(process.env.DB_PORT || '5432'),
    };

const pool = new Pool(dbConfig);

// Admin Authentication Middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session is valid
    const sessionResult = await pool.query(
      'SELECT * FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Get admin user
    const userResult = await pool.query(
      'SELECT * FROM admin_users WHERE id = $1 AND is_active = true',
      [decoded.adminId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Admin user not found or inactive' });
    }

    req.admin = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Check Permission Middleware
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const roleResult = await pool.query(
        'SELECT permissions FROM admin_roles WHERE role_name = $1',
        [req.admin.role]
      );

      if (roleResult.rows.length === 0) {
        return res.status(403).json({ error: 'Invalid role' });
      }

      const permissions = roleResult.rows[0].permissions;
      
      if (!permissions[resource] || !permissions[resource].includes(action)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password, mfaCode } = req.body;

    // Get admin user
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];

    // Check if account is locked
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return res.status(403).json({ 
        error: 'Account temporarily locked due to multiple failed attempts',
        lockedUntil: admin.locked_until
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword) {
      // Increment login attempts
      const attempts = admin.login_attempts + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await pool.query(
        'UPDATE admin_users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
        [attempts, lockedUntil, admin.id]
      );

      return res.status(401).json({ 
        error: 'Invalid credentials',
        attemptsRemaining: Math.max(0, 5 - attempts)
      });
    }

    // Check MFA if enabled
    if (admin.mfa_enabled) {
      if (!mfaCode) {
        return res.status(401).json({ 
          error: 'MFA code required',
          mfaRequired: true
        });
      }

      const verified = speakeasy.totp.verify({
        secret: admin.mfa_secret,
        encoding: 'base32',
        token: mfaCode,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({ error: 'Invalid MFA code' });
      }
    }

    // Reset login attempts
    await pool.query(
      'UPDATE admin_users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1',
      [admin.id]
    );

    // Create session token
    const sessionToken = jwt.sign(
      { adminId: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Store session
    await pool.query(
      'INSERT INTO admin_sessions (admin_user_id, session_token, ip_address, user_agent, expires_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL \'8 hours\')',
      [admin.id, sessionToken, req.ip, req.headers['user-agent']]
    );

    // Log activity
    await pool.query(
      'INSERT INTO admin_activity_log (admin_user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
      [admin.id, 'LOGIN', req.ip, req.headers['user-agent']]
    );

    // Get role permissions
    const roleResult = await pool.query(
      'SELECT * FROM admin_roles WHERE role_name = $1',
      [admin.role]
    );

    res.json({
      success: true,
      token: sessionToken,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name,
        role: admin.role,
        roleDisplay: roleResult.rows[0]?.display_name || admin.role,
        permissions: roleResult.rows[0]?.permissions || {},
        avatarUrl: admin.avatar_url,
        mfaEnabled: admin.mfa_enabled
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin Logout
router.post('/logout', authenticateAdmin, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    await pool.query(
      'DELETE FROM admin_sessions WHERE session_token = $1',
      [token]
    );

    await pool.query(
      'INSERT INTO admin_activity_log (admin_user_id, action) VALUES ($1, $2)',
      [req.admin.id, 'LOGOUT']
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get Current Admin Profile
router.get('/profile', authenticateAdmin, async (req, res) => {
  try {
    const roleResult = await pool.query(
      'SELECT * FROM admin_roles WHERE role_name = $1',
      [req.admin.role]
    );

    res.json({
      id: req.admin.id,
      username: req.admin.username,
      email: req.admin.email,
      firstName: req.admin.first_name,
      lastName: req.admin.last_name,
      role: req.admin.role,
      roleDisplay: roleResult.rows[0]?.display_name || req.admin.role,
      permissions: roleResult.rows[0]?.permissions || {},
      avatarUrl: req.admin.avatar_url,
      phone: req.admin.phone,
      mfaEnabled: req.admin.mfa_enabled,
      lastLogin: req.admin.last_login,
      createdAt: req.admin.created_at
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Setup MFA
router.post('/mfa/setup', authenticateAdmin, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `BillNet Admin (${req.admin.username})`,
      issuer: 'BillNet'
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store secret temporarily (will be confirmed on verification)
    await pool.query(
      'UPDATE admin_users SET mfa_secret = $1 WHERE id = $2',
      [secret.base32, req.admin.id]
    );

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({ error: 'Failed to setup MFA' });
  }
});

// Verify and Enable MFA
router.post('/mfa/verify', authenticateAdmin, async (req, res) => {
  try {
    const { token } = req.body;

    const verified = speakeasy.totp.verify({
      secret: req.admin.mfa_secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid MFA code' });
    }

    await pool.query(
      'UPDATE admin_users SET mfa_enabled = true WHERE id = $1',
      [req.admin.id]
    );

    await pool.query(
      'INSERT INTO admin_activity_log (admin_user_id, action) VALUES ($1, $2)',
      [req.admin.id, 'MFA_ENABLED']
    );

    res.json({ success: true });
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({ error: 'Failed to verify MFA' });
  }
});

// Disable MFA
router.post('/mfa/disable', authenticateAdmin, async (req, res) => {
  try {
    const { password } = req.body;

    const validPassword = await bcrypt.compare(password, req.admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    await pool.query(
      'UPDATE admin_users SET mfa_enabled = false, mfa_secret = NULL WHERE id = $1',
      [req.admin.id]
    );

    await pool.query(
      'INSERT INTO admin_activity_log (admin_user_id, action) VALUES ($1, $2)',
      [req.admin.id, 'MFA_DISABLED']
    );

    res.json({ success: true });
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
});

// Get All Admin Users (Super Admin / Administrator only)
router.get('/users', authenticateAdmin, checkPermission('admins', 'read'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        au.id, au.username, au.email, au.first_name, au.last_name, 
        au.role, au.is_active, au.mfa_enabled, au.last_login, au.created_at,
        ar.display_name as role_display_name,
        (SELECT COUNT(*) FROM admin_activity_log WHERE admin_user_id = au.id AND created_at > NOW() - INTERVAL '30 days') as actions_last_30_days
      FROM admin_users au
      LEFT JOIN admin_roles ar ON au.role = ar.role_name
      ORDER BY au.created_at DESC
    `);

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ error: 'Failed to get admin users' });
  }
});

// Create Admin User
router.post('/users', authenticateAdmin, checkPermission('admins', 'create'), async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role, phone } = req.body;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO admin_users (username, email, password_hash, first_name, last_name, role, phone, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, email, first_name, last_name, role, is_active, created_at`,
      [username, email, passwordHash, firstName, lastName, role, phone, req.admin.id]
    );

    await pool.query(
      'INSERT INTO admin_activity_log (admin_user_id, action, resource_type, resource_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.admin.id, 'CREATE_ADMIN_USER', 'admin_users', result.rows[0].id, JSON.stringify({ username, role })]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Create admin user error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create admin user' });
    }
  }
});

// Update Admin User
router.put('/users/:id', authenticateAdmin, checkPermission('admins', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role, phone, isActive } = req.body;

    // Super admins can't be deactivated
    const userResult = await pool.query('SELECT role FROM admin_users WHERE id = $1', [id]);
    if (userResult.rows[0]?.role === 'super_admin' && isActive === false) {
      return res.status(400).json({ error: 'Cannot deactivate super admin' });
    }

    const result = await pool.query(
      `UPDATE admin_users 
       SET email = $1, first_name = $2, last_name = $3, role = $4, phone = $5, is_active = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING id, username, email, first_name, last_name, role, is_active`,
      [email, firstName, lastName, role, phone, isActive, id]
    );

    await pool.query(
      'INSERT INTO admin_activity_log (admin_user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
      [req.admin.id, 'UPDATE_ADMIN_USER', 'admin_users', id]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Update admin user error:', error);
    res.status(500).json({ error: 'Failed to update admin user' });
  }
});

// Delete Admin User
router.delete('/users/:id', authenticateAdmin, checkPermission('admins', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // Can't delete yourself
    if (parseInt(id) === req.admin.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Can't delete super admin
    const userResult = await pool.query('SELECT role FROM admin_users WHERE id = $1', [id]);
    if (userResult.rows[0]?.role === 'super_admin') {
      return res.status(400).json({ error: 'Cannot delete super admin' });
    }

    await pool.query('DELETE FROM admin_users WHERE id = $1', [id]);

    await pool.query(
      'INSERT INTO admin_activity_log (admin_user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
      [req.admin.id, 'DELETE_ADMIN_USER', 'admin_users', id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Delete admin user error:', error);
    res.status(500).json({ error: 'Failed to delete admin user' });
  }
});

// Get Available Roles
router.get('/roles', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admin_roles ORDER BY role_name');
    res.json({ roles: result.rows });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
});

// Get Activity Log
router.get('/activity-log', authenticateAdmin, checkPermission('audit_logs', 'read'), async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const result = await pool.query(`
      SELECT 
        aal.*,
        au.username,
        au.first_name || ' ' || au.last_name as admin_name
      FROM admin_activity_log aal
      LEFT JOIN admin_users au ON aal.admin_user_id = au.id
      ORDER BY aal.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ error: 'Failed to get activity log' });
  }
});

module.exports = { router, authenticateAdmin, checkPermission };
