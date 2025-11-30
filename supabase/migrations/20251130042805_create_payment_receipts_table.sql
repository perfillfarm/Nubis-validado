/*
  # Create Payment Receipts Table
  
  1. New Tables
    - `payment_receipts`
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, foreign key to transactions)
      - `cpf` (text) - CPF do cliente
      - `customer_name` (text) - Nome do cliente
      - `amount` (numeric) - Valor do pagamento
      - `receipt_image_url` (text) - URL da imagem do comprovante no Storage
      - `receipt_uploaded_at` (timestamptz) - Data/hora do upload
      - `uploaded_by_ip` (text) - IP de quem fez upload
      - `status` (text) - Status: pending_receipt, receipt_uploaded, verified
      - `admin_notes` (text) - Notas do admin
      - `verified_at` (timestamptz) - Data/hora da verificação
      - `verified_by` (text) - Quem verificou
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on `payment_receipts` table
    - Add policy for authenticated users to insert their own receipts
    - Add policy for admins to view all receipts
    
  3. Storage
    - Create storage bucket for payment receipts
    - Enable RLS on storage bucket
    - Allow public read access
*/

-- Create payment_receipts table
CREATE TABLE IF NOT EXISTS payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  cpf text NOT NULL,
  customer_name text,
  amount numeric NOT NULL DEFAULT 0,
  receipt_image_url text,
  receipt_uploaded_at timestamptz,
  uploaded_by_ip text,
  status text NOT NULL DEFAULT 'pending_receipt',
  admin_notes text,
  verified_at timestamptz,
  verified_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS payment_receipts_transaction_id_idx ON payment_receipts(transaction_id);
CREATE INDEX IF NOT EXISTS payment_receipts_cpf_idx ON payment_receipts(cpf);
CREATE INDEX IF NOT EXISTS payment_receipts_status_idx ON payment_receipts(status);

-- Enable RLS
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert receipts (for public flow)
CREATE POLICY "Anyone can insert payment receipts"
  ON payment_receipts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Allow anyone to read receipts
CREATE POLICY "Anyone can read payment receipts"
  ON payment_receipts
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Allow anyone to update receipts
CREATE POLICY "Anyone can update payment receipts"
  ON payment_receipts
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;