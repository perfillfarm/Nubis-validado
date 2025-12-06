/*
  # Add Product Code for Paradise Provider

  1. Changes
    - Add product_code column to pix_provider_settings table
    
  2. Notes
    - This field stores the Paradise product code (e.g., prod_372774c4d60894ba)
    - Used when creating PIX transactions with Paradise
*/

-- Add product_code column for Paradise
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pix_provider_settings' AND column_name = 'product_code'
  ) THEN
    ALTER TABLE pix_provider_settings ADD COLUMN product_code text;
  END IF;
END $$;