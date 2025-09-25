/*
  # Update assessments table schema

  1. New Tables
    - `assessments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp with timezone, defaults to now())
      - `timestamp` (timestamp with timezone, defaults to now()) - legacy support
      - `inputs` (jsonb, assessment form data)
      - `risk_score` (text, calculated risk percentage)
      - `risk_category` (text, risk level classification)
      - `recommendations` (jsonb, treatment recommendations)
      - `guidelines` (jsonb, clinical guidelines)
      - `disclaimer` (text, medical disclaimer)
      - `overall_recommendation` (text, provider recommendation)
      - `provider_comments` (text, healthcare provider notes)
      - `status` (text, defaults to 'pending_review')

  2. Security
    - Enable RLS on `assessments` table
    - Add policies for authenticated users to manage their own data

  3. Changes
    - Add missing `created_at` column to existing table if it doesn't exist
    - Ensure all required columns are present
*/

-- Add created_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessments' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE assessments ADD COLUMN created_at timestamptz DEFAULT now() NOT NULL;
  END IF;
END $$;

-- Create assessments table if it doesn't exist
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  timestamp timestamptz DEFAULT now(),
  inputs jsonb NOT NULL,
  risk_score text,
  risk_category text,
  recommendations jsonb,
  guidelines jsonb,
  disclaimer text,
  overall_recommendation text,
  provider_comments text,
  status text DEFAULT 'pending_review'
);

-- Enable RLS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own assessments"
  ON assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments"
  ON assessments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);