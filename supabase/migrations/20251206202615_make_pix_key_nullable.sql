/*
  # Make pix_key column nullable

  1. Changes
    - Alter pix_key column to allow NULL values
    
  2. Notes
    - Some PIX providers (Paradise, Aureo) don't use traditional PIX keys
    - The QR code is sufficient for payment processing
    - This change allows flexibility across different PIX providers
*/

-- Make pix_key nullable
ALTER TABLE transactions 
ALTER COLUMN pix_key DROP NOT NULL;