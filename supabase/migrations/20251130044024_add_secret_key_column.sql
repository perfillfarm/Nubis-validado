/*
  # Add secret_key column to pix_provider_settings
  
  1. Changes
    - Add `secret_key` column (text, nullable) to store provider secret keys
    - This column is used by the Aureo provider for authentication
  
  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Existing rows will have NULL values for this column
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pix_provider_settings' AND column_name = 'secret_key'
  ) THEN
    ALTER TABLE pix_provider_settings ADD COLUMN secret_key text;
  END IF;
END $$;
