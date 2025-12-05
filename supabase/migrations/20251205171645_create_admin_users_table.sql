/*
  # Create admin_users table for administrative access

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key) - References auth.users
      - `email` (text, unique, not null) - Admin email address
      - `created_at` (timestamptz) - Account creation timestamp
      - `last_login` (timestamptz) - Last login timestamp

  2. Security
    - Enable RLS on `admin_users` table
    - Add policy for authenticated admins to read their own data
    - Add policy for authenticated admins to update their last_login

  3. Notes
    - This table tracks admin users who can access /settings
    - Authentication handled by Supabase Auth
    - Initial admin will be created separately in Supabase Auth
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read their own data
CREATE POLICY "Admins can read own data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Admins can update their own last_login
CREATE POLICY "Admins can update own last_login"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);