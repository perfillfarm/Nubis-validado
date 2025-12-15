/*
  # Add UTM Tracking to Transactions Table

  1. Changes
    - Add `utm_source` column to track traffic source (e.g., google, facebook)
    - Add `utm_medium` column to track marketing medium (e.g., cpc, email, social)
    - Add `utm_campaign` column to track campaign name
    - Add `utm_term` column to track paid search keywords
    - Add `utm_content` column to track ad variation
    - Add `src` column to track custom source/slug identifier

  2. Benefits
    - Enable attribution tracking for all PIX transactions
    - Allow ROI analysis by traffic source and campaign
    - Support conversion rate analysis by marketing channel
    - Facilitate data-driven marketing decisions

  3. Indexes
    - Add index on `utm_source` for fast filtering by source
    - Add index on `utm_campaign` for campaign performance queries
    - Add index on `src` for custom source tracking

  4. Notes
    - All UTM fields are optional (nullable)
    - Fields accept TEXT type for flexibility
    - Indexes improve query performance for analytics
*/

-- Add UTM tracking columns to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS src TEXT;

-- Create indexes for common analytics queries
CREATE INDEX IF NOT EXISTS idx_transactions_utm_source ON transactions(utm_source);
CREATE INDEX IF NOT EXISTS idx_transactions_utm_campaign ON transactions(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_transactions_src ON transactions(src);

-- Create composite index for source + medium queries
CREATE INDEX IF NOT EXISTS idx_transactions_utm_source_medium ON transactions(utm_source, utm_medium);