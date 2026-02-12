// Comprehensive Database & Admin System Test
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

async function testDatabase() {
  console.log('\n========================================');
  console.log('   BillNet Database & Admin Test');
  console.log('========================================\n');

  try {
    // Test 1: Database Connection
    console.log('📊 Test 1: Database Connection');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully\n');

    // Test 2: Check Admin Tables
    console.log('📊 Test 2: Admin Tables');
    const adminTables = ['admin_users', 'admin_roles', 'admin_sessions', 'admin_activity_log'];
    for (const table of adminTables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);
      console.log(`${result.rows[0].exists ? '✅' : '❌'} ${table} table ${result.rows[0].exists ? 'exists' : 'MISSING'}`);
    }
    console.log();

    // Test 3: Check Regular Tables
    console.log('📊 Test 3: Application Tables');
    const appTables = ['users', 'ideas', 'investments', 'user_verifications'];
    for (const table of appTables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ ${table} - ${countResult.rows[0].count} records`);
      } else {
        console.log(`❌ ${table} table MISSING`);
      }
    }
    console.log();

    // Test 4: Check Admin Users
    console.log('📊 Test 4: Admin Users');
    const adminUsersResult = await pool.query(`
      SELECT u.id, u.username, u.email, u.role, u.is_active, u.mfa_enabled, 
             r.display_name as role_display
      FROM admin_users u
      LEFT JOIN admin_roles r ON u.role = r.role_name
      ORDER BY u.id
    `);
    
    if (adminUsersResult.rows.length === 0) {
      console.log('⚠️  No admin users found!');
      console.log('Run: node create_superadmin.js\n');
    } else {
      console.log(`Found ${adminUsersResult.rows.length} admin user(s):\n`);
      adminUsersResult.rows.forEach(admin => {
        console.log(`  👤 ${admin.username} (${admin.role_display || admin.role})`);
        console.log(`     Email: ${admin.email}`);
        console.log(`     Status: ${admin.is_active ? 'Active' : 'Inactive'}`);
        console.log(`     MFA: ${admin.mfa_enabled ? 'Enabled' : 'Disabled'}`);
        console.log();
      });
    }

    // Test 5: Verify Superadmin Password
    if (adminUsersResult.rows.length > 0) {
      console.log('📊 Test 5: Superadmin Password Verification');
      const superadmin = adminUsersResult.rows.find(u => u.username === 'superadmin');
      
      if (superadmin) {
        const adminWithHash = await pool.query(
          'SELECT password_hash FROM admin_users WHERE username = $1',
          ['superadmin']
        );
        const isValid = await bcrypt.compare('Admin@2026!', adminWithHash.rows[0].password_hash);
        
        if (isValid) {
          console.log('✅ Password "Admin@2026!" is VALID\n');
        } else {
          console.log('❌ Password "Admin@2026!" is INVALID');
          console.log('Run: node create_superadmin.js to fix\n');
        }
      } else {
        console.log('⚠️  No superadmin user found\n');
      }
    }

    // Test 6: Check Regular Users
    console.log('📊 Test 6: Platform Users');
    const usersResult = await pool.query(`
      SELECT id, first_name, last_name, email, role, is_certified, 
             is_email_verified, wallet_balance, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    if (usersResult.rows.length === 0) {
      console.log('⚠️  No users registered yet\n');
    } else {
      console.log(`Found ${usersResult.rows.length} recent user(s):\n`);
      usersResult.rows.forEach(user => {
        console.log(`  👤 ${user.first_name} ${user.last_name} (${user.role})`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Certified: ${user.is_certified ? 'Yes' : 'No'}`);
        console.log(`     Verified: ${user.is_email_verified ? 'Yes' : 'No'}`);
        console.log(`     Balance: $${parseFloat(user.wallet_balance).toFixed(2)}`);
        console.log(`     Joined: ${new Date(user.created_at).toLocaleDateString()}`);
        console.log();
      });
    }

    // Test 7: Check Ideas
    console.log('📊 Test 7: Investment Ideas');
    const ideasResult = await pool.query(`
      SELECT i.id, i.title, i.category, i.funding_goal, i.current_funding, 
             i.status, i.post_type, u.first_name, u.last_name
      FROM ideas i
      JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC
      LIMIT 5
    `);
    
    if (ideasResult.rows.length === 0) {
      console.log('⚠️  No ideas posted yet\n');
    } else {
      console.log(`Found ${ideasResult.rows.length} recent idea(s):\n`);
      ideasResult.rows.forEach(idea => {
        console.log(`  💡 ${idea.title}`);
        console.log(`     Category: ${idea.category}`);
        console.log(`     Type: ${idea.post_type}`);
        console.log(`     Goal: $${parseFloat(idea.funding_goal).toFixed(2)}`);
        console.log(`     Raised: $${parseFloat(idea.current_funding).toFixed(2)}`);
        console.log(`     Status: ${idea.status}`);
        console.log(`     By: ${idea.first_name} ${idea.last_name}`);
        console.log();
      });
    }

    // Test 8: Check Verifications
    console.log('📊 Test 8: User Verifications');
    const verificationsResult = await pool.query(`
      SELECT v.id, v.status, v.document_type, v.certification_type,
             u.first_name, u.last_name, v.submitted_at
      FROM user_verifications v
      JOIN users u ON v.user_id = u.id
      ORDER BY v.submitted_at DESC
      LIMIT 5
    `);
    
    if (verificationsResult.rows.length === 0) {
      console.log('⚠️  No verification requests yet\n');
    } else {
      console.log(`Found ${verificationsResult.rows.length} verification(s):\n`);
      verificationsResult.rows.forEach(ver => {
        console.log(`  🔍 ${ver.first_name} ${ver.last_name}`);
        console.log(`     Status: ${ver.status}`);
        console.log(`     Type: ${ver.certification_type || ver.document_type}`);
        console.log(`     Submitted: ${new Date(ver.submitted_at).toLocaleDateString()}`);
        console.log();
      });
    }

    // Test 9: Statistics Summary
    console.log('📊 Test 9: Platform Statistics');
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_email_verified = true) as verified_users,
        (SELECT COUNT(*) FROM ideas) as total_ideas,
        (SELECT COUNT(*) FROM ideas WHERE status = 'active') as active_ideas,
        (SELECT COUNT(*) FROM investments) as total_investments,
        (SELECT COALESCE(SUM(amount), 0) FROM investments) as total_invested,
        (SELECT COUNT(*) FROM user_verifications WHERE status = 'pending') as pending_verifications,
        (SELECT COUNT(*) FROM admin_users WHERE is_active = true) as active_admins
    `);
    
    const s = stats.rows[0];
    console.log(`  Total Users: ${s.total_users} (${s.verified_users} verified)`);
    console.log(`  Total Ideas: ${s.total_ideas} (${s.active_ideas} active)`);
    console.log(`  Total Investments: ${s.total_investments}`);
    console.log(`  Total Invested: $${parseFloat(s.total_invested).toFixed(2)}`);
    console.log(`  Pending Verifications: ${s.pending_verifications}`);
    console.log(`  Active Admins: ${s.active_admins}`);
    console.log();

    console.log('========================================');
    console.log('✅ All Tests Complete!');
    console.log('========================================\n');

    console.log('🚀 Ready to use:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Admin Panel: http://localhost:5174');
    console.log('   Backend API: http://localhost:5000\n');

    if (adminUsersResult.rows.length > 0) {
      console.log('🔐 Admin Login:');
      console.log('   Username: superadmin');
      console.log('   Password: Admin@2026!\n');
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Cannot connect to database. Make sure PostgreSQL is running.\n');
    } else if (error.code === '42P01') {
      console.log('\n⚠️  Tables are missing. Run database migrations:\n');
      console.log('   psql -U postgres -d billnet -f database.sql');
      console.log('   psql -U postgres -d billnet -f admin_users_schema.sql\n');
    }
  } finally {
    await pool.end();
  }
}

testDatabase();
