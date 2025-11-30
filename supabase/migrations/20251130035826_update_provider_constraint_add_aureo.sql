/*
  # Update Provider Constraint to Include Aureo

  1. Changes
    - Drop existing provider check constraint
    - Add new constraint that includes 'aureo' as valid provider
    
  2. Notes
    - This allows the pix_provider_settings table to accept 'aureo' as a provider value
*/

-- Drop existing constraint
ALTER TABLE pix_provider_settings 
DROP CONSTRAINT IF EXISTS pix_provider_settings_provider_check;

-- Add updated constraint with aureo included
ALTER TABLE pix_provider_settings 
ADD CONSTRAINT pix_provider_settings_provider_check 
CHECK (provider IN ('genesys', 'mangofy', 'aureo'));
