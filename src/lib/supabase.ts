import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: 'applicant' | 'admin';
  created_at: string;
  updated_at: string;
};

export type Application = {
  id: string;
  user_id: string;
  position: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  risk_score?: number;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
};

export type Interview = {
  id: string;
  application_id: string;
  video_url?: string;
  audio_url?: string;
  transcript?: string;
  questions: any[];
  answers: any[];
  credibility_score?: number;
  sentiment_score?: number;
  analysis: any;
  duration: number;
  completed_at?: string;
  created_at: string;
};

export type EmotionAnalysis = {
  id: string;
  interview_id: string;
  timestamp: number;
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'fear' | 'surprise' | 'disgust';
  confidence: number;
  facial_features: any;
  created_at: string;
};

export type Document = {
  id: string;
  application_id: string;
  document_type: 'passport' | 'id_card' | 'visa' | 'other';
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
};

export type OCRResult = {
  id: string;
  document_id: string;
  extracted_text?: string;
  extracted_fields: any;
  validation_status: 'pending' | 'valid' | 'invalid' | 'suspicious';
  match_score?: number;
  discrepancies: any[];
  tampering_detected: boolean;
  processed_at?: string;
  created_at: string;
};

export type BackgroundCheck = {
  id: string;
  application_id: string;
  check_type: string;
  status: 'pending' | 'completed' | 'failed';
  results: any;
  watchlist_matches: any[];
  identity_validation: any;
  duplicate_checks: any[];
  risk_indicators: any[];
  score?: number;
  completed_at?: string;
  created_at: string;
};

export type RiskAssessment = {
  id: string;
  application_id: string;
  interview_score?: number;
  emotion_score?: number;
  ocr_score?: number;
  background_score?: number;
  final_score?: number;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH';
  weights: any;
  detailed_report: any;
  created_at: string;
};
