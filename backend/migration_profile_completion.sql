-- Migration: Add profile completion tracking
-- This migration adds a field to track whether users have completed their profile setup

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT FALSE;

-- Index for faster queries on profile completion status
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(is_profile_completed);

-- Set existing users as profile completed (optional - uncomment if needed)
-- UPDATE users SET is_profile_completed = TRUE WHERE role IS NOT NULL;
