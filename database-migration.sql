-- Updated Users table with all required fields
-- Run this in your Supabase SQL editor

-- First, let's check if the users table exists and what columns it has
-- You may need to drop and recreate the table if it's missing required columns

-- Drop existing table if you want to start fresh (WARNING: This will delete all data)
-- DROP TABLE IF EXISTS users CASCADE;

-- Create or alter the users table with all required fields
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    role VARCHAR NOT NULL CHECK (role IN ('super_admin', 'admin', 'teacher', 'student')),
    avatar_url VARCHAR,
    phone VARCHAR,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- If the table already exists, you might need to add missing columns:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR NOT NULL DEFAULT '';
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update the role constraint to include super_admin
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
-- ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin', 'teacher', 'student'));

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow users to read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Allow users to update their own data
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow public read access for login (you might want to restrict this)
CREATE POLICY "Allow login queries" ON users
    FOR SELECT USING (true);

-- Allow insert for registration
CREATE POLICY "Allow user registration" ON users
    FOR INSERT WITH CHECK (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a test user for login testing
-- Password is 'password123' hashed with bcrypt
INSERT INTO users (email, password_hash, name, role, status, email_verified) 
VALUES (
    'joijoi00666@gmail.com', 
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', -- password123
    'Test User', 
    'student', 
    'active', 
    true
) ON CONFLICT (email) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);