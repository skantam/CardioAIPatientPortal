/*
  # Create assessments table

  1. New Tables
    - `assessments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp with timezone)
      - `inputs` (jsonb for storing user answers)
      - `risk_score` (text for percentage like "5.0%")
      - `risk_category` (text for Low/Borderline/Intermediate/High)
      - `recommendations` (jsonb for structured treatment advice)
      - `guidelines` (jsonb for clinical guidelines)
      - `disclaimer` (text for disclaimer from response)
      - `overall_recommendation` (text for manual or AI-generated)
      - `provider_comments` (text for manual review)
      - `status` (text for pending_review/reviewed)
      - `results` (jsonb for entire JSON response from n8n webhook)

  2. Security
    - Enable RLS on `assessments` table
    - Add policy for authenticated users to read their own data
    - Add policy for authenticated users to insert their own data
    - Add policy for authenticated users to update their own data
*/

CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  inputs jsonb NOT NULL,
  risk_score text,
  risk_category text,
  recommendations jsonb,
  guidelines jsonb,
  disclaimer text,
  overall_recommendation text,
  provider_comments text,
  status text DEFAULT 'pending_review',
  results jsonb
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

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