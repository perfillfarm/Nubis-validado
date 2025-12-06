/*
  # Remove UNIQUE constraint from genesys_transaction_id
  
  1. Changes
    - Remove UNIQUE constraint from genesys_transaction_id column
    - This column was originally designed only for Genesys
    - Other providers should use external_transaction_id instead
    
  2. Notes
    - genesys_transaction_id will remain for backwards compatibility with Genesys
    - Paradise and other providers will use external_transaction_id
*/

-- Remove the UNIQUE constraint from genesys_transaction_id
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_genesys_transaction_id_key;
