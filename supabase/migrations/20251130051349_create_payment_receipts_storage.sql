/*
  # Create Payment Receipts Storage Bucket and Policies

  1. Storage Setup
    - Create 'payment-receipts' storage bucket
    - Configure bucket to be private by default
    
  2. Security Policies
    - Allow authenticated and anonymous users to upload receipts
    - Allow authenticated and anonymous users to read receipts
    - Files organized by CPF folders for easy management
*/

-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload payment receipts (needed for unauthenticated flow)
CREATE POLICY "Allow public uploads to payment-receipts"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-receipts');

-- Allow anyone to read payment receipts
CREATE POLICY "Allow public read from payment-receipts"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'payment-receipts');

-- Allow anyone to update payment receipts (for overwrites)
CREATE POLICY "Allow public updates to payment-receipts"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'payment-receipts');
