/*
  # Create Xtracky Settings Table

  1. New Tables
    - `xtracky_settings`
      - `id` (uuid, primary key)
      - `api_url` (text) - Xtracky API URL
      - `api_key` (text, nullable) - API key for Xtracky (if required in future)
      - `is_active` (boolean) - Whether Xtracky tracking is enabled
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `xtracky_settings` table
    - Add policies for reading and updating settings

  3. Initial Data
    - Insert default Xtracky configuration with API URL
*/

CREATE TABLE IF NOT EXISTS xtracky_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url text NOT NULL DEFAULT 'https://api.xtracky.com/api/integrations/api',
  api_key text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE xtracky_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read Xtracky settings"
  ON xtracky_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert Xtracky settings"
  ON xtracky_settings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update Xtracky settings"
  ON xtracky_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete Xtracky settings"
  ON xtracky_settings
  FOR DELETE
  USING (true);

INSERT INTO xtracky_settings (api_url, is_active)
VALUES ('https://api.xtracky.com/api/integrations/api', true)
ON CONFLICT DO NOTHING;
