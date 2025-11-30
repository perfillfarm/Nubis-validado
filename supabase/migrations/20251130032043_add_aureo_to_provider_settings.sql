/*
  # Add Aureo Provider Support

  1. Changes
    - Update provider check constraint to include 'aureo'
    - This allows the pix_provider_settings table to accept aureo as a valid provider
*/

ALTER TABLE pix_provider_settings 
DROP CONSTRAINT IF EXISTS pix_provider_settings_provider_check;

ALTER TABLE pix_provider_settings
ADD CONSTRAINT pix_provider_settings_provider_check 
CHECK (provider = ANY (ARRAY['genesys'::text, 'mangofy'::text, 'aureo'::text]));
