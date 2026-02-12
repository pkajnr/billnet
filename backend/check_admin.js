// Check if superadmin exists and verify password
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const dbConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'billnet',
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    };

const pool = new Pool(dbConfig);

async function checkAdmin() {
  try {
    console.log('\n=== Checking Admin Setup ===\n');
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ admin_users table does NOT exist!');
      console.log('\nRun this command first:');
      console.log('  psql -U postgres -d billnet -f admin_users_schema.sql\n');
      return;
    }
    
    console.log('✅ admin_users table exists');
    
    // Check for superadmin
    const adminCheck = await pool.query(
      'SELECT id, username, email, role, is_active, mfa_enabled, password_hash FROM admin_users WHERE username = $1',
      ['superadmin']
    );
    
    if (adminCheck.rows.length === 0) {
      console.log('❌ superadmin user does NOT exist!');
      console.log('\nRun this command to create it:');
      console.log('  node create_superadmin.js\n');
      return;
    }
    
    const admin = adminCheck.rows[0];
    console.log('✅ superadmin user exists\n');
    console.log('User Details:');
    console.log('  ID:', admin.id);
    console.log('  Username:', admin.username);
    console.log('  Email:', admin.email);
    console.log('  Role:', admin.role);
    console.log('  Active:', admin.is_active);
    console.log('  MFA Enabled:', admin.mfa_enabled);
    console.log('  Password Hash:', admin.password_hash.substring(0, 20) + '...');
    
    // Test password
    const testPassword = 'Admin@2026!';
    const isValid = await bcrypt.compare(testPassword, admin.password_hash);
    
    console.log('\nPassword Test:');
    console.log('  Testing password: Admin@2026!');
    console.log('  Result:', isValid ? '✅ VALID' : '❌ INVALID');
    
    if (!isValid) {
      console.log('\n⚠️  The password hash is incorrect!');
      console.log('Run this to fix:');
      console.log('  node create_superadmin.js\n');
    } else {
      console.log('\n✅ Everything looks good! You should be able to login.');
      console.log('\nLogin Credentials:');
      console.log('  Username: superadmin');
      console.log('  Password: Admin@2026!');
      console.log('  URL: http://localhost:5174\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdmin();
