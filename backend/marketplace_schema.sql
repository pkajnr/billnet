-- Marketplace schema for asset trading

-- Asset Listings table (for all tradeable items: businesses, ideas, shares)
CREATE TABLE asset_listings (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('business', 'idea', 'shares', 'equity', 'project', 'other')),
  asset_id INTEGER, -- Reference to the original asset (idea_id, investment_id, etc.)
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  price DECIMAL(15, 2) NOT NULL,
  quantity DECIMAL(10, 4) DEFAULT 1, -- For shares/equity (percentage or units)
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'pending')),
  images TEXT[], -- Array of image URLs
  metadata JSONB, -- Store additional asset-specific data
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sold_at TIMESTAMP
);

CREATE INDEX idx_listings_seller_id ON asset_listings(seller_id);
CREATE INDEX idx_listings_asset_type ON asset_listings(asset_type);
CREATE INDEX idx_listings_status ON asset_listings(status);
CREATE INDEX idx_listings_category ON asset_listings(category);
CREATE INDEX idx_listings_price ON asset_listings(price);

-- Asset Ownership table (track who owns what)
CREATE TABLE asset_ownership (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL,
  asset_id INTEGER, -- Reference to the asset
  listing_id INTEGER REFERENCES asset_listings(id) ON DELETE SET NULL,
  quantity DECIMAL(10, 4) DEFAULT 1,
  purchase_price DECIMAL(15, 2),
  current_value DECIMAL(15, 2),
  acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX idx_ownership_user_id ON asset_ownership(user_id);
CREATE INDEX idx_ownership_asset_type ON asset_ownership(asset_type);
CREATE INDEX idx_ownership_listing_id ON asset_ownership(listing_id);

-- Asset Transactions table (record all trades)
CREATE TABLE asset_transactions (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES asset_listings(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL,
  quantity DECIMAL(10, 4) NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method VARCHAR(50),
  transaction_hash VARCHAR(255), -- For blockchain/payment reference
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_transactions_listing_id ON asset_transactions(listing_id);
CREATE INDEX idx_transactions_seller_id ON asset_transactions(seller_id);
CREATE INDEX idx_transactions_buyer_id ON asset_transactions(buyer_id);
CREATE INDEX idx_transactions_status ON asset_transactions(status);

-- Offers table (for negotiation/bidding on assets)
CREATE TABLE asset_offers (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES asset_listings(id) ON DELETE CASCADE,
  buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offered_price DECIMAL(15, 2) NOT NULL,
  quantity DECIMAL(10, 4) DEFAULT 1,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'counter')),
  counter_price DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP
);

CREATE INDEX idx_offers_listing_id ON asset_offers(listing_id);
CREATE INDEX idx_offers_buyer_id ON asset_offers(buyer_id);
CREATE INDEX idx_offers_status ON asset_offers(status);

-- Watchlist table (users can watch listings)
CREATE TABLE asset_watchlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES asset_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_watchlist_user_id ON asset_watchlist(user_id);
CREATE INDEX idx_watchlist_listing_id ON asset_watchlist(listing_id);

-- Reviews/Ratings table (for sellers)
CREATE TABLE seller_reviews (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL REFERENCES asset_transactions(id) ON DELETE CASCADE,
  reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(transaction_id, reviewer_id)
);

CREATE INDEX idx_reviews_seller_id ON seller_reviews(seller_id);
CREATE INDEX idx_reviews_transaction_id ON seller_reviews(transaction_id);

-- Triggers for updated_at
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON asset_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add wallet_balance to users table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='wallet_balance') THEN
    ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(15, 2) DEFAULT 0;
  END IF;
END $$;

-- Add seller rating columns to users table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='seller_rating') THEN
    ALTER TABLE users ADD COLUMN seller_rating DECIMAL(3, 2) DEFAULT 0;
    ALTER TABLE users ADD COLUMN total_sales INTEGER DEFAULT 0;
    ALTER TABLE users ADD COLUMN successful_sales INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX idx_users_seller_rating ON users(seller_rating);
