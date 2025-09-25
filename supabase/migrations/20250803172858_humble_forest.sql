/*
  # Fix RLS policies for data deletion

  1. Security Changes
    - Add DELETE policies for assessments and consent_history tables
    - Ensure users can delete their own data

  2. Tables affected
    - assessments: Add DELETE policy
    - consent_history: Add DELETE policy
*/

-- Add DELETE policy for assessments table
CREATE POLICY "Users can delete own assessments"
  ON assessments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add DELETE policy for consent_history table  
CREATE POLICY "Users can delete own consent history"
  ON consent_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);