/*
  # Add country field to users table

  1. Changes
    - Add `country` column to `users` table
    - Set default value to empty string for existing users
    - Make field not nullable for new users

  2. Security
    - No changes to existing RLS policies needed
    - Users can update their own country information
*/

-- Add country column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'country'
  ) THEN
    ALTER TABLE users ADD COLUMN country text NOT NULL DEFAULT '';
  END IF;
END $$;