/*
  # Create consent_history table

  1. New Tables
    - `consent_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp with timezone)
      - `consent_given` (boolean)

  2. Security
    - Enable RLS on `consent_history` table
    - Add policy for authenticated users to read their own data
    - Add policy for authenticated users to insert their own data
*/

CREATE TABLE IF NOT EXISTS consent_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  consent_given boolean NOT NULL
);

ALTER TABLE consent_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own consent history"
  ON consent_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent history"
  ON consent_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);