/*
  # Update consent_history table

  1. Changes
    - Add missing created_at column to consent_history table
    - Ensure proper timestamp handling

  2. Security
    - Maintain existing RLS policies
*/

-- Add the missing created_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consent_history' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE consent_history ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;