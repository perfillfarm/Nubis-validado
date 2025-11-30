/*
  # Add Aureo Keys to PIX Provider Settings

  1. Changes
    - Add `public_key` column to store Aureo public key
    - Add `secret_key` column to store Aureo secret key
    
  2. Notes
    - These columns are optional and only used by Aureo provider
    - Uses IF NOT EXISTS to prevent errors if columns already exist
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pix_provider_settings' AND column_name = 'public_key'
  ) THEN
    ALTER TABLE pix_provider_settings ADD COLUMN public_key text;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pix_provider_settings' AND column_name = 'secret_key'
  ) THEN
    ALTER TABLE pix_provider_settings ADD COLUMN secret_key text;
  END IF;
END $$;
