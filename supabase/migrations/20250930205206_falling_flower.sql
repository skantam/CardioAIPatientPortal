/*
  # Add UserCountry column to assessments table

  1. Changes
    - Add `UserCountry` column to `assessments` table
    - Column will store the user's country from their auth metadata

  2. Security
    - Column allows NULL values for existing records
    - New assessments should populate this field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessments' AND column_name = 'UserCountry'
  ) THEN
    ALTER TABLE assessments ADD COLUMN UserCountry text;
  END IF;
END $$;