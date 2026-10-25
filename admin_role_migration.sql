-- ============================================================
-- Admin role table for NwSSU Connect admin dashboard
-- Run this in Supabase SQL Editor on the library project
-- ============================================================

-- 1. Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Policy: only authenticated users can read (to check their own status)
CREATE POLICY "Authenticated users can check admin status"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Add the first admin: replace the email with the admin account's email
--    (it must already exist under Authentication > Users).
INSERT INTO admin_users (user_id, email)
SELECT id, email FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify it worked:
-- SELECT * FROM admin_users;
