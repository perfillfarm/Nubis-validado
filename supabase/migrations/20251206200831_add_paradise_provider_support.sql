/*
  # Add Paradise Provider Support

  1. Changes
    - Drop existing provider check constraint
    - Add new constraint that includes 'paradise' as valid provider
    - Add recipient_id column for Paradise provider configuration
    
  2. Notes
    - This allows the pix_provider_settings table to accept 'paradise' as a provider value
    - The recipient_id field stores the Paradise store identifier
*/

-- Drop existing constraint
ALTER TABLE pix_provider_settings 
DROP CONSTRAINT IF EXISTS pix_provider_settings_provider_check;

-- Add updated constraint with paradise included
ALTER TABLE pix_provider_settings 
ADD CONSTRAINT pix_provider_settings_provider_check 
CHECK (provider IN ('genesys', 'mangofy', 'aureo', 'paradise'));

-- Add recipient_id column for Paradise
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pix_provider_settings' AND column_name = 'recipient_id'
  ) THEN
    ALTER TABLE pix_provider_settings ADD COLUMN recipient_id text;
  END IF;
END $$;
