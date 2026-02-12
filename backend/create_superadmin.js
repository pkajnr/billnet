// Create superadmin user directly in database with correct hash
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const password = 'Admin@2026!';
const hash = bcrypt.hashSync(password, 10);

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

async function createSuperAdmin() {
  try {
    console.log('\n=== Creating Superadmin Account ===');
    console.log('Connecting to database...');
    
    // Delete existing superadmin if exists
    await pool.query('DELETE FROM admin_users WHERE username = $1', ['superadmin']);
    
    // Insert new superadmin with correct hash
    const result = await pool.query(
      `INSERT INTO admin_users (username, email, password_hash, first_name, last_name, role, is_active, mfa_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, email, role`,
      ['superadmin', 'admin@billnet.com', hash, 'Super', 'Admin', 'super_admin', true, false]
    );
    
    console.log('\n✅ Superadmin account created successfully!');
    console.log('\nCredentials:');
    console.log('  Username: superadmin');
    console.log('  Email: admin@billnet.com');
    console.log('  Password: Admin@2026!');
    console.log('\nPassword Hash:', hash);
    console.log('\nAccount Details:', result.rows[0]);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');
    
  } catch (error) {
    console.error('\n❌ Error creating superadmin:', error.message);
    if (error.code === '42P01') {
      console.log('\n⚠️  Admin tables do not exist. Run admin_users_schema.sql first:');
      console.log('   psql -U postgres -d billnet -f admin_users_schema.sql\n');
    }
  } finally {
    await pool.end();
  }
}

createSuperAdmin();
