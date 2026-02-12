-- Clear all users from the database
DELETE FROM investments;
DELETE FROM bids;
DELETE FROM comments;
DELETE FROM favorites;
DELETE FROM follows;
DELETE FROM notifications;
DELETE FROM messages;
DELETE FROM ideas;
DELETE FROM users;

-- Update role check constraint to allow 'user' role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('entrepreneur', 'investor', 'user'));

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE ideas_id_seq RESTART WITH 1;
ALTER SEQUENCE bids_id_seq RESTART WITH 1;
ALTER SEQUENCE investments_id_seq RESTART WITH 1;
ALTER SEQUENCE comments_id_seq RESTART WITH 1;
ALTER SEQUENCE messages_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;

SELECT 'All users and related data cleared successfully!' as result;
