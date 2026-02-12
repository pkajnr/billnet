-- Admin Users & Roles System

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'moderator',
  is_active BOOLEAN DEFAULT true,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  last_login TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES admin_users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_role CHECK (role IN ('super_admin', 'administrator', 'moderator', 'analyst', 'support', 'content_manager', 'financial_manager', 'auditor'))
);

-- Admin Roles & Permissions
CREATE TABLE IF NOT EXISTS admin_roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,
  is_system_role BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Activity Log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER REFERENCES admin_users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER REFERENCES admin_users(id),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin roles with permissions
INSERT INTO admin_roles (role_name, display_name, description, permissions) VALUES
  ('super_admin', 'Super Administrator', 'Full system access with all permissions', 
   '{"users": ["read", "create", "update", "delete"], "ideas": ["read", "create", "update", "delete"], "verifications": ["read", "create", "update", "delete"], "reports": ["read", "create", "update", "delete"], "settings": ["read", "create", "update", "delete"], "admins": ["read", "create", "update", "delete"], "analytics": ["read"], "audit_logs": ["read"], "system": ["read", "update"]}'::jsonb),
  
  ('administrator', 'Administrator', 'High-level access, cannot modify system settings', 
   '{"users": ["read", "create", "update", "delete"], "ideas": ["read", "create", "update", "delete"], "verifications": ["read", "create", "update", "delete"], "reports": ["read", "create", "update"], "settings": ["read", "update"], "admins": ["read", "create", "update"], "analytics": ["read"], "audit_logs": ["read"]}'::jsonb),
  
  ('moderator', 'Moderator', 'Content review and user management', 
   '{"users": ["read", "update"], "ideas": ["read", "update", "delete"], "verifications": ["read", "update"], "reports": ["read"], "analytics": ["read"]}'::jsonb),
  
  ('analyst', 'Data Analyst', 'Read-only access to reports and analytics', 
   '{"users": ["read"], "ideas": ["read"], "verifications": ["read"], "reports": ["read", "create", "update"], "analytics": ["read"], "audit_logs": ["read"]}'::jsonb),
  
  ('support', 'Support Specialist', 'User management and verification handling', 
   '{"users": ["read", "update"], "verifications": ["read", "update"], "reports": ["read"]}'::jsonb),
  
  ('content_manager', 'Content Manager', 'Manage ideas and content moderation', 
   '{"ideas": ["read", "create", "update", "delete"], "users": ["read"], "reports": ["read"]}'::jsonb),
  
  ('financial_manager', 'Financial Manager', 'Transaction and payment management', 
   '{"users": ["read"], "reports": ["read", "create"], "analytics": ["read"], "transactions": ["read", "update"]}'::jsonb),
  
  ('auditor', 'Auditor', 'Read-only access to all system data', 
   '{"users": ["read"], "ideas": ["read"], "verifications": ["read"], "reports": ["read"], "analytics": ["read"], "audit_logs": ["read"], "admins": ["read"]}'::jsonb)
ON CONFLICT (role_name) DO NOTHING;

-- Create default super admin user
-- Username: superadmin
-- Password: Admin@2026!
-- IMPORTANT: Change this password after first login!
INSERT INTO admin_users (username, email, password_hash, first_name, last_name, role, is_active, mfa_enabled)
VALUES ('superadmin', 'admin@billnet.com', '$2b$10$rXY8qZ9JpK3LmNxH5vW4.eFgHiJkLmNoPqRsTuVwXyZ1A2B3C4D5E6', 'Super', 'Admin', 'super_admin', true, false)
ON CONFLICT (username) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_user ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created ON admin_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(admin_user_id);

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_activity_log (admin_user_id, action, resource_type, resource_id, details)
  VALUES (
    COALESCE(current_setting('app.current_admin_id', true)::INTEGER, NULL),
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE 
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
      ELSE row_to_json(NEW)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create view for active admin users with their last activity
CREATE OR REPLACE VIEW admin_users_with_activity AS
SELECT 
  au.*,
  ar.display_name as role_display_name,
  ar.description as role_description,
  (SELECT COUNT(*) FROM admin_activity_log WHERE admin_user_id = au.id AND created_at > NOW() - INTERVAL '30 days') as actions_last_30_days,
  (SELECT MAX(created_at) FROM admin_activity_log WHERE admin_user_id = au.id) as last_activity
FROM admin_users au
LEFT JOIN admin_roles ar ON au.role = ar.role_name;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON admin_users TO PUBLIC;
GRANT SELECT ON admin_roles TO PUBLIC;
GRANT INSERT ON admin_activity_log TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_sessions TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;
