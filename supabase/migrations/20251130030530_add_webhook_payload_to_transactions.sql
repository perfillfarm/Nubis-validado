/*
  # Add Webhook Payload Logging to Transactions Table

  1. Changes
    - Add `webhook_payload` column to store raw webhook payloads from payment providers
    - Add `provider` column to track which payment provider was used
    - This enables full audit trail of payment confirmations

  2. Purpose
    - Capture all webhook data sent by Mangofy, Aureo, and other providers
    - Debug payment issues by reviewing raw provider responses
    - Track payment lifecycle with complete provider data
    - Ensure we never lose payment confirmation data

  3. Notes
    - Using JSONB for flexible storage of varying webhook structures
    - Array type allows storing multiple webhook calls for same transaction
    - Provider field helps identify which webhook endpoint received the data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'webhook_payload'
  ) THEN
    ALTER TABLE transactions ADD COLUMN webhook_payload jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'provider'
  ) THEN
    ALTER TABLE transactions ADD COLUMN provider text;
  END IF;
END $$;

COMMENT ON COLUMN transactions.webhook_payload IS 'Raw webhook payloads received from payment providers';
COMMENT ON COLUMN transactions.provider IS 'Payment provider used (genesys, mangofy, aureo)';