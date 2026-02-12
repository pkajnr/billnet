-- Migration: Add payment methods support
-- This adds support for Bitcoin addresses and multiple payment methods

-- Add bitcoin_address column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bitcoin_address VARCHAR(100),
ADD COLUMN IF NOT EXISTS bitcoin_address_generated_at TIMESTAMP;

-- Create index on bitcoin_address
CREATE INDEX IF NOT EXISTS idx_users_bitcoin_address ON users(bitcoin_address);

-- Create payment_transactions table for tracking all payment types
CREATE TABLE IF NOT EXISTS payment_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal')),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('card', 'bank_transfer', 'bitcoin', 'manual')),
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Card payment details
  card_last4 VARCHAR(4),
  card_brand VARCHAR(20),
  
  -- Bank transfer details  
  bank_name VARCHAR(255),
  bank_account_last4 VARCHAR(4),
  bank_reference VARCHAR(255),
  
  -- Bitcoin details
  bitcoin_address VARCHAR(100),
  bitcoin_txid VARCHAR(100),
  bitcoin_confirmations INTEGER DEFAULT 0,
  
  -- Common fields
  reference_id VARCHAR(255) UNIQUE,
  description TEXT,
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes for payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_method ON payment_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_bitcoin_txid ON payment_transactions(bitcoin_txid);

-- Create saved_payment_methods table
CREATE TABLE IF NOT EXISTS saved_payment_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method_type VARCHAR(50) NOT NULL CHECK (method_type IN ('card', 'bank_account')),
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Card details (tokenized)
  card_last4 VARCHAR(4),
  card_brand VARCHAR(20),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  card_token VARCHAR(255), -- Stripe/Payment processor token
  
  -- Bank account details
  bank_name VARCHAR(255),
  bank_account_last4 VARCHAR(4),
  bank_routing_number VARCHAR(20),
  bank_account_token VARCHAR(255),
  
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for saved_payment_methods
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_user_id ON saved_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_default ON saved_payment_methods(user_id, is_default) WHERE is_default = true;

-- Comment on tables
COMMENT ON TABLE payment_transactions IS 'Tracks all payment transactions including card, bank transfer, and bitcoin deposits';
COMMENT ON TABLE saved_payment_methods IS 'Stores tokenized payment methods for users';
COMMENT ON COLUMN users.bitcoin_address IS 'Unique Bitcoin address assigned to this user for receiving deposits';
