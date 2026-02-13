// Load environment variables FIRST before anything else
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const emailService = require('./emailService');
const { router: adminAuthRouter, authenticateAdmin, checkPermission } = require('./adminAuth');

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'qwerty',
  'qwerty123',
  '123456',
  '123456789',
  'admin',
  'welcome',
  'letmein',
  'iloveyou',
  'abc123',
  'default',
  'changeme'
]);

function validateSignupPassword(password, context = {}) {
  const issues = [];
  const passwordValue = typeof password === 'string' ? password : '';
  const trimmedPassword = passwordValue.trim();

  if (trimmedPassword.length < 12) {
    issues.push('Password must be at least 12 characters long.');
  }

  if (trimmedPassword.length > 128) {
    issues.push('Password must be 128 characters or fewer.');
  }

  if (/\s/.test(passwordValue)) {
    issues.push('Password cannot contain spaces.');
  }

  if (!/[a-z]/.test(passwordValue)) {
    issues.push('Password must include at least one lowercase letter.');
  }

  if (!/[A-Z]/.test(passwordValue)) {
    issues.push('Password must include at least one uppercase letter.');
  }

  if (!/[0-9]/.test(passwordValue)) {
    issues.push('Password must include at least one number.');
  }

  if (!/[^A-Za-z0-9]/.test(passwordValue)) {
    issues.push('Password must include at least one special character.');
  }

  if (/(.)\1{2,}/.test(passwordValue)) {
    issues.push('Password cannot contain the same character repeated 3 or more times in a row.');
  }

  const lowerPassword = passwordValue.toLowerCase();
  const lowerNoSymbols = lowerPassword.replace(/[^a-z0-9]/g, '');
  const emailLocalPart = (context.email || '').split('@')[0].toLowerCase();
  const firstName = (context.firstName || '').toLowerCase();
  const lastName = (context.lastName || '').toLowerCase();

  for (const commonPassword of COMMON_PASSWORDS) {
    if (lowerNoSymbols.includes(commonPassword)) {
      issues.push('Password is too common. Choose a more unique password.');
      break;
    }
  }

  const personalTokens = [emailLocalPart, firstName, lastName]
    .map((token) => token.replace(/[^a-z0-9]/g, ''))
    .filter((token) => token.length >= 3);

  if (personalTokens.some((token) => lowerNoSymbols.includes(token))) {
    issues.push('Password cannot include your name or email username.');
  }

  const weakSequences = ['1234', 'abcd', 'qwerty'];
  if (weakSequences.some((sequence) => lowerNoSymbols.includes(sequence))) {
    issues.push('Password cannot contain predictable sequences like 1234, abcd, or qwerty.');
  }

  return issues;
}

const app = express();
const port = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.CORS_ORIGIN === '*') {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in development
    }
  },
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Admin authentication routes
app.use('/api/admin/auth', adminAuthRouter);

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
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    };

const pool = new Pool(dbConfig);

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('Database connected successfully');
    release();
  }
});

// Initialize database tables on startup
const initializeDatabaseTables = async () => {
  try {
    console.log('Initializing database tables...');
    
    // Create all tables with IF NOT EXISTS - they won't be recreated if they exist
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('entrepreneur', 'investor')),
        profile_image VARCHAR(500),
        bio TEXT,
        wallet_balance DECIMAL(15, 2) DEFAULT 0,
        is_email_verified BOOLEAN DEFAULT FALSE,
        email_verified_at TIMESTAMP,
        verification_token VARCHAR(255),
        is_certified BOOLEAN DEFAULT FALSE,
        certification_type VARCHAR(50),
        certification_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure wallet_balance exists on legacy tables
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(15, 2) DEFAULT 0
    `);

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_certified BOOLEAN DEFAULT FALSE
    `);

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS certification_type VARCHAR(50)
    `);

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS certification_date TIMESTAMP
    `);

    // Add bitcoin_address column for payment methods
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS bitcoin_address VARCHAR(100)
    `);

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS bitcoin_address_generated_at TIMESTAMP
    `);

    // Create indexes on users table
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_bitcoin_address ON users(bitcoin_address)`);

    // Create ideas table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ideas (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        funding_goal DECIMAL(12, 2) NOT NULL,
        current_funding DECIMAL(12, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'funded', 'closed')),
        post_type VARCHAR(20) DEFAULT 'idea',
        equity_percentage DECIMAL(5, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Drop old constraint and add new one to allow 'shares' (plural)
    try {
      await pool.query(`
        ALTER TABLE ideas DROP CONSTRAINT IF EXISTS ideas_post_type_check
      `);
      await pool.query(`
        ALTER TABLE ideas ADD CONSTRAINT ideas_post_type_check 
        CHECK (post_type IN ('idea', 'business', 'share', 'shares'))
      `);
    } catch (err) {
      console.log('Note: Could not update post_type constraint:', err.message);
    }

    // Create investments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS investments (
        id SERIAL PRIMARY KEY,
        idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
        investor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(12, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        related_idea_id INTEGER REFERENCES ideas(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create bids table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bids (
        id SERIAL PRIMARY KEY,
        idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
        investor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bid_amount DECIMAL(15, 2) NOT NULL,
        equity_percentage DECIMAL(5, 2) NOT NULL,
        counter_amount DECIMAL(15, 2),
        counter_equity DECIMAL(5, 2),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(idea_id, investor_id)
      )
    `);

    // Create favorites table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, idea_id)
      )
    `);

    // Create follows table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id),
        CHECK (follower_id != following_id)
      )
    `);

    // Create comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(idea_id, user_id)
      )
    `);

    // Create idea details table (for additional fields)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS idea_details (
        id SERIAL PRIMARY KEY,
        idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
        market_size VARCHAR(255),
        target_audience TEXT,
        revenue_projection DECIMAL(15, 2),
        break_even_months INTEGER,
        team_size INTEGER,
        website VARCHAR(255),
        customer_acquisition_cost DECIMAL(10, 2),
        use_of_funds TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create attachments table (for files)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id SERIAL PRIMARY KEY,
        idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INTEGER,
        file_url VARCHAR(500) NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Drop the CHECK constraint on document_type if it exists
    try {
      await pool.query(`
        ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_document_type_check
      `);
    } catch (err) {
      console.log('Note: Could not drop attachments constraint:', err.message);
    }

    // Migration: Rename recipient_id to receiver_id if it exists (for existing databases)
    try {
      const columnCheck = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='messages' AND column_name='recipient_id'
      `);
      
      if (columnCheck.rows.length > 0) {
        console.log('Migrating messages table: recipient_id → receiver_id');
        await pool.query(`
          ALTER TABLE messages RENAME COLUMN recipient_id TO receiver_id
        `);
      }
    } catch (e) {
      console.log('Migration check skipped (messages table may not exist yet)');
    }

    // Migration: Add counter_amount and counter_equity columns to bids table if they don't exist
    try {
      const counterAmountCheck = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='bids' AND column_name='counter_amount'
      `);
      
      if (counterAmountCheck.rows.length === 0) {
        console.log('Adding counter_amount and counter_equity columns to bids table');
        await pool.query(`
          ALTER TABLE bids 
          ADD COLUMN IF NOT EXISTS counter_amount DECIMAL(15, 2),
          ADD COLUMN IF NOT EXISTS counter_equity DECIMAL(5, 2)
        `);
      }

      // Update status constraint to include 'countered'
      await pool.query(`
        ALTER TABLE bids DROP CONSTRAINT IF EXISTS bids_status_check
      `);
      await pool.query(`
        ALTER TABLE bids ADD CONSTRAINT bids_status_check 
        CHECK (status IN ('pending', 'accepted', 'rejected', 'countered'))
      `);
    } catch (e) {
      console.log('Bids migration check skipped:', e.message);
    }

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_investments_idea_id ON investments(idea_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_investments_investor_id ON investments(investor_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_bids_idea_id ON bids(idea_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_bids_investor_id ON bids(investor_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_favorites_idea_id ON favorites(idea_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON comments(idea_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_reviews_idea_id ON reviews(idea_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`);

    // User verification requests
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_verifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        country VARCHAR(80),
        id_number VARCHAR(120),
        document_type VARCHAR(80),
        document_url VARCHAR(500),
        certification_type VARCHAR(50),
        company_registration_url VARCHAR(500),
        position_title VARCHAR(200),
        position_proof_url VARCHAR(500),
        extra_documents JSONB,
        investor_status VARCHAR(120),
        bank_statement_url VARCHAR(500),
        source_of_funds TEXT,
        income_proof_url VARCHAR(500),
        note TEXT,
        reviewer_note TEXT,
        reviewed_by VARCHAR(120),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP
      )
    `);

    const alterVerificationColumns = [
      "ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS company_registration_url VARCHAR(500)",
      "ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS position_title VARCHAR(200)",
      "ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS position_proof_url VARCHAR(500)",
      "ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS extra_documents JSONB",
      "ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS investor_status VARCHAR(120)",
      "ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS bank_statement_url VARCHAR(500)",
      "ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS source_of_funds TEXT",
      "ALTER TABLE user_verifications ADD COLUMN IF NOT EXISTS income_proof_url VARCHAR(500)"
    ];
    for (const stmt of alterVerificationColumns) {
      await pool.query(stmt);
    }

    // Transactions table for deposits/withdrawals
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'investment', 'payout')),
        method VARCHAR(40),
        provider VARCHAR(80),
        currency VARCHAR(10) DEFAULT 'USD',
        amount DECIMAL(15, 2) NOT NULL,
        fee DECIMAL(15, 2) DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
        reference VARCHAR(120),
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP
      )
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`);

    // Marketplace tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS asset_listings (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('idea', 'business', 'share', 'equity')),
        asset_id INTEGER,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100),
        price DECIMAL(15, 2) NOT NULL CHECK (price > 0),
        quantity DECIMAL(10, 4) DEFAULT 1 CHECK (quantity > 0),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
        images TEXT[] DEFAULT '{}',
        metadata JSONB,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sold_at TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS asset_ownership (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        asset_type VARCHAR(50) NOT NULL,
        asset_id INTEGER,
        listing_id INTEGER REFERENCES asset_listings(id) ON DELETE SET NULL,
        quantity DECIMAL(10, 4) NOT NULL CHECK (quantity > 0),
        purchase_price DECIMAL(15, 2) NOT NULL,
        current_value DECIMAL(15, 2),
        metadata JSONB,
        acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS asset_transactions (
        id SERIAL PRIMARY KEY,
        listing_id INTEGER REFERENCES asset_listings(id) ON DELETE SET NULL,
        seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        asset_type VARCHAR(50) NOT NULL,
        quantity DECIMAL(10, 4) NOT NULL,
        price DECIMAL(15, 2) NOT NULL,
        total_amount DECIMAL(15, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS asset_offers (
        id SERIAL PRIMARY KEY,
        listing_id INTEGER NOT NULL REFERENCES asset_listings(id) ON DELETE CASCADE,
        buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        offered_price DECIMAL(15, 2) NOT NULL CHECK (offered_price > 0),
        quantity DECIMAL(10, 4) DEFAULT 1,
        message TEXT,
        counter_price DECIMAL(15, 2),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'counter')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS asset_watchlist (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        listing_id INTEGER NOT NULL REFERENCES asset_listings(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, listing_id)
      )
    `);

    // Add seller stats columns to users
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_rating DECIMAL(3, 2) DEFAULT 0`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS successful_sales INTEGER DEFAULT 0`);

    // Add password reset columns to users
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP`);

    // Create indexes for marketplace tables
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_asset_listings_seller_id ON asset_listings(seller_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_asset_listings_status ON asset_listings(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_asset_listings_asset_type ON asset_listings(asset_type)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_asset_ownership_user_id ON asset_ownership(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_asset_transactions_seller_id ON asset_transactions(seller_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_asset_transactions_buyer_id ON asset_transactions(buyer_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_asset_offers_listing_id ON asset_offers(listing_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_asset_offers_buyer_id ON asset_offers(buyer_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_asset_watchlist_user_id ON asset_watchlist(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_asset_watchlist_listing_id ON asset_watchlist(listing_id)`);

    console.log('✓ All database tables initialized successfully (including marketplace)');
  } catch (error) {
    console.error('Error initializing database tables:', error);
  }
};

// Initialize tables on startup
initializeDatabaseTables();

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'dev-admin-secret-change';

const requireAdminSecret = (req, res) => {
  const headerSecret = req.headers['x-admin-secret'];
  if (!headerSecret || headerSecret !== ADMIN_SECRET) {
    res.status(403).json({ error: 'Admin authorization required' });
    return false;
  }
  return true;
};

const createTransactionRecord = async ({ userId, type, method, provider, currency = 'USD', amount, fee = 0, status = 'pending', reference, description, metadata, client }) => {
  const executor = client || pool;
  const result = await executor.query(
    `INSERT INTO transactions (user_id, type, method, provider, currency, amount, fee, status, reference, description, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [userId, type, method, provider || null, currency || 'USD', amount, fee, status, reference || null, description || null, metadata || null]
  );
  return result.rows[0];
};

// Helper function to send verification email (mock - replace with actual email service)
const sendVerificationEmail = (email, token) => {
  // In production, use a service like SendGrid, Nodemailer, etc.
  console.log(`Email verification link: http://localhost:5000/api/auth/verify-email?token=${token}`);
  return Promise.resolve();
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'BillNet API is running', status: 'healthy' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'BillNet API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'BillNet API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      user: '/api/user/*',
      ideas: '/api/ideas/*',
      admin: '/api/admin/*'
    }
  });
});

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const passwordIssues = validateSignupPassword(password, { firstName, lastName, email });
    if (passwordIssues.length > 0) {
      return res.status(400).json({ error: passwordIssues[0], passwordErrors: passwordIssues });
    }

    // Default role is 'user' if not provided
    const userRole = role && ['entrepreneur', 'investor'].includes(role) ? role : 'user';

    // Check if user exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, role, verification_token, is_profile_completed) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, first_name, last_name, email, role, created_at, is_email_verified, is_profile_completed',
      [firstName, lastName, email, hashedPassword, userRole, verificationToken, false]
    );

    const user = result.rows[0];

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.is_email_verified,
        isProfileCompleted: user.is_profile_completed,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Verify Email
app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const result = await pool.query('SELECT id FROM users WHERE verification_token = $1', [token]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const userId = result.rows[0].id;

    // Update user as verified
    await pool.query(
      'UPDATE users SET is_email_verified = true, email_verified_at = CURRENT_TIMESTAMP, verification_token = NULL WHERE id = $1',
      [userId]
    );

    res.json({ message: 'Email verified successfully. You can now sign in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Server error during email verification' });
  }
});

// Development: Auto-verify user by email (for testing without email service)
app.post('/api/auth/verify-test', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const userId = result.rows[0].id;

    // Update user as verified
    await pool.query(
      'UPDATE users SET is_email_verified = true, email_verified_at = CURRENT_TIMESTAMP, verification_token = NULL WHERE id = $1',
      [userId]
    );

    res.json({ message: 'User verified successfully for testing' });
  } catch (error) {
    console.error('Test verification error:', error);
    res.status(500).json({ error: 'Server error during test verification' });
  }
});

// Sign In
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if email is verified
    if (!user.is_email_verified) {
      return res.status(403).json({ error: 'Please verify your email before signing in' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.is_email_verified,
        isProfileCompleted: user.is_profile_completed || false,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Server error during signin' });
  }
});

// Forgot Password - Request reset
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const result = await pool.query('SELECT id, first_name, email FROM users WHERE email = $1', [email]);
    
    // Only send email if account exists, but always return same message (security best practice)
    if (result.rows.length > 0) {
      const user = result.rows[0];

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token in database
      await pool.query(
        'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
        [resetToken, resetTokenExpiry, user.id]
      );

      // Send password reset email (don't fail the request if email fails)
      try {
        await emailService.sendPasswordResetEmail(user.email, user.first_name, resetToken);
        console.log(`Password reset email sent to ${user.email}`);
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
        // Continue - don't reveal email failure
      }
    } else {
      console.log(`Password reset requested for non-existent email: ${email}`);
    }

    // Always return same message for security (prevents user enumeration)
    res.json({ message: 'If an account exists with this email, you will receive a password reset link shortly.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error processing request' });
  }
});

// Reset Password - Update password with token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Find user with valid reset token
    const result = await pool.query(
      'SELECT id, email, first_name FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = result.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [passwordHash, user.id]
    );

    console.log(`Password reset successful for user ${user.email}`);

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error resetting password' });
  }
});

// Get User Profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, role, profile_image, bio, is_email_verified, is_profile_completed, email_verified_at, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      profileImage: user.profile_image,
      bio: user.bio,
      isEmailVerified: user.is_email_verified,
      isProfileCompleted: user.is_profile_completed || false,
      emailVerifiedAt: user.email_verified_at,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// Update User Profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, bio, profileImage } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    const result = await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, bio = $3, profile_image = $4 WHERE id = $5 RETURNING id, first_name, last_name, email, role, profile_image, bio, is_email_verified, created_at',
      [firstName, lastName, bio || null, profileImage || null, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      profileImage: user.profile_image,
      bio: user.bio,
      isEmailVerified: user.is_email_verified,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// Complete User Profile (First-time registration)
app.post('/api/user/complete-profile', authenticateToken, async (req, res) => {
  try {
    const { role, bio, profileImage } = req.body;

    // Validate role
    if (!role || !['entrepreneur', 'investor'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (entrepreneur or investor)' });
    }

    // Update user profile with role and mark as completed
    const result = await pool.query(
      'UPDATE users SET role = $1, bio = $2, profile_image = $3, is_profile_completed = TRUE WHERE id = $4 RETURNING id, first_name, last_name, email, role, profile_image, bio, is_email_verified, is_profile_completed, created_at',
      [role, bio || null, profileImage || null, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        profileImage: user.profile_image,
        bio: user.bio,
        isEmailVerified: user.is_email_verified,
        isProfileCompleted: user.is_profile_completed,
        createdAt: user.created_at,
      }
    });
  } catch (error) {
    console.error('Profile completion error:', error);
    res.status(500).json({ error: 'Server error completing profile' });
  }
});

// Change Password
app.post('/api/user/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get user's current password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error changing password' });
  }
});

// Submit or update verification request
app.post('/api/user/verification/request', authenticateToken, async (req, res) => {
  try {
    const {
      country,
      idNumber,
      documentType,
      documentUrl,
      certificationType,
      note,
      companyRegistrationUrl,
      positionTitle,
      positionProofUrl,
      extraDocuments,
      investorStatus,
      bankStatementUrl,
      sourceOfFunds,
      incomeProofUrl,
    } = req.body;

    if (!country || !idNumber || !documentType || !documentUrl) {
      return res.status(400).json({ error: 'country, idNumber, documentType, and documentUrl are required' });
    }

    await pool.query('BEGIN');
    await pool.query(
      `INSERT INTO user_verifications (
         user_id, country, id_number, document_type, document_url, certification_type,
         company_registration_url, position_title, position_proof_url, extra_documents,
         investor_status, bank_statement_url, source_of_funds, income_proof_url,
         note, status, submitted_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         country = EXCLUDED.country,
         id_number = EXCLUDED.id_number,
         document_type = EXCLUDED.document_type,
         document_url = EXCLUDED.document_url,
         certification_type = EXCLUDED.certification_type,
         company_registration_url = EXCLUDED.company_registration_url,
         position_title = EXCLUDED.position_title,
         position_proof_url = EXCLUDED.position_proof_url,
         extra_documents = EXCLUDED.extra_documents,
         investor_status = EXCLUDED.investor_status,
         bank_statement_url = EXCLUDED.bank_statement_url,
         source_of_funds = EXCLUDED.source_of_funds,
         income_proof_url = EXCLUDED.income_proof_url,
         note = EXCLUDED.note,
         status = 'pending',
         reviewer_note = NULL,
         reviewed_by = NULL,
         reviewed_at = NULL,
         submitted_at = CURRENT_TIMESTAMP
      `,
      [
        req.user.id,
        country,
        idNumber,
        documentType,
        documentUrl,
        certificationType || null,
        companyRegistrationUrl || null,
        positionTitle || null,
        positionProofUrl || null,
        extraDocuments || null,
        investorStatus || null,
        bankStatementUrl || null,
        sourceOfFunds || null,
        incomeProofUrl || null,
        note || null,
      ]
    );

    await pool.query(
      `UPDATE users SET is_certified = false, certification_type = NULL, certification_date = NULL WHERE id = $1`,
      [req.user.id]
    );

    await pool.query('COMMIT');

    res.json({
      message: 'Verification submitted and set to pending review',
      status: 'pending'
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Verification request error:', error);
    res.status(500).json({ error: 'Server error submitting verification' });
  }
});

// Get verification status
app.get('/api/user/verification/status', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.status, v.country, v.id_number, v.document_type, v.document_url, v.certification_type, v.note, v.reviewer_note, v.reviewed_at, v.submitted_at,
              v.company_registration_url, v.position_title, v.position_proof_url, v.extra_documents,
              v.investor_status, v.bank_statement_url, v.source_of_funds, v.income_proof_url,
              u.is_certified, u.certification_type as user_certification_type, u.certification_date
       FROM users u
       LEFT JOIN user_verifications v ON v.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = result.rows[0];
    res.json({
      status: row.status || 'not_submitted',
      isCertified: row.is_certified,
      certificationType: row.user_certification_type,
      certificationDate: row.certification_date,
      details: {
        country: row.country,
        idNumber: row.id_number,
        documentType: row.document_type,
        documentUrl: row.document_url,
        certificationType: row.certification_type,
        note: row.note,
        reviewerNote: row.reviewer_note,
        reviewedAt: row.reviewed_at,
        submittedAt: row.submitted_at,
        companyRegistrationUrl: row.company_registration_url,
        positionTitle: row.position_title,
        positionProofUrl: row.position_proof_url,
        extraDocuments: row.extra_documents,
        investorStatus: row.investor_status,
        bankStatementUrl: row.bank_statement_url,
        sourceOfFunds: row.source_of_funds,
        incomeProofUrl: row.income_proof_url,
      }
    });
  } catch (error) {
    console.error('Verification status error:', error);
    res.status(500).json({ error: 'Server error fetching verification status' });
  }
});

// Admin decision (approve/reject) verification
app.post('/api/user/verification/admin/decision', async (req, res) => {
  try {
    if (!requireAdminSecret(req, res)) return;

    const { userId, decision, certificationType, reviewerNote } = req.body;
    if (!userId || !decision || !['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'userId and decision (approved|rejected) are required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE user_verifications
         SET status = $1,
             certification_type = COALESCE($2, certification_type),
             reviewer_note = $3,
             reviewed_by = 'admin',
             reviewed_at = CURRENT_TIMESTAMP
         WHERE user_id = $4`,
        [decision, certificationType || null, reviewerNote || null, userId]
      );

      if (decision === 'approved') {
        await client.query(
          `UPDATE users
           SET is_certified = true,
               certification_type = COALESCE($1, certification_type, 'standard'),
               certification_date = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [certificationType || null, userId]
        );
      } else {
        await client.query(
          `UPDATE users
           SET is_certified = false,
               certification_type = NULL,
               certification_date = NULL
           WHERE id = $1`,
          [userId]
        );
      }

      await client.query('COMMIT');
      res.json({ message: `Verification ${decision}`, status: decision });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Verification decision error:', error);
    res.status(500).json({ error: 'Server error processing decision' });
  }
});

// ============ ADMIN ENDPOINTS ============

// Verify admin authentication
app.get('/api/admin/verify', authenticateAdmin, (req, res) => {
  res.json({ message: 'Admin verified', admin: req.admin });
});

// Get admin statistics
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {

    const [usersResult, ideasResult, investmentsResult, verificationsResult, revenueResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM ideas'),
      pool.query('SELECT COUNT(*) as count FROM investments'),
      pool.query('SELECT COUNT(*) as count FROM user_verifications WHERE status = $1', ['pending']),
      pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM investments WHERE status = $1', ['completed'])
    ]);

    // Get active users (verified email)
    const activeUsersResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_email_verified = true');

    res.json({
      totalUsers: parseInt(usersResult.rows[0].count),
      totalIdeas: parseInt(ideasResult.rows[0].count),
      totalInvestments: parseInt(investmentsResult.rows[0].count),
      pendingVerifications: parseInt(verificationsResult.rows[0].count),
      totalRevenue: parseFloat(revenueResult.rows[0].total),
      activeUsers: parseInt(activeUsersResult.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Server error fetching statistics' });
  }
});

// Get comprehensive analytics
app.get('/api/admin/analytics', authenticateAdmin, async (req, res) => {
  try {
    // User metrics
    const [
      totalUsers,
      verifiedUsers,
      certifiedUsers,
      newUsersThisMonth,
      newUsersToday,
      usersByRole
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM users WHERE is_email_verified = true'),
      pool.query('SELECT COUNT(*) as count FROM users WHERE is_certified = true'),
      pool.query('SELECT COUNT(*) as count FROM users WHERE created_at >= date_trunc(\'month\', CURRENT_DATE)'),
      pool.query('SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURRENT_DATE'),
      pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role')
    ]);

    // Idea metrics
    const [
      totalIdeas,
      approvedIdeas,
      pendingIdeas,
      rejectedIdeas,
      ideasThisMonth,
      ideasByCategory
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM ideas'),
      pool.query('SELECT COUNT(*) as count FROM ideas WHERE status = $1', ['approved']),
      pool.query('SELECT COUNT(*) as count FROM ideas WHERE status = $1', ['pending']),
      pool.query('SELECT COUNT(*) as count FROM ideas WHERE status = $1', ['rejected']),
      pool.query('SELECT COUNT(*) as count FROM ideas WHERE created_at >= date_trunc(\'month\', CURRENT_DATE)'),
      pool.query('SELECT category, COUNT(*) as count FROM ideas GROUP BY category')
    ]);

    // Investment metrics
    const [
      totalInvestments,
      completedInvestments,
      totalInvestmentAmount,
      avgInvestmentAmount,
      investmentsThisMonth,
      topInvestors
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM investments'),
      pool.query('SELECT COUNT(*) as count FROM investments WHERE status = $1', ['completed']),
      pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM investments'),
      pool.query('SELECT COALESCE(AVG(amount), 0) as avg FROM investments WHERE status = $1', ['completed']),
      pool.query('SELECT COUNT(*) as count FROM investments WHERE created_at >= date_trunc(\'month\', CURRENT_DATE)'),
      pool.query(`
        SELECT u.first_name, u.last_name, u.email, COUNT(i.id) as investment_count, 
               COALESCE(SUM(i.amount), 0) as total_invested
        FROM users u
        JOIN investments i ON u.id = i.investor_id
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY total_invested DESC
        LIMIT 10
      `)
    ]);

    // Verification metrics
    const [
      totalVerifications,
      pendingVerifications,
      approvedVerifications,
      rejectedVerifications
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM user_verifications'),
      pool.query('SELECT COUNT(*) as count FROM user_verifications WHERE status = $1', ['pending']),
      pool.query('SELECT COUNT(*) as count FROM user_verifications WHERE status = $1', ['approved']),
      pool.query('SELECT COUNT(*) as count FROM user_verifications WHERE status = $1', ['rejected'])
    ]);

    // Growth metrics - Last 30 days
    const last30DaysUsers = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    const last30DaysIdeas = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM ideas
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    const last30DaysRevenue = await pool.query(`
      SELECT DATE(created_at) as date, COALESCE(SUM(amount), 0) as total
      FROM investments
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    res.json({
      users: {
        total: parseInt(totalUsers.rows[0].count),
        verified: parseInt(verifiedUsers.rows[0].count),
        certified: parseInt(certifiedUsers.rows[0].count),
        newThisMonth: parseInt(newUsersThisMonth.rows[0].count),
        newToday: parseInt(newUsersToday.rows[0].count),
        byRole: usersByRole.rows
      },
      ideas: {
        total: parseInt(totalIdeas.rows[0].count),
        approved: parseInt(approvedIdeas.rows[0].count),
        pending: parseInt(pendingIdeas.rows[0].count),
        rejected: parseInt(rejectedIdeas.rows[0].count),
        newThisMonth: parseInt(ideasThisMonth.rows[0].count),
        byCategory: ideasByCategory.rows
      },
      investments: {
        total: parseInt(totalInvestments.rows[0].count),
        completed: parseInt(completedInvestments.rows[0].count),
        totalAmount: parseFloat(totalInvestmentAmount.rows[0].total),
        avgAmount: parseFloat(avgInvestmentAmount.rows[0].avg),
        newThisMonth: parseInt(investmentsThisMonth.rows[0].count),
        topInvestors: topInvestors.rows
      },
      verifications: {
        total: parseInt(totalVerifications.rows[0].count),
        pending: parseInt(pendingVerifications.rows[0].count),
        approved: parseInt(approvedVerifications.rows[0].count),
        rejected: parseInt(rejectedVerifications.rows[0].count)
      },
      growth: {
        users: last30DaysUsers.rows,
        ideas: last30DaysIdeas.rows,
        revenue: last30DaysRevenue.rows
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
});

// Get all users
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT id, first_name, last_name, email, role, is_certified, is_email_verified, 
             created_at, wallet_balance
      FROM users
      ORDER BY created_at DESC
    `);

    const users = result.rows.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      role: row.role,
      isCertified: row.is_certified,
      isEmailVerified: row.is_email_verified,
      createdAt: row.created_at,
      walletBalance: parseFloat(row.wallet_balance || 0)
    }));

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// Delete user
app.delete('/api/admin/users/:userId', authenticateAdmin, async (req, res) => {
  try {

    const { userId } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// Get all verifications
app.get('/api/admin/verifications', authenticateAdmin, async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT v.id, v.user_id, v.status, v.country, v.id_number, v.document_type, 
             v.document_url, v.certification_type, v.note, v.submitted_at,
             v.company_registration_url, v.position_title, v.position_proof_url,
             v.investor_status, v.bank_statement_url, v.source_of_funds, v.income_proof_url,
             u.first_name, u.last_name, u.email
      FROM user_verifications v
      JOIN users u ON v.user_id = u.id
      ORDER BY 
        CASE v.status 
          WHEN 'pending' THEN 1 
          WHEN 'approved' THEN 2 
          WHEN 'rejected' THEN 3 
        END,
        v.submitted_at DESC
    `);

    const verifications = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userName: `${row.first_name} ${row.last_name}`,
      userEmail: row.email,
      status: row.status,
      country: row.country,
      idNumber: row.id_number,
      documentType: row.document_type,
      documentUrl: row.document_url,
      certificationType: row.certification_type,
      note: row.note,
      submittedAt: row.submitted_at,
      companyRegistrationUrl: row.company_registration_url,
      positionTitle: row.position_title,
      positionProofUrl: row.position_proof_url,
      investorStatus: row.investor_status,
      bankStatementUrl: row.bank_statement_url,
      sourceOfFunds: row.source_of_funds,
      incomeProofUrl: row.income_proof_url
    }));

    res.json({ verifications });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    res.status(500).json({ error: 'Server error fetching verifications' });
  }
});

// Get all ideas for admin
app.get('/api/admin/ideas', authenticateAdmin, async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT i.id, i.title, i.description, i.category, i.funding_goal, i.current_funding,
             i.status, i.post_type, i.equity_percentage, i.created_at, i.user_id,
             u.first_name, u.last_name, u.email
      FROM ideas i
      JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC
    `);

    const ideas = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      fundingGoal: parseFloat(row.funding_goal),
      currentFunding: parseFloat(row.current_funding),
      status: row.status,
      postType: row.post_type,
      equityPercentage: row.equity_percentage ? parseFloat(row.equity_percentage) : null,
      createdAt: row.created_at,
      userId: row.user_id,
      userName: `${row.first_name} ${row.last_name}`,
      userEmail: row.email
    }));

    res.json({ ideas });
  } catch (error) {
    console.error('Error fetching ideas:', error);
    res.status(500).json({ error: 'Server error fetching ideas' });
  }
});

// Delete idea
app.delete('/api/admin/ideas/:ideaId', authenticateAdmin, async (req, res) => {
  try {

    const { ideaId } = req.params;
    await pool.query('DELETE FROM ideas WHERE id = $1', [ideaId]);
    res.json({ message: 'Idea deleted successfully' });
  } catch (error) {
    console.error('Error deleting idea:', error);
    res.status(500).json({ error: 'Server error deleting idea' });
  }
});

// Update idea status
app.put('/api/admin/ideas/:ideaId/status', authenticateAdmin, async (req, res) => {
  try {

    const { ideaId } = req.params;
    const { status } = req.body;

    if (!['active', 'funded', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await pool.query('UPDATE ideas SET status = $1 WHERE id = $2', [status, ideaId]);
    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating idea status:', error);
    res.status(500).json({ error: 'Server error updating status' });
  }
});

// ============ SUGGESTED USERS ENDPOINT ============

// Get suggested users to follow
app.get('/api/users/suggested', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    // Get users that the current user is not following and exclude themselves
    const result = await pool.query(
      `SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.role,
        u.profile_image,
        u.bio
       FROM users u
       WHERE u.id != $1
         AND u.id NOT IN (
           SELECT following_id FROM follows WHERE follower_id = $1
         )
       ORDER BY u.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    const users = result.rows.map(u => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      name: `${u.first_name} ${u.last_name}`,
      role: u.role,
      profileImage: u.profile_image,
      bio: u.bio,
    }));

    res.json({ users });
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    res.status(500).json({ error: 'Server error fetching suggested users' });
  }
});

// Search users for chat by name, inferred username, email, or id
app.get('/api/users/search', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const q = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    if (!q) {
      return res.json({ users: [] });
    }

    const isNumericQuery = /^\d+$/.test(q);
    if (!isNumericQuery && q.length < 2) {
      return res.json({ users: [] });
    }

    const params = [userId];
    let query = `SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.role,
      u.profile_image,
      split_part(u.email, '@', 1) as username
    FROM users u
    WHERE u.id != $1`;

    if (isNumericQuery) {
      const idParamIndex = params.length + 1;
      query += ` AND u.id = $${idParamIndex}`;
      params.push(parseInt(q, 10));
    } else {
      const searchParamIndex = params.length + 1;
      const normalizedQuery = `%${q.toLowerCase()}%`;
      query += ` AND (
        LOWER(u.first_name) LIKE $${searchParamIndex}
        OR LOWER(u.last_name) LIKE $${searchParamIndex}
        OR LOWER(u.first_name || ' ' || u.last_name) LIKE $${searchParamIndex}
        OR LOWER(u.email) LIKE $${searchParamIndex}
        OR LOWER(split_part(u.email, '@', 1)) LIKE $${searchParamIndex}
        OR CAST(u.id AS TEXT) LIKE $${searchParamIndex}
      )`;
      params.push(normalizedQuery);
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    const users = result.rows.map((u) => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      name: `${u.first_name} ${u.last_name}`,
      username: u.username,
      email: u.email,
      role: u.role,
      profileImage: u.profile_image,
    }));

    res.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Server error searching users' });
  }
});

// ============ IDEAS ENDPOINTS ============

// Get all ideas
app.get('/api/ideas', authenticateToken, async (req, res) => {
  try {
    const limitParam = parseInt(req.query.limit, 10);
    const offsetParam = parseInt(req.query.offset, 10);
    const limit = Number.isNaN(limitParam) ? 10 : Math.min(limitParam, 50);
    const offset = Number.isNaN(offsetParam) ? 0 : Math.max(offsetParam, 0);

    const result = await pool.query(
      `SELECT 
        i.id, i.title, i.description, i.category, 
        i.funding_goal, i.current_funding, i.status, i.created_at,
        i.user_id, i.post_type, i.equity_percentage,
        u.first_name, 
        u.last_name,
        u.profile_image
      FROM ideas i
      JOIN users u ON i.user_id = u.id
      WHERE i.status = 'active' OR i.status = 'funded'
      ORDER BY i.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const ideaIds = result.rows.map(r => r.id);
    const attachmentsMap = {};

    if (ideaIds.length > 0) {
      const attachmentsResult = await pool.query(
        `SELECT idea_id, file_name, file_url, document_type, file_size
         FROM attachments
         WHERE idea_id = ANY($1)
         ORDER BY created_at ASC`,
        [ideaIds]
      );

      attachmentsResult.rows.forEach(row => {
        if (!attachmentsMap[row.idea_id]) {
          attachmentsMap[row.idea_id] = [];
        }
        attachmentsMap[row.idea_id].push({
          name: row.file_name,
          url: row.file_url,
          type: row.document_type,
          size: row.file_size
        });
      });
    }

    const ideas = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      fundingGoal: parseFloat(row.funding_goal),
      currentFunding: parseFloat(row.current_funding),
      status: row.status,
      createdAt: row.created_at,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      profileImage: row.profile_image,
      postType: row.post_type || 'idea',
      equityPercentage: row.equity_percentage ? parseFloat(row.equity_percentage) : null,
      files: attachmentsMap[row.id] || []
    }));

    res.json(ideas);
  } catch (error) {
    console.error('Error fetching ideas:', error);
    res.status(500).json({ error: 'Server error fetching ideas' });
  }
});

// Get user's ideas
app.get('/api/ideas/my-ideas', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, category, funding_goal, current_funding, status, created_at
       FROM ideas
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const ideas = result.rows.map((row) => {
      const fundingGoal = Number.parseFloat(row.funding_goal);
      const currentFunding = Number.parseFloat(row.current_funding);

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        fundingGoal: Number.isFinite(fundingGoal) ? fundingGoal : 0,
        currentFunding: Number.isFinite(currentFunding) ? currentFunding : 0,
        status: row.status,
        createdAt: row.created_at
      };
    });

    res.json({ ideas });
  } catch (error) {
    console.error('Error fetching user ideas:', error);
    res.status(500).json({ error: 'Server error fetching ideas' });
  }
});

// Get single idea by ID with details and attachments
app.get('/api/ideas/:ideaId', authenticateToken, async (req, res) => {
  try {
    const { ideaId } = req.params;

    // Get main idea details
    const ideaResult = await pool.query(
      `SELECT i.id, i.user_id, i.title, i.description, i.category, i.funding_goal, i.current_funding, 
              i.status, i.post_type, i.equity_percentage, i.created_at, i.updated_at,
              u.first_name, u.last_name, u.email, u.role, u.profile_image
       FROM ideas i
       JOIN users u ON i.user_id = u.id
       WHERE i.id = $1`,
      [ideaId]
    );

    if (ideaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    const idea = ideaResult.rows[0];

    // Try to get additional details if the table exists
    let details = null;
    try {
      const detailsResult = await pool.query(
        `SELECT market_size, target_audience, revenue_projection, break_even_months, 
                team_size, website, customer_acquisition_cost, use_of_funds,
                years_active, annual_revenue, employee_count, growth_rate,
                company_valuation, shares_offered
         FROM idea_details
         WHERE idea_id = $1`,
        [ideaId]
      );
      if (detailsResult.rows.length > 0) {
        details = detailsResult.rows[0];
      }
    } catch (err) {
      console.log('Note: idea_details table does not exist or missing columns:', err.message);
    }

    // Try to get attachments if the table exists
    let attachments = [];
    try {
      const attachmentsResult = await pool.query(
        `SELECT id, file_name, file_type, file_size, file_url, document_type, created_at
         FROM attachments
         WHERE idea_id = $1
         ORDER BY created_at DESC`,
        [ideaId]
      );
      attachments = attachmentsResult.rows.map(row => ({
        id: row.id,
        fileName: row.file_name,
        fileType: row.file_type,
        fileSize: row.file_size,
        fileUrl: row.file_url,
        documentType: row.document_type ? row.document_type.replace(/_([a-z])/g, (g) => g[1].toUpperCase()) : 'other',
        createdAt: row.created_at
      }));
    } catch (err) {
      console.log('Note: attachments table does not exist');
    }

    // Get investment count
    let investorCount = 0;
    try {
      const countResult = await pool.query(
        `SELECT COUNT(DISTINCT investor_id) as count FROM investments WHERE idea_id = $1 AND status = 'completed'`,
        [ideaId]
      );
      investorCount = parseInt(countResult.rows[0].count);
    } catch (err) {
      console.log('Note: could not fetch investor count');
    }

    res.json({
      id: idea.id,
      userId: idea.user_id,
      title: idea.title,
      description: idea.description,
      category: idea.category,
      fundingGoal: parseFloat(idea.funding_goal),
      currentFunding: parseFloat(idea.current_funding),
      status: idea.status,
      postType: idea.post_type,
      equityPercentage: idea.equity_percentage ? parseFloat(idea.equity_percentage) : null,
      createdAt: idea.created_at,
      updatedAt: idea.updated_at,
      owner: {
        firstName: idea.first_name,
        lastName: idea.last_name,
        email: idea.email,
        role: idea.role,
        profileImage: idea.profile_image
      },
      details: details ? {
        marketSize: details.market_size,
        targetAudience: details.target_audience,
        revenueProjection: details.revenue_projection ? parseFloat(details.revenue_projection) : null,
        breakEvenMonths: details.break_even_months,
        teamSize: details.team_size,
        website: details.website,
        customerAcquisitionCost: details.customer_acquisition_cost ? parseFloat(details.customer_acquisition_cost) : null,
        useOfFunds: details.use_of_funds,
        yearsActive: details.years_active,
        annualRevenue: details.annual_revenue ? parseFloat(details.annual_revenue) : null,
        employeeCount: details.employee_count,
        growthRate: details.growth_rate ? parseFloat(details.growth_rate) : null,
        companyValuation: details.company_valuation ? parseFloat(details.company_valuation) : null,
        sharesOffered: details.shares_offered
      } : null,
      attachments,
      investorCount
    });
  } catch (error) {
    console.error('Error fetching idea details:', error);
    res.status(500).json({ error: 'Server error fetching idea details' });
  }
});

// Create new idea
app.post('/api/ideas', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const { 
      title, description, category, postType,
      // Idea fields
      fundingGoal, equity, marketSize, targetAudience, revenueProjection, breakEven, teamSize, website, customerAcquisitionCost, useOfFunds,
      // Business fields
      askingPrice, yearsActive, annualRevenue, employeeCount, growthRate,
      // Shares fields
      sharePrice, companyValuation, sharesOffered
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    // Map different field names to funding_goal based on post type
    let fundingAmount = 0;
    let equityPercentage = null;

    if (postType === 'business') {
      fundingAmount = askingPrice ? parseFloat(askingPrice) : 0;
    } else if (postType === 'share' || postType === 'shares') {
      fundingAmount = sharePrice ? parseFloat(sharePrice) : 0;
      equityPercentage = equity ? parseFloat(equity) : null;
    } else {
      // Default to 'idea' type
      fundingAmount = fundingGoal ? parseFloat(fundingGoal) : 0;
      equityPercentage = equity ? parseFloat(equity) : null;
    }

    // Create idea
    const result = await pool.query(
      `INSERT INTO ideas (user_id, title, description, category, funding_goal, post_type, equity_percentage)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, description, category, funding_goal, current_funding, status, post_type, equity_percentage, created_at`,
      [req.user.id, title, description, category, fundingAmount, postType || 'idea', equityPercentage]
    );

    const idea = result.rows[0];
    const ideaId = idea.id;

    // Store idea details if provided (optional, table may not exist)
    if (marketSize || targetAudience || revenueProjection || breakEven || teamSize || website || customerAcquisitionCost || useOfFunds || 
        yearsActive || annualRevenue || employeeCount || growthRate || 
        companyValuation || sharesOffered) {
      try {
        await pool.query(
          `INSERT INTO idea_details (
            idea_id, market_size, target_audience, revenue_projection, break_even_months, 
            team_size, website, customer_acquisition_cost, use_of_funds,
            years_active, annual_revenue, employee_count, growth_rate,
            company_valuation, shares_offered
          )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (idea_id) DO UPDATE SET
             market_size = EXCLUDED.market_size,
             target_audience = EXCLUDED.target_audience,
             revenue_projection = EXCLUDED.revenue_projection,
             break_even_months = EXCLUDED.break_even_months,
             team_size = EXCLUDED.team_size,
             website = EXCLUDED.website,
             customer_acquisition_cost = EXCLUDED.customer_acquisition_cost,
             use_of_funds = EXCLUDED.use_of_funds,
             years_active = EXCLUDED.years_active,
             annual_revenue = EXCLUDED.annual_revenue,
             employee_count = EXCLUDED.employee_count,
             growth_rate = EXCLUDED.growth_rate,
             company_valuation = EXCLUDED.company_valuation,
             shares_offered = EXCLUDED.shares_offered`,
          [
            ideaId, 
            marketSize || null, 
            targetAudience || null, 
            revenueProjection ? parseFloat(revenueProjection) : null, 
            breakEven ? parseInt(breakEven) : null, 
            teamSize ? parseInt(teamSize) : null, 
            website || null, 
            customerAcquisitionCost ? parseFloat(customerAcquisitionCost) : null, 
            useOfFunds || null,
            yearsActive ? parseInt(yearsActive) : null,
            annualRevenue ? parseFloat(annualRevenue) : null,
            employeeCount ? parseInt(employeeCount) : null,
            growthRate ? parseFloat(growthRate) : null,
            companyValuation ? parseFloat(companyValuation) : null,
            sharesOffered ? parseInt(sharesOffered) : null
          ]
        );
      } catch (detailsError) {
        console.log('Note: idea_details table may not exist or missing columns, skipping additional details:', detailsError.message);
      }
    }

    // Store uploaded files (optional, table may not exist)
    const files = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const documentType = req.body[`documentType_${file.originalname}`] || 'other';
          // Convert camelCase to snake_case for database storage
          const documentTypeSnake = documentType.replace(/([A-Z])/g, '_$1').toLowerCase();
          await pool.query(
            `INSERT INTO attachments (idea_id, file_name, file_type, file_size, file_url, document_type)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [ideaId, file.originalname, file.mimetype, file.size, `/uploads/${file.filename}`, documentTypeSnake]
          );
          files.push({
            name: file.originalname,
            url: `/uploads/${file.filename}`,
            type: documentType,
            size: file.size
          });
        }
      } catch (attachmentError) {
        console.log('Note: attachments table may not exist, skipping file uploads:', attachmentError.message);
      }
    }

    res.status(201).json({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      category: idea.category,
      fundingGoal: parseFloat(idea.funding_goal),
      currentFunding: parseFloat(idea.current_funding),
      status: idea.status,
      postType: idea.post_type,
      equityPercentage: idea.equity_percentage ? parseFloat(idea.equity_percentage) : null,
      createdAt: idea.created_at,
      files: files
    });
  } catch (error) {
    console.error('Error creating idea:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error creating idea', details: error.message });
  }
});

// Update idea
app.put('/api/ideas/:ideaId', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const { ideaId } = req.params;
    const { 
      title, description, category, postType,
      // Idea fields
      fundingGoal, equity, marketSize, targetAudience, revenueProjection, breakEven, teamSize, website,
      // Business fields
      askingPrice, yearsActive, annualRevenue, employeeCount, growthRate,
      // Shares fields
      sharePrice, companyValuation, sharesOffered,
      // Attachments to keep
      keepAttachments
    } = req.body;

    // Verify idea belongs to user
    const checkResult = await pool.query(
      'SELECT user_id, post_type FROM ideas WHERE id = $1',
      [ideaId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to edit this idea' });
    }

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    // Map different field names to funding_goal based on post type
    let fundingAmount = 0;
    let equityPercentage = null;
    const currentPostType = checkResult.rows[0].post_type;

    if (currentPostType === 'business') {
      fundingAmount = askingPrice ? parseFloat(askingPrice) : 0;
    } else if (currentPostType === 'shares' || currentPostType === 'share') {
      fundingAmount = sharePrice ? parseFloat(sharePrice) : 0;
      equityPercentage = equity ? parseFloat(equity) : null;
    } else {
      fundingAmount = fundingGoal ? parseFloat(fundingGoal) : 0;
      equityPercentage = equity ? parseFloat(equity) : null;
    }

    // Update idea
    await pool.query(
      `UPDATE ideas 
       SET title = $1, description = $2, category = $3, funding_goal = $4, equity_percentage = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [title, description, category, fundingAmount, equityPercentage, ideaId]
    );

    // Update idea details if provided
    if (marketSize || targetAudience || revenueProjection || breakEven || teamSize || website) {
      try {
        await pool.query(
          `INSERT INTO idea_details (idea_id, market_size, target_audience, revenue_projection, break_even_months, team_size, website)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (idea_id) 
           DO UPDATE SET 
             market_size = EXCLUDED.market_size,
             target_audience = EXCLUDED.target_audience,
             revenue_projection = EXCLUDED.revenue_projection,
             break_even_months = EXCLUDED.break_even_months,
             team_size = EXCLUDED.team_size,
             website = EXCLUDED.website`,
          [ideaId, marketSize || null, targetAudience || null, revenueProjection ? parseFloat(revenueProjection) : null, 
           breakEven ? parseInt(breakEven) : null, teamSize ? parseInt(teamSize) : null, website || null]
        );
      } catch (detailsError) {
        console.log('Note: Could not update idea_details:', detailsError.message);
      }
    }

    // Handle attachments - delete ones not in keepAttachments list
    try {
      const keepIds = keepAttachments ? JSON.parse(keepAttachments) : [];
      if (keepIds.length > 0) {
        await pool.query(
          `DELETE FROM attachments WHERE idea_id = $1 AND id != ALL($2)`,
          [ideaId, keepIds]
        );
      } else {
        await pool.query(
          `DELETE FROM attachments WHERE idea_id = $1`,
          [ideaId]
        );
      }
    } catch (attachmentError) {
      console.log('Note: Could not delete old attachments:', attachmentError.message);
    }

    // Add new uploaded files
    const files = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const documentType = req.body[`documentType_${file.originalname}`] || 'other';
          const documentTypeSnake = documentType.replace(/([A-Z])/g, '_$1').toLowerCase();
          await pool.query(
            `INSERT INTO attachments (idea_id, file_name, file_type, file_size, file_url, document_type)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [ideaId, file.originalname, file.mimetype, file.size, `/uploads/${file.filename}`, documentTypeSnake]
          );
          files.push({
            name: file.originalname,
            url: `/uploads/${file.filename}`,
            type: documentType,
            size: file.size
          });
        }
      } catch (attachmentError) {
        console.log('Note: Could not add new attachments:', attachmentError.message);
      }
    }

    res.json({
      message: 'Idea updated successfully',
      id: ideaId,
      newFiles: files
    });
  } catch (error) {
    console.error('Error updating idea:', error);
    res.status(500).json({ error: 'Server error updating idea', details: error.message });
  }
});

// Delete idea
app.delete('/api/ideas/:ideaId', authenticateToken, async (req, res) => {
  try {
    const { ideaId } = req.params;

    // Verify idea belongs to user
    const checkResult = await pool.query(
      'SELECT user_id FROM ideas WHERE id = $1',
      [ideaId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this idea' });
    }

    await pool.query('DELETE FROM ideas WHERE id = $1', [ideaId]);
    res.json({ message: 'Idea deleted successfully' });
  } catch (error) {
    console.error('Error deleting idea:', error);
    res.status(500).json({ error: 'Server error deleting idea' });
  }
});

// ============ INVESTMENTS ENDPOINTS ============

// Get user's investments
app.get('/api/investments/my-investments', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        inv.id, inv.amount, inv.status, inv.created_at,
        i.id as idea_id, i.title, i.funding_goal, i.current_funding,
        u.first_name, u.last_name
      FROM investments inv
      JOIN ideas i ON inv.idea_id = i.id
      JOIN users u ON i.user_id = u.id
      WHERE inv.investor_id = $1
      ORDER BY inv.created_at DESC
    `, [req.user.id]);

    const investments = result.rows.map(row => ({
      id: row.id,
      ideaId: row.idea_id,
      ideaTitle: row.title,
      entrepreneurName: `${row.first_name} ${row.last_name}`,
      amount: parseFloat(row.amount),
      status: row.status,
      createdAt: row.created_at
    }));

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const activeInvestments = investments.filter(inv => inv.status === 'pending').length;

    res.json({
      investments,
      summary: {
        totalInvested,
        activeInvestments,
        portfolioValue: totalInvested
      }
    });
  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({ error: 'Server error fetching investments' });
  }
});

// Create investment
app.post('/api/investments', authenticateToken, async (req, res) => {
  try {
    const { ideaId, amount } = req.body;

    if (!ideaId || !amount) {
      return res.status(400).json({ error: 'Idea ID and amount are required' });
    }

    // Check if idea exists
    const ideaCheck = await pool.query('SELECT id FROM ideas WHERE id = $1', [ideaId]);
    if (ideaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    // Create investment
    const result = await pool.query(
      `INSERT INTO investments (idea_id, investor_id, amount)
       VALUES ($1, $2, $3)
       RETURNING id, amount, status, created_at`,
      [ideaId, req.user.id, parseFloat(amount)]
    );

    // Update idea's current_funding
    await pool.query(
      `UPDATE ideas SET current_funding = current_funding + $1 WHERE id = $2`,
      [parseFloat(amount), ideaId]
    );

    const investment = result.rows[0];
    res.status(201).json({
      id: investment.id,
      ideaId,
      amount: parseFloat(investment.amount),
      status: investment.status,
      createdAt: investment.created_at
    });
  } catch (error) {
    console.error('Error creating investment:', error);
    res.status(500).json({ error: 'Server error creating investment' });
  }
});

// ============ MESSAGES ENDPOINTS ============

// Get user's messages
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.id, m.subject, m.content, m.is_read, m.created_at,
        u.id as sender_id, u.first_name, u.last_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.receiver_id = $1
      ORDER BY m.created_at DESC
    `, [req.user.id]);

    const messages = result.rows.map(row => ({
      id: row.id,
      senderId: row.sender_id,
      senderName: `${row.first_name} ${row.last_name}`,
      subject: row.subject,
      content: row.content,
      isRead: row.is_read,
      createdAt: row.created_at
    }));

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
});

// Mark message as read
app.put('/api/messages/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    const result = await pool.query(
      `UPDATE messages 
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND receiver_id = $2
       RETURNING id, is_read, read_at`,
      [messageId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message/reply
app.post('/api/messages/reply', authenticateToken, async (req, res) => {
  try {
    const { recipientId, subject, content, ideaId } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, subject, content, related_idea_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, subject, content, created_at`,
      [req.user.id, recipientId, subject || 'No subject', content, ideaId || null]
    );

    const message = result.rows[0];
    res.status(201).json({
      id: message.id,
      subject: message.subject,
      content: message.content,
      createdAt: message.created_at
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error sending message' });
  }
});

// ============ WALLET & BIDDING ENDPOINTS ============

// Helper function to generate a Bitcoin address (mock implementation)
// In production, use a proper Bitcoin library or API
function generateBitcoinAddress(userId) {
  // This is a mock Bitcoin address generator
  // In production, integrate with a Bitcoin wallet API or use bitcoinjs-lib
  const prefix = 'bc1q'; // Bech32 format (SegWit)
  const hash = crypto.createHash('sha256').update(`bilnet-user-${userId}-${Date.now()}`).digest('hex');
  return prefix + hash.substring(0, 38); // Simulated Bitcoin address
}

// Get or generate Bitcoin address for user
app.get('/api/wallet/bitcoin-address', authenticateToken, async (req, res) => {
  try {
    let result = await pool.query(
      'SELECT bitcoin_address, bitcoin_address_generated_at FROM users WHERE id = $1',
      [req.user.id]
    );

    let bitcoinAddress = result.rows[0]?.bitcoin_address;

    // Generate new address if doesn't exist
    if (!bitcoinAddress) {
      bitcoinAddress = generateBitcoinAddress(req.user.id);
      await pool.query(
        'UPDATE users SET bitcoin_address = $1, bitcoin_address_generated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [bitcoinAddress, req.user.id]
      );
    }

    res.json({
      bitcoinAddress,
      generatedAt: result.rows[0]?.bitcoin_address_generated_at || new Date()
    });
  } catch (error) {
    console.error('Error getting Bitcoin address:', error);
    res.status(500).json({ error: 'Server error generating Bitcoin address' });
  }
});

// Get all payment methods available
app.get('/api/wallet/payment-methods', authenticateToken, async (req, res) => {
  try {
    // Get user's Bitcoin address
    const bitcoinResult = await pool.query(
      'SELECT bitcoin_address FROM users WHERE id = $1',
      [req.user.id]
    );

    let bitcoinAddress = bitcoinResult.rows[0]?.bitcoin_address;
    if (!bitcoinAddress) {
      bitcoinAddress = generateBitcoinAddress(req.user.id);
      await pool.query(
        'UPDATE users SET bitcoin_address = $1, bitcoin_address_generated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [bitcoinAddress, req.user.id]
      );
    }

    const paymentMethods = [
      {
        id: 'card',
        name: 'Credit/Debit Card',
        type: 'card',
        description: 'Visa, Mastercard, American Express',
        icon: '💳',
        processingTime: 'Instant',
        fees: '2.9% + $0.30',
        minAmount: 10,
        maxAmount: 50000,
        enabled: true
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        type: 'bank_transfer',
        description: 'Direct bank transfer (ACH/Wire)',
        icon: '🏦',
        processingTime: '1-3 business days',
        fees: 'Free (Wire may have bank fees)',
        minAmount: 100,
        maxAmount: 1000000,
        enabled: true,
        instructions: {
          bankName: 'BillNet Capital Bank',
          accountName: 'BillNet Holdings LLC',
          accountNumber: '****5678',
          routingNumber: '021000021',
          swiftCode: 'BILNETUS33',
          note: 'Please include your user ID in the transfer reference'
        }
      },
      {
        id: 'bitcoin',
        name: 'Bitcoin (BTC)',
        type: 'bitcoin',
        description: 'Send Bitcoin to your unique address',
        icon: '₿',
        processingTime: '10-60 minutes (confirmations required)',
        fees: 'Network fees only',
        minAmount: 50,
        maxAmount: null,
        enabled: true,
        bitcoinAddress: bitcoinAddress,
        instructions: {
          address: bitcoinAddress,
          network: 'Bitcoin Mainnet',
          minConfirmations: 3,
          note: 'Send only BTC to this address. Sending other tokens may result in permanent loss.'
        }
      }
    ];

    res.json({ paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Server error fetching payment methods' });
  }
});

// Initiate a payment/deposit
app.post('/api/wallet/initiate-payment', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethod, currency = 'USD' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!['card', 'bank_transfer', 'bitcoin'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    const referenceId = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Ensure payment_transactions table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        transaction_type VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(50) DEFAULT 'pending',
        reference_id VARCHAR(255) UNIQUE,
        description TEXT,
        metadata JSONB,
        bitcoin_address VARCHAR(100),
        bitcoin_txid VARCHAR(100),
        bitcoin_confirmations INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // Create transaction record
    const result = await pool.query(
      `INSERT INTO payment_transactions 
       (user_id, transaction_type, payment_method, amount, currency, status, reference_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id,
        'deposit',
        paymentMethod,
        amount,
        currency,
        'pending',
        referenceId,
        `${paymentMethod} deposit`
      ]
    );

    const transaction = result.rows[0];

    // Get payment instructions based on method
    let instructions = {};
    if (paymentMethod === 'bitcoin') {
      const btcResult = await pool.query('SELECT bitcoin_address FROM users WHERE id = $1', [req.user.id]);
      instructions = {
        bitcoinAddress: btcResult.rows[0]?.bitcoin_address,
        network: 'Bitcoin Mainnet',
        minConfirmations: 3,
        note: 'Send only BTC to this address. Include reference in transaction memo if possible.'
      };
    } else if (paymentMethod === 'bank_transfer') {
      instructions = {
        bankName: 'BillNet Capital Bank',
        accountName: 'BillNet Holdings LLC',
        accountNumber: '****5678',
        routingNumber: '021000021',
        swiftCode: 'BILNETUS33',
        referenceId: referenceId,
        note: `Please include reference ${referenceId} in your transfer`
      };
    } else if (paymentMethod === 'card') {
      instructions = {
        note: 'Card payment integration coming soon. For now, use bank transfer or Bitcoin.',
        redirectUrl: '/profile' // Would redirect to Stripe/payment processor
      };
    }

    res.json({
      transaction: {
        id: transaction.id,
        referenceId: transaction.reference_id,
        amount: parseFloat(transaction.amount),
        currency: transaction.currency,
        paymentMethod: transaction.payment_method,
        status: transaction.status,
        createdAt: transaction.created_at
      },
      instructions
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ error: 'Server error initiating payment' });
  }
});

// Get wallet balance
app.get('/api/wallet/balance', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT wallet_balance FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      walletBalance: parseFloat(result.rows[0].wallet_balance) || 0
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const FUNDING_METHODS = [
  {
    method: 'bitcoin',
    displayName: 'Bitcoin',
    settlement: 'manual',
    currencies: ['USD'],
    instructions: {
      address: 'bc1q-demo-address-change',
      note: 'Send only BTC on mainnet. Reference must match the generated code.'
    }
  },
  {
    method: 'bank_transfer',
    displayName: 'Bank Transfer',
    settlement: 'manual',
    currencies: ['USD'],
    instructions: {
      bankName: 'Demo Bank',
      accountName: 'BillNet Capital',
      accountNumber: '000123456789',
      routingNumber: '110000000',
      note: 'Include the reference code in your transfer memo.'
    }
  },
  {
    method: 'card_mastercard',
    displayName: 'Mastercard',
    settlement: 'instant',
    currencies: ['USD'],
    instructions: { note: 'Mock card processing. Use test card numbers.' }
  },
  {
    method: 'card_visa',
    displayName: 'Visa',
    settlement: 'instant',
    currencies: ['USD'],
    instructions: { note: 'Mock card processing. Use test card numbers.' }
  },
  {
    method: 'mobile_money',
    displayName: 'Mobile Network',
    settlement: 'manual',
    currencies: ['USD'],
    instructions: {
      providers: ['M-Pesa', 'MTN MoMo', 'AirtelTigo'],
      note: 'Send from a supported mobile money wallet and include the reference code.'
    }
  }
];

const MOBILE_MONEY_COUNTRIES = ['Ghana', 'Kenya', 'Nigeria', 'South Africa'];

app.get('/api/wallet/funding-methods', authenticateToken, async (_req, res) => {
  res.json({ methods: FUNDING_METHODS, mobileMoneyEligibleCountries: MOBILE_MONEY_COUNTRIES });
});

app.post('/api/wallet/fundings', authenticateToken, async (req, res) => {
  try {
    const { amount, method, currency = 'USD', country, provider } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const selectedMethod = FUNDING_METHODS.find(m => m.method === method);
    if (!selectedMethod) {
      return res.status(400).json({ error: 'Unsupported funding method' });
    }

    if (method === 'mobile_money' && country && !MOBILE_MONEY_COUNTRIES.includes(country)) {
      return res.status(400).json({ error: 'Mobile money not supported in this country' });
    }

    const reference = `${method.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const parsedAmount = parseFloat(amount);
    const status = selectedMethod.settlement === 'instant' ? 'completed' : 'pending';

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const tx = await createTransactionRecord({
        userId: req.user.id,
        type: 'deposit',
        method,
        provider: provider || selectedMethod.displayName,
        currency,
        amount: parsedAmount,
        status,
        reference,
        description: `Funding via ${selectedMethod.displayName}`,
        metadata: { country: country || null }
      }, client);

      let walletBalance = null;
      if (status === 'completed') {
        const result = await client.query(
          `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance`,
          [parsedAmount, req.user.id]
        );
        walletBalance = parseFloat(result.rows[0].wallet_balance);
        await client.query(
          `UPDATE transactions SET processed_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [tx.id]
        );
      }

      await client.query('COMMIT');

      res.json({
        fundingId: tx.id,
        status,
        reference,
        walletBalance,
        instructions: selectedMethod.instructions,
        method: selectedMethod.method,
        settlement: selectedMethod.settlement,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Funding creation error:', error);
    res.status(500).json({ error: 'Server error starting funding' });
  }
});

// Admin/manual confirmation for pending fundings (e.g., BTC, bank transfer, mobile money)
app.post('/api/wallet/fundings/:fundingId/confirm', async (req, res) => {
  try {
    if (!requireAdminSecret(req, res)) return;

    const { fundingId } = req.params;
    const { referenceNote } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const txResult = await client.query(
        `SELECT * FROM transactions WHERE id = $1 AND type = 'deposit' FOR UPDATE`,
        [fundingId]
      );

      if (txResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Funding not found' });
      }

      const tx = txResult.rows[0];
      if (tx.status === 'completed') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Funding already completed' });
      }

      await client.query(
        `UPDATE transactions SET status = 'completed', processed_at = CURRENT_TIMESTAMP, description = COALESCE(description, '') || $1 WHERE id = $2`,
        [referenceNote ? ` | Admin note: ${referenceNote}` : '', fundingId]
      );

      const result = await client.query(
        `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance`,
        [parseFloat(tx.amount), tx.user_id]
      );

      await client.query('COMMIT');

      res.json({
        message: 'Funding confirmed and wallet updated',
        walletBalance: parseFloat(result.rows[0].wallet_balance)
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Funding confirmation error:', error);
    res.status(500).json({ error: 'Server error confirming funding' });
  }
});

// Add funds to wallet
app.post('/api/wallet/add-funds', authenticateToken, async (req, res) => {
  try {
    const { amount, method, provider, currency } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const parsedAmount = parseFloat(amount);
    const result = await pool.query(
      `UPDATE users 
       SET wallet_balance = wallet_balance + $1
       WHERE id = $2
       RETURNING wallet_balance`,
      [parsedAmount, req.user.id]
    );

    await createTransactionRecord({
      userId: req.user.id,
      type: 'deposit',
      method: method || 'manual_adjustment',
      provider: provider || 'wallet_add_funds',
      currency: currency || 'USD',
      amount: parsedAmount,
      status: 'completed',
      reference: 'WALLET-ADD-' + Date.now(),
      description: 'Direct wallet top-up'
    });

    res.json({
      walletBalance: parseFloat(result.rows[0].wallet_balance)
    });
  } catch (error) {
    console.error('Error adding funds:', error);
    res.status(500).json({ error: 'Server error adding funds' });
  }
});

// Place a bid on an idea
app.post('/api/bids', authenticateToken, async (req, res) => {
  try {
    const { ideaId, bidAmount, equityPercentage } = req.body;

    if (!ideaId || !bidAmount || !equityPercentage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check wallet balance
    const userResult = await pool.query(
      'SELECT wallet_balance FROM users WHERE id = $1',
      [req.user.id]
    );

    const walletBalance = parseFloat(userResult.rows[0].wallet_balance) || 0;

    if (walletBalance < 10000) {
      return res.status(403).json({ 
        error: 'Insufficient balance. Minimum required: $10,000 USD',
        currentBalance: walletBalance 
      });
    }

    if (walletBalance < bidAmount) {
      return res.status(403).json({ 
        error: 'Insufficient funds for this bid',
        currentBalance: walletBalance,
        requiredAmount: bidAmount
      });
    }

    // Check if idea exists
    const ideaCheck = await pool.query('SELECT id FROM ideas WHERE id = $1', [ideaId]);
    if (ideaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    // Create or update bid
    const result = await pool.query(
      `INSERT INTO bids (idea_id, investor_id, bid_amount, equity_percentage)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (idea_id, investor_id) 
       DO UPDATE SET bid_amount = $3, equity_percentage = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING id, bid_amount, equity_percentage, status, created_at`,
      [ideaId, req.user.id, parseFloat(bidAmount), parseFloat(equityPercentage)]
    );

    // Deduct bid amount from wallet
    await pool.query(
      'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
      [parseFloat(bidAmount), req.user.id]
    );

    const bid = result.rows[0];
    res.status(201).json({
      id: bid.id,
      bidAmount: parseFloat(bid.bid_amount),
      equityPercentage: parseFloat(bid.equity_percentage),
      status: bid.status,
      createdAt: bid.created_at,
      message: 'Bid placed successfully. Funds have been reserved from your wallet.'
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({ error: 'Server error placing bid' });
  }
});

// Get bids for an idea
app.get('/api/ideas/:ideaId/bids', authenticateToken, async (req, res) => {
  try {
    const { ideaId } = req.params;

    // Check if user owns this idea
    const ideaCheck = await pool.query(
      'SELECT user_id FROM ideas WHERE id = $1',
      [ideaId]
    );

    if (ideaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    if (ideaCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT b.id, b.bid_amount, b.equity_percentage, b.status, b.created_at,
              u.first_name, u.last_name, u.email
       FROM bids b
       JOIN users u ON b.investor_id = u.id
       WHERE b.idea_id = $1
       ORDER BY b.created_at DESC`,
      [ideaId]
    );

    const bids = result.rows.map(row => ({
      id: row.id,
      bidAmount: parseFloat(row.bid_amount),
      equityPercentage: parseFloat(row.equity_percentage),
      status: row.status,
      createdAt: row.created_at,
      investor: {
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email
      }
    }));

    res.json({ bids });
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept a bid
app.put('/api/bids/:bidId/accept', authenticateToken, async (req, res) => {
  try {
    const { bidId } = req.params;

    // Get bid and verify ownership
    const bidResult = await pool.query(
      `SELECT b.*, i.user_id as idea_owner_id
       FROM bids b
       JOIN ideas i ON b.idea_id = i.id
       WHERE b.id = $1`,
      [bidId]
    );

    if (bidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bid = bidResult.rows[0];

    if (bid.idea_owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update bid status to accepted
    await pool.query(
      `UPDATE bids SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [bidId]
    );

    // Create investment record
    await pool.query(
      `INSERT INTO investments (idea_id, investor_id, amount, status, created_at)
       VALUES ($1, $2, $3, 'completed', CURRENT_TIMESTAMP)
       ON CONFLICT (idea_id, investor_id) DO NOTHING`,
      [bid.idea_id, bid.investor_id, bid.bid_amount]
    );

    // Update idea funding
    await pool.query(
      `UPDATE ideas SET current_funding = current_funding + $1 WHERE id = $2`,
      [bid.bid_amount, bid.idea_id]
    );

    res.json({ 
      message: 'Bid accepted successfully. Investment created.',
      bid: bid
    });
  } catch (error) {
    console.error('Error accepting bid:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject a bid
app.put('/api/bids/:bidId/reject', authenticateToken, async (req, res) => {
  try {
    const { bidId } = req.params;

    // Get bid and verify ownership
    const bidResult = await pool.query(
      `SELECT b.*, i.user_id as idea_owner_id
       FROM bids b
       JOIN ideas i ON b.idea_id = i.id
       WHERE b.id = $1`,
      [bidId]
    );

    if (bidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bid = bidResult.rows[0];

    if (bid.idea_owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update bid status to rejected
    await pool.query(
      `UPDATE bids SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [bidId]
    );

    // Refund the bid amount to investor's wallet
    await pool.query(
      'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
      [bid.bid_amount, bid.investor_id]
    );

    res.json({ 
      message: 'Bid rejected. Funds have been returned to investor.',
      bid: bid
    });
  } catch (error) {
    console.error('Error rejecting bid:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Counter a bid
app.put('/api/bids/:bidId/counter', authenticateToken, async (req, res) => {
  try {
    const { bidId } = req.params;
    const { counterAmount, counterEquity } = req.body;

    if (!counterAmount || !counterEquity) {
      return res.status(400).json({ error: 'Counter amount and equity are required' });
    }

    // Get bid and verify ownership
    const bidResult = await pool.query(
      `SELECT b.*, i.user_id as idea_owner_id
       FROM bids b
       JOIN ideas i ON b.idea_id = i.id
       WHERE b.id = $1`,
      [bidId]
    );

    if (bidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bid = bidResult.rows[0];

    if (bid.idea_owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update bid with counter offer
    await pool.query(
      `UPDATE bids 
       SET counter_amount = $1, counter_equity = $2, status = 'countered', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [parseFloat(counterAmount), parseFloat(counterEquity), bidId]
    );

    res.json({ 
      message: 'Counter offer sent successfully',
      counterAmount: parseFloat(counterAmount),
      counterEquity: parseFloat(counterEquity)
    });
  } catch (error) {
    console.error('Error sending counter offer:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's bids
app.get('/api/bids/my-bids', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.idea_id, b.bid_amount, b.equity_percentage, b.status, b.created_at,
              i.title, i.category, i.funding_goal, i.current_funding,
              u.first_name, u.last_name
       FROM bids b
       JOIN ideas i ON b.idea_id = i.id
       JOIN users u ON i.user_id = u.id
       WHERE b.investor_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    const bids = result.rows.map(row => ({
      id: row.id,
      ideaId: row.idea_id,
      ideaTitle: row.title,
      ideaCategory: row.category,
      entrepreneurName: `${row.first_name} ${row.last_name}`,
      bidAmount: parseFloat(row.bid_amount),
      equityPercentage: parseFloat(row.equity_percentage),
      status: row.status,
      createdAt: row.created_at,
      idea: {
        title: row.title,
        category: row.category,
        fundingGoal: parseFloat(row.funding_goal),
        currentFunding: parseFloat(row.current_funding),
        entrepreneur: `${row.first_name} ${row.last_name}`
      }
    }));

    res.json({ bids });
  } catch (error) {
    console.error('Error fetching user bids:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================================
// SOCIAL FEATURES ENDPOINTS
// ========================================

// Toggle favorite (add/remove)
app.post('/api/favorites/:ideaId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ideaId } = req.params;

    // Check if already favorited
    const existing = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND idea_id = $2',
      [userId, ideaId]
    );

    if (existing.rows.length > 0) {
      // Remove favorite
      await pool.query(
        'DELETE FROM favorites WHERE user_id = $1 AND idea_id = $2',
        [userId, ideaId]
      );
      res.json({ favorited: false, message: 'Removed from favorites' });
    } else {
      // Add favorite
      await pool.query(
        'INSERT INTO favorites (user_id, idea_id) VALUES ($1, $2)',
        [userId, ideaId]
      );
      res.json({ favorited: true, message: 'Added to favorites' });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's favorites
app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT f.idea_id FROM favorites f WHERE f.user_id = $1`,
      [userId]
    );

    const favoriteIds = result.rows.map(row => row.idea_id);
    res.json({ favoriteIds });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle follow (follow/unfollow user)
app.post('/api/follows/:userId', authenticateToken, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.userId, 10);

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const existing = await pool.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );

    if (existing.rows.length > 0) {
      // Unfollow
      await pool.query(
        'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [followerId, followingId]
      );
      res.json({ following: false, message: 'Unfollowed user' });
    } else {
      // Follow
      await pool.query(
        'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
        [followerId, followingId]
      );
      res.json({ following: true, message: 'Now following user' });
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's follows
app.get('/api/follows', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT f.following_id FROM follows f WHERE f.follower_id = $1`,
      [userId]
    );

    const followingIds = result.rows.map(row => row.following_id);
    res.json({ followingIds });
  } catch (error) {
    console.error('Error fetching follows:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment to idea
app.post('/api/comments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ideaId, content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const result = await pool.query(
      `INSERT INTO comments (idea_id, user_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING id, idea_id, user_id, content, created_at`,
      [ideaId, userId, content.trim()]
    );

    // Get user info
    const userResult = await pool.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [userId]
    );

    const comment = {
      ...result.rows[0],
      userName: `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`
    };

    res.json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get comments for idea
app.get('/api/comments/:ideaId', async (req, res) => {
  try {
    const { ideaId } = req.params;

    const result = await pool.query(
      `SELECT c.id, c.idea_id, c.user_id, c.content, c.created_at,
              u.first_name, u.last_name, u.role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.idea_id = $1
       ORDER BY c.created_at DESC`,
      [ideaId]
    );

    const comments = result.rows.map(row => ({
      id: row.id,
      ideaId: row.idea_id,
      userId: row.user_id,
      content: row.content,
      createdAt: row.created_at,
      userName: `${row.first_name} ${row.last_name}`,
      userRole: row.role
    }));

    res.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add/Update review for idea
app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ideaId, rating, reviewText } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user already reviewed
    const existing = await pool.query(
      'SELECT id FROM reviews WHERE idea_id = $1 AND user_id = $2',
      [ideaId, userId]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing review
      result = await pool.query(
        `UPDATE reviews 
         SET rating = $1, review_text = $2, updated_at = CURRENT_TIMESTAMP
         WHERE idea_id = $3 AND user_id = $4
         RETURNING *`,
        [rating, reviewText, ideaId, userId]
      );
    } else {
      // Insert new review
      result = await pool.query(
        `INSERT INTO reviews (idea_id, user_id, rating, review_text)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [ideaId, userId, rating, reviewText]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get reviews for idea
app.get('/api/reviews/:ideaId', async (req, res) => {
  try {
    const { ideaId } = req.params;

    const result = await pool.query(
      `SELECT r.id, r.idea_id, r.user_id, r.rating, r.review_text, r.created_at,
              u.first_name, u.last_name, u.role
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.idea_id = $1
       ORDER BY r.created_at DESC`,
      [ideaId]
    );

    const reviews = result.rows.map(row => ({
      id: row.id,
      ideaId: row.idea_id,
      userId: row.user_id,
      rating: row.rating,
      reviewText: row.review_text,
      createdAt: row.created_at,
      userName: `${row.first_name} ${row.last_name}`,
      userRole: row.role
    }));

    // Calculate average rating
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({ reviews, averageRating: avgRating, totalReviews: reviews.length });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Delete file attachment
app.delete('/api/ideas/:ideaId/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { ideaId, fileId } = req.params;

    // Verify idea belongs to user
    const checkResult = await pool.query(
      'SELECT user_id FROM ideas WHERE id = $1',
      [ideaId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    if (checkResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this file' });
    }

    // Get file info
    const fileResult = await pool.query(
      'SELECT file_url FROM attachments WHERE id = $1 AND idea_id = $2',
      [fileId, ideaId]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from database
    await pool.query(
      'DELETE FROM attachments WHERE id = $1',
      [fileId]
    );

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Server error deleting file' });
  }
});

// ============ USER PROFILES ============

// Get user profile
app.get('/api/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, role, bio, profile_image, wallet_balance, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's posted ideas
app.get('/api/users/:userId/ideas', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT id, title, description, category, funding_goal, current_funding, status, post_type, created_at
       FROM ideas WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user ideas:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's investments
app.get('/api/users/:userId/investments', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT i.id, i.idea_id, i.amount, i.status, i.created_at, 
              ideas.title, ideas.category
       FROM investments i
       JOIN ideas ON i.idea_id = ideas.id
       WHERE i.investor_id = $1
       ORDER BY i.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user investments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ SEARCH & FILTERS ============

// Updated GET /api/ideas with search and filters
// Already modified above to include limit/offset, now adding search/filter support
app.get('/api/ideas/search', authenticateToken, async (req, res) => {
  try {
    const { q, category, minFunding, maxFunding, postType, sortBy } = req.query;
    const limitParam = parseInt(req.query.limit, 10);
    const offsetParam = parseInt(req.query.offset, 10);
    const limit = Number.isNaN(limitParam) ? 10 : Math.min(limitParam, 50);
    const offset = Number.isNaN(offsetParam) ? 0 : Math.max(offsetParam, 0);

    let query = `SELECT i.id, i.title, i.description, i.category, 
                        i.funding_goal, i.current_funding, i.status, i.created_at,
                        i.user_id, i.post_type, i.equity_percentage,
                        u.first_name, u.last_name, u.profile_image,
                        COUNT(DISTINCT c.id) as comment_count,
                        COUNT(DISTINCT f.id) as favorite_count,
                        COUNT(DISTINCT b.id) as bid_count
                 FROM ideas i
                 JOIN users u ON i.user_id = u.id
                 LEFT JOIN comments c ON i.id = c.idea_id
                 LEFT JOIN favorites f ON i.id = f.idea_id
                 LEFT JOIN bids b ON i.id = b.idea_id
                 WHERE (i.status = 'active' OR i.status = 'funded')`;

    const params = [];
    let paramCount = 1;

    if (q) {
      query += ` AND (i.title ILIKE $${paramCount} OR i.description ILIKE $${paramCount})`;
      params.push(`%${q}%`);
      paramCount++;
    }

    if (category) {
      query += ` AND i.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (postType) {
      query += ` AND i.post_type = $${paramCount}`;
      params.push(postType);
      paramCount++;
    }

    if (minFunding) {
      query += ` AND i.funding_goal >= $${paramCount}`;
      params.push(parseFloat(minFunding));
      paramCount++;
    }

    if (maxFunding) {
      query += ` AND i.funding_goal <= $${paramCount}`;
      params.push(parseFloat(maxFunding));
      paramCount++;
    }

    query += ` GROUP BY i.id, u.first_name, u.last_name, u.profile_image`;

    if (sortBy === 'trending') {
      query += ` ORDER BY (COUNT(DISTINCT c.id) + COUNT(DISTINCT f.id) + COUNT(DISTINCT b.id)) DESC`;
    } else if (sortBy === 'funding') {
      query += ` ORDER BY i.current_funding DESC`;
    } else {
      query += ` ORDER BY i.created_at DESC`;
    }

    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const ideaIds = result.rows.map(r => r.id);
    const attachmentsMap = {};

    if (ideaIds.length > 0) {
      const attachmentsResult = await pool.query(
        `SELECT idea_id, file_name, file_url, document_type, file_size
         FROM attachments WHERE idea_id = ANY($1)`,
        [ideaIds]
      );

      attachmentsResult.rows.forEach(row => {
        if (!attachmentsMap[row.idea_id]) {
          attachmentsMap[row.idea_id] = [];
        }
        attachmentsMap[row.idea_id].push({
          name: row.file_name,
          url: row.file_url,
          type: row.document_type,
          size: row.file_size
        });
      });
    }

    const ideas = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      fundingGoal: parseFloat(row.funding_goal),
      currentFunding: parseFloat(row.current_funding),
      status: row.status,
      createdAt: row.created_at,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      profileImage: row.profile_image,
      postType: row.post_type || 'idea',
      equityPercentage: row.equity_percentage ? parseFloat(row.equity_percentage) : null,
      files: attachmentsMap[row.id] || [],
      commentCount: parseInt(row.comment_count, 10),
      favoriteCount: parseInt(row.favorite_count, 10),
      bidCount: parseInt(row.bid_count, 10)
    }));

    res.json(ideas);
  } catch (error) {
    console.error('Error searching ideas:', error);
    res.status(500).json({ error: 'Server error searching ideas' });
  }
});

// ============ BID MANAGEMENT ============

// Accept bid
app.put('/api/bids/:bidId/accept', authenticateToken, async (req, res) => {
  try {
    const { bidId } = req.params;

    // Get bid info
    const bidResult = await pool.query(
      'SELECT b.*, i.user_id FROM bids b JOIN ideas i ON b.idea_id = i.id WHERE b.id = $1',
      [bidId]
    );

    if (bidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bid = bidResult.rows[0];

    // Verify ownership
    if (bid.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update bid status
    await pool.query(
      'UPDATE bids SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['accepted', bidId]
    );

    res.json({ message: 'Bid accepted', bid });
  } catch (error) {
    console.error('Error accepting bid:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject bid
app.put('/api/bids/:bidId/reject', authenticateToken, async (req, res) => {
  try {
    const { bidId } = req.params;

    const bidResult = await pool.query(
      'SELECT b.*, i.user_id FROM bids b JOIN ideas i ON b.idea_id = i.id WHERE b.id = $1',
      [bidId]
    );

    if (bidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bid = bidResult.rows[0];

    if (bid.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await pool.query(
      'UPDATE bids SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['rejected', bidId]
    );

    res.json({ message: 'Bid rejected' });
  } catch (error) {
    console.error('Error rejecting bid:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get bids for an idea (entrepreneur view)
app.get('/api/ideas/:ideaId/bids/list', authenticateToken, async (req, res) => {
  try {
    const { ideaId } = req.params;

    // Verify ownership
    const ideaResult = await pool.query(
      'SELECT user_id FROM ideas WHERE id = $1',
      [ideaId]
    );

    if (ideaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    if (ideaResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT b.*, u.first_name, u.last_name, u.email
       FROM bids b
       JOIN users u ON b.investor_id = u.id
       WHERE b.idea_id = $1
       ORDER BY b.created_at DESC`,
      [ideaId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ FILE UPLOAD ENDPOINTS ============

// Upload profile image
app.post('/api/upload/profile', authenticateToken, upload.single('profile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
    
    // Update user's profile image in database
    await pool.query(
      'UPDATE users SET profile_image = $1 WHERE id = $2',
      [fileUrl, req.user.id]
    );

    res.json({
      message: 'Profile image uploaded successfully',
      fileUrl: fileUrl,
      fileName: req.file.filename
    });
  } catch (error) {
    console.error('Profile upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
});

// Upload idea attachment
app.post('/api/upload/idea/:ideaId', authenticateToken, upload.array('attachments', 5), async (req, res) => {
  try {
    const { ideaId } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Verify idea ownership
    const ideaResult = await pool.query(
      'SELECT user_id FROM ideas WHERE id = $1',
      [ideaId]
    );

    if (ideaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    if (ideaResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Save attachments to database
    const attachments = [];
    for (const file of req.files) {
      const fileUrl = `http://localhost:${port}/uploads/${file.filename}`;
      const result = await pool.query(
        `INSERT INTO attachments (idea_id, file_name, file_url, document_type, file_size) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [ideaId, file.originalname, fileUrl, file.mimetype, file.size]
      );
      attachments.push(result.rows[0]);
    }

    res.json({
      message: 'Files uploaded successfully',
      attachments: attachments
    });
  } catch (error) {
    console.error('Idea attachment upload error:', error);
    res.status(500).json({ error: 'Failed to upload attachments' });
  }
});

// ============ REAL-TIME MESSAGING ENDPOINTS ============

// Get all conversations for a user
app.get('/api/messages/conversations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `WITH conversation_messages AS (
        SELECT
          CASE
            WHEN m.sender_id = $1 THEN m.receiver_id
            ELSE m.sender_id
          END AS other_user_id,
          m.content,
          m.created_at
        FROM messages m
        WHERE m.sender_id = $1 OR m.receiver_id = $1
      ),
      latest_messages AS (
        SELECT DISTINCT ON (other_user_id)
          other_user_id,
          content AS last_message,
          created_at AS last_message_time
        FROM conversation_messages
        ORDER BY other_user_id, created_at DESC
      )
      SELECT
        lm.other_user_id,
        u.first_name,
        u.last_name,
        u.profile_image,
        lm.last_message,
        lm.last_message_time,
        COALESCE((
          SELECT COUNT(*)
          FROM messages unread
          WHERE unread.receiver_id = $1
            AND unread.sender_id = lm.other_user_id
            AND unread.is_read = false
        ), 0) AS unread_count
      FROM latest_messages lm
      JOIN users u ON u.id = lm.other_user_id
      ORDER BY lm.last_message_time DESC`,
      [req.user.id]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages between two users
app.get('/api/messages/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT m.*, 
        sender.first_name as sender_first_name, 
        sender.last_name as sender_last_name,
        sender.profile_image as sender_profile_image
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2) 
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at ASC`,
      [req.user.id, userId]
    );

    // Mark messages as read
    await pool.query(
      `UPDATE messages SET is_read = true 
       WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false`,
      [req.user.id, userId]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a message
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content || content.trim() === '') {
      return res.status(400).json({ error: 'Receiver and message content required' });
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content) 
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, receiverId, content.trim()]
    );

    res.json({ message: result.rows[0] });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark message as read
app.put('/api/messages/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    await pool.query(
      `UPDATE messages SET is_read = true 
       WHERE id = $1 AND receiver_id = $2`,
      [messageId, req.user.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ NOTIFICATIONS ENDPOINTS ============

// Get user notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get notifications from various sources (bids, follows, comments)
    const bidsResult = await pool.query(
      `SELECT b.id, 'bid' as type, u.first_name, u.last_name, i.title,
              b.created_at, u.id as user_id, i.id as idea_id
       FROM bids b
       JOIN users u ON b.investor_id = u.id
       JOIN ideas i ON b.idea_id = i.id
       WHERE i.user_id = $1
       ORDER BY b.created_at DESC
       LIMIT 5`,
      [userId]
    );

    const followsResult = await pool.query(
      `SELECT f.id, 'follow' as type, u.first_name, u.last_name,
              f.created_at, u.id as user_id
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC
       LIMIT 5`,
      [userId]
    );

    const commentsResult = await pool.query(
      `SELECT c.id, 'comment' as type, u.first_name, u.last_name, i.title,
              c.created_at, u.id as user_id, i.id as idea_id
       FROM comments c
       JOIN users u ON c.user_id = u.id
       JOIN ideas i ON c.idea_id = i.id
       WHERE i.user_id = $1
       ORDER BY c.created_at DESC
       LIMIT 5`,
      [userId]
    );

    const messagesResult = await pool.query(
      `SELECT m.id, 'message' as type, u.first_name, u.last_name,
              m.content, m.created_at, u.id as user_id
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.receiver_id = $1
         AND m.is_read = false
       ORDER BY m.created_at DESC
       LIMIT 5`,
      [userId]
    );

    const notifications = [
      ...bidsResult.rows.map(r => ({
        id: `bid_${r.id}`,
        type: 'bid',
        title: 'New Bid Received',
        message: `${r.first_name} ${r.last_name} placed a bid on "${r.title}"`,
        isRead: false,
        createdAt: r.created_at,
        relatedUserId: r.user_id,
        relatedIdeaId: r.idea_id,
      })),
      ...followsResult.rows.map(r => ({
        id: `follow_${r.id}`,
        type: 'follow',
        title: 'New Follower',
        message: `${r.first_name} ${r.last_name} started following you`,
        isRead: false,
        createdAt: r.created_at,
        relatedUserId: r.user_id,
      })),
      ...commentsResult.rows.map(r => ({
        id: `comment_${r.id}`,
        type: 'comment',
        title: 'New Comment',
        message: `${r.first_name} ${r.last_name} commented on "${r.title}"`,
        isRead: false,
        createdAt: r.created_at,
        relatedUserId: r.user_id,
        relatedIdeaId: r.idea_id,
      })),
      ...messagesResult.rows.map(r => ({
        id: `message_${r.id}`,
        type: 'message',
        title: 'New Message',
        message: `${r.first_name} ${r.last_name}: ${r.content}`,
        isRead: false,
        createdAt: r.created_at,
        relatedUserId: r.user_id,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ ANALYTICS ENDPOINTS ============

// Get user analytics dashboard
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user role
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    const role = userResult.rows[0].role;

    let analytics = {};

    if (role === 'entrepreneur') {
      // Entrepreneur analytics
      const ideasResult = await pool.query(
        `SELECT COUNT(*) as total_ideas, 
                SUM(current_funding) as total_raised,
                AVG(current_funding) as avg_funding
         FROM ideas WHERE user_id = $1`,
        [userId]
      );

      const bidsResult = await pool.query(
        `SELECT COUNT(*) as total_bids, SUM(b.bid_amount) as total_bid_value
         FROM bids b
         JOIN ideas i ON b.idea_id = i.id
         WHERE i.user_id = $1`,
        [userId]
      );

      const viewsResult = await pool.query(
        `SELECT SUM(COALESCE((SELECT COUNT(*) FROM favorites WHERE idea_id = i.id), 0)) as total_favorites,
                SUM(COALESCE((SELECT COUNT(*) FROM comments WHERE idea_id = i.id), 0)) as total_comments
         FROM ideas i WHERE i.user_id = $1`,
        [userId]
      );

      analytics = {
        role: 'entrepreneur',
        totalIdeas: parseInt(ideasResult.rows[0].total_ideas) || 0,
        totalRaised: parseFloat(ideasResult.rows[0].total_raised) || 0,
        avgFunding: parseFloat(ideasResult.rows[0].avg_funding) || 0,
        totalBids: parseInt(bidsResult.rows[0].total_bids) || 0,
        totalBidValue: parseFloat(bidsResult.rows[0].total_bid_value) || 0,
        totalFavorites: parseInt(viewsResult.rows[0].total_favorites) || 0,
        totalComments: parseInt(viewsResult.rows[0].total_comments) || 0
      };

      // Get funding over time (last 30 days)
      const fundingTrendResult = await pool.query(
        `SELECT DATE(b.created_at) as date, SUM(b.bid_amount) as amount
         FROM bids b
         JOIN ideas i ON b.idea_id = i.id
         WHERE i.user_id = $1 AND b.created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(b.created_at)
         ORDER BY date ASC`,
        [userId]
      );

      analytics.fundingTrend = fundingTrendResult.rows;

    } else if (role === 'investor') {
      // Investor analytics
      const investmentsResult = await pool.query(
        `SELECT COUNT(*) as total_investments,
                SUM(bid_amount) as total_invested,
                AVG(bid_amount) as avg_investment,
                SUM(equity_percentage) as total_equity
         FROM bids WHERE investor_id = $1`,
        [userId]
      );

      const portfolioResult = await pool.query(
        `SELECT COUNT(DISTINCT i.category) as diverse_categories,
                COUNT(DISTINCT i.id) as unique_ideas
         FROM bids b
         JOIN ideas i ON b.idea_id = i.id
         WHERE b.investor_id = $1`,
        [userId]
      );

      const walletResult = await pool.query(
        `SELECT wallet_balance FROM users WHERE id = $1`,
        [userId]
      );

      analytics = {
        role: 'investor',
        totalInvestments: parseInt(investmentsResult.rows[0].total_investments) || 0,
        totalInvested: parseFloat(investmentsResult.rows[0].total_invested) || 0,
        avgInvestment: parseFloat(investmentsResult.rows[0].avg_investment) || 0,
        totalEquity: parseFloat(investmentsResult.rows[0].total_equity) || 0,
        portfolioDiversity: parseInt(portfolioResult.rows[0].diverse_categories) || 0,
        uniqueIdeas: parseInt(portfolioResult.rows[0].unique_ideas) || 0,
        walletBalance: parseFloat(walletResult.rows[0].wallet_balance) || 0
      };

      // Get investment over time (last 30 days)
      const investmentTrendResult = await pool.query(
        `SELECT DATE(created_at) as date, SUM(bid_amount) as amount
         FROM bids
         WHERE investor_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [userId]
      );

      analytics.investmentTrend = investmentTrendResult.rows;

      // Get portfolio breakdown by category
      const categoryBreakdownResult = await pool.query(
        `SELECT i.category, COUNT(*) as count, SUM(b.bid_amount) as total_amount
         FROM bids b
         JOIN ideas i ON b.idea_id = i.id
         WHERE b.investor_id = $1
         GROUP BY i.category`,
        [userId]
      );

      analytics.categoryBreakdown = categoryBreakdownResult.rows;
    }

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ PAYMENT INTEGRATION ENDPOINTS ============

// Initialize Stripe payment (placeholder - requires Stripe setup)
app.post('/api/payment/create-intent', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // TODO: Initialize Stripe PaymentIntent
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // Convert to cents
    //   currency: 'usd',
    //   metadata: { userId: req.user.id }
    // });

    // For now, return mock data
    res.json({
      clientSecret: 'mock_client_secret_' + Date.now(),
      amount: amount,
      message: 'Payment intent created (mock)'
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment processing error' });
  }
});

// Process payment and add funds to wallet
app.post('/api/payment/process', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethodId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // TODO: Verify payment with Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.confirm(paymentMethodId);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const tx = await createTransactionRecord({
        userId: req.user.id,
        type: 'deposit',
        method: 'card',
        provider: 'stripe-mock',
        amount,
        currency: 'USD',
        status: 'completed',
        reference: paymentMethodId || `PAY-${Date.now()}`,
        description: 'Wallet funding via card (mock)'
      }, client);

      const result = await client.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance',
        [amount, req.user.id]
      );

      await client.query(
        `UPDATE transactions SET processed_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [tx.id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        walletBalance: parseFloat(result.rows[0].wallet_balance),
        message: 'Payment processed successfully'
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Get transaction history
app.get('/api/payment/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ MARKETPLACE ENDPOINTS ============

// Get all marketplace listings (with filters)
app.get('/api/marketplace/listings', async (req, res) => {
  try {
    const { type, category, minPrice, maxPrice, search, sort = 'created_at', order = 'DESC' } = req.query;
    
    let query = `
      SELECT 
        al.*,
        u.first_name, u.last_name, u.email, u.seller_rating, u.total_sales,
        (SELECT COUNT(*) FROM asset_watchlist WHERE listing_id = al.id) as watchers
      FROM asset_listings al
      JOIN users u ON al.seller_id = u.id
      WHERE al.status = 'active'
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (type) {
      query += ` AND al.asset_type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    
    if (category) {
      query += ` AND al.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    if (minPrice) {
      query += ` AND al.price >= $${paramCount}`;
      params.push(parseFloat(minPrice));
      paramCount++;
    }
    
    if (maxPrice) {
      query += ` AND al.price <= $${paramCount}`;
      params.push(parseFloat(maxPrice));
      paramCount++;
    }
    
    if (search) {
      query += ` AND (al.title ILIKE $${paramCount} OR al.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    const validSorts = ['created_at', 'price', 'views', 'title'];
    const sortColumn = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY al.${sortColumn} ${sortOrder} LIMIT 100`;
    
    const result = await pool.query(query, params);
    
    const listings = result.rows.map(row => ({
      id: row.id,
      sellerId: row.seller_id,
      sellerName: `${row.first_name} ${row.last_name}`,
      sellerRating: parseFloat(row.seller_rating) || 0,
      totalSales: row.total_sales || 0,
      assetType: row.asset_type,
      assetId: row.asset_id,
      title: row.title,
      description: row.description,
      category: row.category,
      price: parseFloat(row.price),
      quantity: parseFloat(row.quantity),
      status: row.status,
      images: row.images || [],
      metadata: row.metadata || {},
      views: row.views,
      watchers: parseInt(row.watchers) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({ listings });
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single listing details
app.get('/api/marketplace/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Increment view count
    await pool.query('UPDATE asset_listings SET views = views + 1 WHERE id = $1', [id]);
    
    const result = await pool.query(`
      SELECT 
        al.*,
        u.first_name, u.last_name, u.email, u.profile_image, u.seller_rating, u.total_sales, u.bio
      FROM asset_listings al
      JOIN users u ON al.seller_id = u.id
      WHERE al.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    const row = result.rows[0];
    
    const listing = {
      id: row.id,
      sellerId: row.seller_id,
      seller: {
        id: row.seller_id,
        name: `${row.first_name} ${row.last_name}`,
        email: row.email,
        profileImage: row.profile_image,
        rating: parseFloat(row.seller_rating) || 0,
        totalSales: row.total_sales || 0,
        bio: row.bio
      },
      assetType: row.asset_type,
      assetId: row.asset_id,
      title: row.title,
      description: row.description,
      category: row.category,
      price: parseFloat(row.price),
      quantity: parseFloat(row.quantity),
      status: row.status,
      images: row.images || [],
      metadata: row.metadata || {},
      views: row.views,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    res.json({ listing });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new listing
app.post('/api/marketplace/listings', authenticateToken, async (req, res) => {
  try {
    const { assetType, assetId, title, description, category, price, quantity, images, metadata } = req.body;
    
    if (!assetType || !title || !description || !price) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    
    if (parseFloat(price) <= 0) {
      return res.status(400).json({ error: 'Price must be greater than 0' });
    }
    
    const result = await pool.query(`
      INSERT INTO asset_listings 
      (seller_id, asset_type, asset_id, title, description, category, price, quantity, images, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      req.user.id,
      assetType,
      assetId || null,
      title,
      description,
      category || null,
      parseFloat(price),
      quantity ? parseFloat(quantity) : 1,
      images || [],
      JSON.stringify(metadata || {})
    ]);
    
    const listing = result.rows[0];
    
    res.status(201).json({
      listing: {
        id: listing.id,
        assetType: listing.asset_type,
        title: listing.title,
        price: parseFloat(listing.price),
        status: listing.status,
        createdAt: listing.created_at
      }
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update listing
app.put('/api/marketplace/listings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, price, quantity, images, metadata, status } = req.body;
    
    // Verify ownership
    const checkResult = await pool.query(
      'SELECT seller_id FROM asset_listings WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    if (checkResult.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const updates = [];
    const params = [];
    let paramCount = 1;
    
    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      params.push(title);
      paramCount++;
    }
    
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }
    
    if (category !== undefined) {
      updates.push(`category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }
    
    if (price !== undefined) {
      if (parseFloat(price) <= 0) {
        return res.status(400).json({ error: 'Price must be greater than 0' });
      }
      updates.push(`price = $${paramCount}`);
      params.push(parseFloat(price));
      paramCount++;
    }
    
    if (quantity !== undefined) {
      updates.push(`quantity = $${paramCount}`);
      params.push(parseFloat(quantity));
      paramCount++;
    }
    
    if (images !== undefined) {
      updates.push(`images = $${paramCount}`);
      params.push(images);
      paramCount++;
    }
    
    if (metadata !== undefined) {
      updates.push(`metadata = $${paramCount}`);
      params.push(JSON.stringify(metadata));
      paramCount++;
    }
    
    if (status !== undefined && ['active', 'sold', 'cancelled'].includes(status)) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    const result = await pool.query(
      `UPDATE asset_listings SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} RETURNING *`,
      params
    );
    
    res.json({ listing: result.rows[0] });
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete listing
app.delete('/api/marketplace/listings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const checkResult = await pool.query(
      'SELECT seller_id, status FROM asset_listings WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    if (checkResult.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (checkResult.rows[0].status === 'sold') {
      return res.status(400).json({ error: 'Cannot delete sold listing' });
    }
    
    await pool.query('DELETE FROM asset_listings WHERE id = $1', [id]);
    
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's listings
app.get('/api/marketplace/my-listings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        al.*,
        (SELECT COUNT(*) FROM asset_watchlist WHERE listing_id = al.id) as watchers,
        (SELECT COUNT(*) FROM asset_offers WHERE listing_id = al.id AND status = 'pending') as pending_offers
      FROM asset_listings al
      WHERE al.seller_id = $1
      ORDER BY al.created_at DESC
    `, [req.user.id]);
    
    const listings = result.rows.map(row => ({
      id: row.id,
      assetType: row.asset_type,
      assetId: row.asset_id,
      title: row.title,
      description: row.description,
      category: row.category,
      price: parseFloat(row.price),
      quantity: parseFloat(row.quantity),
      status: row.status,
      images: row.images || [],
      views: row.views,
      watchers: parseInt(row.watchers) || 0,
      pendingOffers: parseInt(row.pending_offers) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      soldAt: row.sold_at
    }));
    
    res.json({ listings });
  } catch (error) {
    console.error('Error fetching user listings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Buy asset (direct purchase)
app.post('/api/marketplace/buy/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { quantity: requestedQty = 1 } = req.body;
    
    // Get listing details
    const listingResult = await client.query(
      'SELECT * FROM asset_listings WHERE id = $1 AND status = $2 FOR UPDATE',
      [id, 'active']
    );
    
    if (listingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Listing not found or not available' });
    }
    
    const listing = listingResult.rows[0];
    
    if (listing.seller_id === req.user.id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot buy your own listing' });
    }
    
    const quantity = parseFloat(requestedQty);
    const availableQty = parseFloat(listing.quantity);
    
    if (quantity > availableQty) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient quantity available' });
    }
    
    const totalAmount = parseFloat(listing.price) * quantity;
    
    // Check buyer's wallet balance
    const buyerResult = await client.query(
      'SELECT wallet_balance FROM users WHERE id = $1',
      [req.user.id]
    );
    
    const buyerBalance = parseFloat(buyerResult.rows[0].wallet_balance);
    
    if (buyerBalance < totalAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }
    
    // Debit buyer
    await client.query(
      'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
      [totalAmount, req.user.id]
    );
    
    // Credit seller
    await client.query(
      'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
      [totalAmount, listing.seller_id]
    );
    
    // Create transaction record
    const txResult = await client.query(`
      INSERT INTO asset_transactions 
      (listing_id, seller_id, buyer_id, asset_type, quantity, price, total_amount, status, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      listing.id,
      listing.seller_id,
      req.user.id,
      listing.asset_type,
      quantity,
      listing.price,
      totalAmount
    ]);
    
    // Create ownership record for buyer
    await client.query(`
      INSERT INTO asset_ownership 
      (user_id, asset_type, asset_id, listing_id, quantity, purchase_price)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      req.user.id,
      listing.asset_type,
      listing.asset_id,
      listing.id,
      quantity,
      totalAmount
    ]);
    
    // Update listing quantity or mark as sold
    const remainingQty = availableQty - quantity;
    
    if (remainingQty <= 0) {
      await client.query(
        'UPDATE asset_listings SET quantity = 0, status = $1, sold_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['sold', listing.id]
      );
    } else {
      await client.query(
        'UPDATE asset_listings SET quantity = $1 WHERE id = $2',
        [remainingQty, listing.id]
      );
    }
    
    // Update seller stats
    await client.query(
      'UPDATE users SET total_sales = total_sales + 1, successful_sales = successful_sales + 1 WHERE id = $1',
      [listing.seller_id]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      transaction: {
        id: txResult.rows[0].id,
        totalAmount,
        quantity,
        status: 'completed'
      },
      message: 'Purchase completed successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error purchasing asset:', error);
    res.status(500).json({ error: 'Purchase failed' });
  } finally {
    client.release();
  }
});

// Get user's owned assets
app.get('/api/marketplace/my-assets', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ao.*,
        al.title, al.description, al.category, al.images,
        u.first_name, u.last_name
      FROM asset_ownership ao
      LEFT JOIN asset_listings al ON ao.listing_id = al.id
      LEFT JOIN users u ON ao.user_id = u.id
      WHERE ao.user_id = $1
      ORDER BY ao.acquired_at DESC
    `, [req.user.id]);
    
    const assets = result.rows.map(row => ({
      id: row.id,
      assetType: row.asset_type,
      assetId: row.asset_id,
      listingId: row.listing_id,
      title: row.title || 'Untitled Asset',
      description: row.description,
      category: row.category,
      quantity: parseFloat(row.quantity),
      purchasePrice: parseFloat(row.purchase_price),
      currentValue: row.current_value ? parseFloat(row.current_value) : parseFloat(row.purchase_price),
      images: row.images || [],
      metadata: row.metadata || {},
      acquiredAt: row.acquired_at
    }));
    
    res.json({ assets });
  } catch (error) {
    console.error('Error fetching user assets:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Make an offer on a listing
app.post('/api/marketplace/offers/:listingId', authenticateToken, async (req, res) => {
  try {
    const { listingId } = req.params;
    const { offeredPrice, quantity = 1, message } = req.body;
    
    if (!offeredPrice || parseFloat(offeredPrice) <= 0) {
      return res.status(400).json({ error: 'Valid offer price required' });
    }
    
    // Check listing exists and is active
    const listingResult = await pool.query(
      'SELECT seller_id, price, status FROM asset_listings WHERE id = $1',
      [listingId]
    );
    
    if (listingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    const listing = listingResult.rows[0];
    
    if (listing.status !== 'active') {
      return res.status(400).json({ error: 'Listing is not available' });
    }
    
    if (listing.seller_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot make offer on your own listing' });
    }
    
    // Create offer
    const result = await pool.query(`
      INSERT INTO asset_offers 
      (listing_id, buyer_id, offered_price, quantity, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [listingId, req.user.id, parseFloat(offeredPrice), parseFloat(quantity), message || null]);
    
    res.status(201).json({
      offer: {
        id: result.rows[0].id,
        offeredPrice: parseFloat(result.rows[0].offered_price),
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get offers for user's listings
app.get('/api/marketplace/my-offers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ao.*,
        al.title, al.price as listing_price,
        u.first_name, u.last_name, u.email
      FROM asset_offers ao
      JOIN asset_listings al ON ao.listing_id = al.id
      JOIN users u ON ao.buyer_id = u.id
      WHERE al.seller_id = $1
      ORDER BY ao.created_at DESC
    `, [req.user.id]);
    
    const offers = result.rows.map(row => ({
      id: row.id,
      listingId: row.listing_id,
      listingTitle: row.title,
      listingPrice: parseFloat(row.listing_price),
      buyerId: row.buyer_id,
      buyerName: `${row.first_name} ${row.last_name}`,
      buyerEmail: row.email,
      offeredPrice: parseFloat(row.offered_price),
      quantity: parseFloat(row.quantity),
      message: row.message,
      status: row.status,
      counterPrice: row.counter_price ? parseFloat(row.counter_price) : null,
      createdAt: row.created_at,
      respondedAt: row.responded_at
    }));
    
    res.json({ offers });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Respond to an offer (accept/reject/counter)
app.put('/api/marketplace/offers/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { action, counterPrice } = req.body; // action: 'accept', 'reject', 'counter'
    
    if (!['accept', 'reject', 'counter'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    await client.query('BEGIN');
    
    // Get offer and verify ownership
    const offerResult = await client.query(`
      SELECT ao.*, al.seller_id, al.price, al.quantity, al.asset_type, al.asset_id
      FROM asset_offers ao
      JOIN asset_listings al ON ao.listing_id = al.id
      WHERE ao.id = $1 AND ao.status = 'pending'
      FOR UPDATE
    `, [id]);
    
    if (offerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Offer not found or already processed' });
    }
    
    const offer = offerResult.rows[0];
    
    if (offer.seller_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (action === 'accept') {
      // Process the sale (similar to direct buy)
      const quantity = parseFloat(offer.quantity);
      const totalAmount = parseFloat(offer.offered_price) * quantity;
      
      // Check buyer's balance
      const buyerResult = await client.query(
        'SELECT wallet_balance FROM users WHERE id = $1',
        [offer.buyer_id]
      );
      
      const buyerBalance = parseFloat(buyerResult.rows[0].wallet_balance);
      
      if (buyerBalance < totalAmount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Buyer has insufficient balance' });
      }
      
      // Process transaction
      await client.query(
        'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
        [totalAmount, offer.buyer_id]
      );
      
      await client.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
        [totalAmount, offer.seller_id]
      );
      
      // Create transaction
      await client.query(`
        INSERT INTO asset_transactions 
        (listing_id, seller_id, buyer_id, asset_type, quantity, price, total_amount, status, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', CURRENT_TIMESTAMP)
      `, [
        offer.listing_id,
        offer.seller_id,
        offer.buyer_id,
        offer.asset_type,
        quantity,
        offer.offered_price,
        totalAmount
      ]);
      
      // Create ownership
      await client.query(`
        INSERT INTO asset_ownership 
        (user_id, asset_type, asset_id, listing_id, quantity, purchase_price)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        offer.buyer_id,
        offer.asset_type,
        offer.asset_id,
        offer.listing_id,
        quantity,
        totalAmount
      ]);
      
      // Update listing
      const remainingQty = parseFloat(offer.quantity) - quantity;
      if (remainingQty <= 0) {
        await client.query(
          'UPDATE asset_listings SET quantity = 0, status = $1, sold_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['sold', offer.listing_id]
        );
      } else {
        await client.query(
          'UPDATE asset_listings SET quantity = $1 WHERE id = $2',
          [remainingQty, offer.listing_id]
        );
      }
      
      // Update offer status
      await client.query(
        'UPDATE asset_offers SET status = $1, responded_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['accepted', id]
      );
      
      // Update seller stats
      await client.query(
        'UPDATE users SET total_sales = total_sales + 1, successful_sales = successful_sales + 1 WHERE id = $1',
        [offer.seller_id]
      );
      
    } else if (action === 'reject') {
      await client.query(
        'UPDATE asset_offers SET status = $1, responded_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['rejected', id]
      );
    } else if (action === 'counter') {
      if (!counterPrice || parseFloat(counterPrice) <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Valid counter price required' });
      }
      
      await client.query(
        'UPDATE asset_offers SET status = $1, counter_price = $2, responded_at = CURRENT_TIMESTAMP WHERE id = $3',
        ['counter', parseFloat(counterPrice), id]
      );
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: `Offer ${action}ed successfully`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error responding to offer:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Add/remove from watchlist
app.post('/api/marketplace/watchlist/:listingId', authenticateToken, async (req, res) => {
  try {
    const { listingId } = req.params;
    const { action } = req.body; // 'add' or 'remove'
    
    if (action === 'add') {
      await pool.query(
        'INSERT INTO asset_watchlist (user_id, listing_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.user.id, listingId]
      );
      res.json({ message: 'Added to watchlist' });
    } else if (action === 'remove') {
      await pool.query(
        'DELETE FROM asset_watchlist WHERE user_id = $1 AND listing_id = $2',
        [req.user.id, listingId]
      );
      res.json({ message: 'Removed from watchlist' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error updating watchlist:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's watchlist
app.get('/api/marketplace/watchlist', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        al.*,
        u.first_name, u.last_name,
        aw.created_at as watched_at
      FROM asset_watchlist aw
      JOIN asset_listings al ON aw.listing_id = al.id
      JOIN users u ON al.seller_id = u.id
      WHERE aw.user_id = $1
      ORDER BY aw.created_at DESC
    `, [req.user.id]);
    
    const watchlist = result.rows.map(row => ({
      id: row.id,
      sellerId: row.seller_id,
      sellerName: `${row.first_name} ${row.last_name}`,
      assetType: row.asset_type,
      title: row.title,
      description: row.description,
      category: row.category,
      price: parseFloat(row.price),
      quantity: parseFloat(row.quantity),
      status: row.status,
      images: row.images || [],
      watchedAt: row.watched_at,
      createdAt: row.created_at
    }));
    
    res.json({ watchlist });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`BillNet API server running on http://localhost:${port}`);
});
