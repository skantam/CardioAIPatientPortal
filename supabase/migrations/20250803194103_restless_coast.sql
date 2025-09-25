/*
  # Add results column to assessments table

  1. Changes
    - Add `results` column to `assessments` table
    - Column type: jsonb (to store JSON data)
    - Allow null values
    - No default value needed

  This resolves the PGRST204 error where the application tries to write to a 'results' column that doesn't exist in the database schema.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessments' AND column_name = 'results'
  ) THEN
    ALTER TABLE assessments ADD COLUMN results jsonb;
  END IF;
END $$;