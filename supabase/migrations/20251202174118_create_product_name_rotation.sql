/*
  # Create Product Name Rotation System

  1. New Tables
    - `product_name_rotation`
      - `id` (uuid, primary key)
      - `current_index` (integer) - tracks which product name to use next
      - `last_used_at` (timestamp) - when the name was last used
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `product_name_rotation` table
    - Add policy for service role to manage rotation
*/

CREATE TABLE IF NOT EXISTS product_name_rotation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_index integer NOT NULL DEFAULT 0,
  last_used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_name_rotation ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role full access
CREATE POLICY "Service role can manage product name rotation"
  ON product_name_rotation
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy to allow authenticated users to read
CREATE POLICY "Authenticated users can read product name rotation"
  ON product_name_rotation
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert initial row if not exists
INSERT INTO product_name_rotation (current_index)
SELECT 0
WHERE NOT EXISTS (SELECT 1 FROM product_name_rotation);

-- Function to get and increment the product name index atomically
CREATE OR REPLACE FUNCTION get_next_product_name_index()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_index integer;
  max_index integer := 99;
BEGIN
  UPDATE product_name_rotation
  SET
    current_index = CASE
      WHEN current_index >= max_index THEN 0
      ELSE current_index + 1
    END,
    last_used_at = now(),
    updated_at = now()
  WHERE id = (SELECT id FROM product_name_rotation LIMIT 1)
  RETURNING current_index INTO next_index;

  RETURN next_index;
END;
$$;
