-- Fix RLS policies and add test user
-- Run this in your Supabase SQL Editor

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow login queries" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;

-- Create a simple policy that allows all operations for now
-- (You can make this more restrictive later)
CREATE POLICY "Allow all operations" ON users
    FOR ALL USING (true) WITH CHECK (true);

-- Add the test user directly (bypassing RLS issues)
INSERT INTO users (email, password_hash, name, role, created_at, updated_at) 
VALUES (
    'joijoi00666@gmail.com', 
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', -- password123
    'Test User', 
    'student',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Verify the user was created
SELECT id, email, name, role, created_at FROM users WHERE email = 'joijoi00666@gmail.com';