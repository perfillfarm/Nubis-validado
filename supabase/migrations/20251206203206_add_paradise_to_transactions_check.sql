/*
  # Add Paradise to Transactions Provider Check Constraint

  1. Changes
    - Drop existing CHECK constraint on provider column in transactions table
    - Add new CHECK constraint that includes 'paradise' as valid provider option
    
  2. Notes
    - This allows transactions to use Paradise as a payment provider
    - Paradise was already added to pix_provider_settings but not to transactions
    - Valid providers are now: 'genesys', 'mangofy', 'aureo', 'paradise'
*/

-- Drop existing constraint
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_provider_check;

-- Add updated constraint with paradise included
ALTER TABLE transactions 
ADD CONSTRAINT transactions_provider_check 
CHECK (provider = ANY (ARRAY['genesys'::text, 'mangofy'::text, 'aureo'::text, 'paradise'::text]));