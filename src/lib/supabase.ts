import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      assessments: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          inputs: any;
          risk_score: string | null;
          risk_category: string | null;
          recommendations: any | null;
          guidelines: any | null;
          disclaimer: string | null;
          overall_recommendation: string | null;
          provider_comments: string | null;
          status: string;
          results: any | null;
          usercountry: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          inputs: any;
          risk_score?: string | null;
          risk_category?: string | null;
          recommendations?: any | null;
          guidelines?: any | null;
          disclaimer?: string | null;
          overall_recommendation?: string | null;
          provider_comments?: string | null;
          status?: string;
          results?: any | null;
          usercountry?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          inputs?: any;
          risk_score?: string | null;
          risk_category?: string | null;
          recommendations?: any | null;
          guidelines?: any | null;
          disclaimer?: string | null;
          overall_recommendation?: string | null;
          provider_comments?: string | null;
          status?: string;
          results?: any | null;
          usercountry?: string | null;
        };
      };
      consent_history: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          consent_given: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          consent_given: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          consent_given?: boolean;
        };
      };
    };
  };
};