/*
  # AI-Driven Interview & Background Verification System - Complete Database Schema

  ## Overview
  This migration creates the complete database schema for an AI-driven interview and background verification system.

  ## New Tables Created

  ### 1. `users` - User authentication and profile management
    - `id` (uuid, primary key) - Unique user identifier
    - `email` (text, unique, not null) - User email address
    - `password_hash` (text, not null) - Hashed password
    - `full_name` (text, not null) - User's full name
    - `role` (text, not null) - User role: 'applicant' or 'admin'
    - `created_at` (timestamptz) - Account creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `applications` - Application submissions and status
    - `id` (uuid, primary key) - Unique application identifier
    - `user_id` (uuid, foreign key) - Reference to users table
    - `position` (text, not null) - Position applied for
    - `status` (text) - Application status: 'pending', 'in_progress', 'completed', 'approved', 'rejected'
    - `risk_score` (integer) - Final risk score (0-100)
    - `risk_level` (text) - Risk level: 'LOW', 'MEDIUM', 'HIGH'
    - `admin_notes` (text) - Admin notes and comments
    - `created_at` (timestamptz) - Application creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `interviews` - AI interview recordings and analysis
    - `id` (uuid, primary key) - Unique interview identifier
    - `application_id` (uuid, foreign key) - Reference to applications table
    - `video_url` (text) - URL to recorded video
    - `audio_url` (text) - URL to recorded audio
    - `transcript` (text) - Full interview transcript
    - `questions` (jsonb) - Array of questions asked
    - `answers` (jsonb) - Array of answers given
    - `credibility_score` (integer) - AI-generated credibility score (0-100)
    - `sentiment_score` (integer) - AI-generated sentiment score (0-100)
    - `analysis` (jsonb) - Detailed AI analysis results
    - `duration` (integer) - Interview duration in seconds
    - `completed_at` (timestamptz) - Interview completion timestamp
    - `created_at` (timestamptz) - Interview creation timestamp

  ### 4. `emotion_analysis` - Real-time emotion detection results
    - `id` (uuid, primary key) - Unique analysis identifier
    - `interview_id` (uuid, foreign key) - Reference to interviews table
    - `timestamp` (integer) - Timestamp in video (milliseconds)
    - `emotion` (text) - Detected emotion: 'neutral', 'happy', 'sad', 'angry', 'fear'
    - `confidence` (numeric) - Detection confidence (0-1)
    - `facial_features` (jsonb) - Facial feature data
    - `created_at` (timestamptz) - Analysis creation timestamp

  ### 5. `documents` - Uploaded documents for verification
    - `id` (uuid, primary key) - Unique document identifier
    - `application_id` (uuid, foreign key) - Reference to applications table
    - `document_type` (text) - Type: 'passport', 'id_card', 'visa', 'other'
    - `file_url` (text) - URL to uploaded document
    - `file_name` (text) - Original file name
    - `file_size` (integer) - File size in bytes
    - `uploaded_at` (timestamptz) - Upload timestamp

  ### 6. `ocr_results` - OCR extraction and verification results
    - `id` (uuid, primary key) - Unique OCR result identifier
    - `document_id` (uuid, foreign key) - Reference to documents table
    - `extracted_text` (text) - Full extracted text
    - `extracted_fields` (jsonb) - Structured extracted data (name, DOB, etc.)
    - `validation_status` (text) - Status: 'pending', 'valid', 'invalid', 'suspicious'
    - `match_score` (integer) - Match accuracy score (0-100)
    - `discrepancies` (jsonb) - List of detected discrepancies
    - `tampering_detected` (boolean) - Whether tampering was detected
    - `processed_at` (timestamptz) - Processing timestamp
    - `created_at` (timestamptz) - Creation timestamp

  ### 7. `background_checks` - Background verification results
    - `id` (uuid, primary key) - Unique check identifier
    - `application_id` (uuid, foreign key) - Reference to applications table
    - `check_type` (text) - Type of check performed
    - `status` (text) - Status: 'pending', 'completed', 'failed'
    - `results` (jsonb) - Structured check results
    - `watchlist_matches` (jsonb) - Watchlist match results
    - `identity_validation` (jsonb) - Identity validation results
    - `duplicate_checks` (jsonb) - Duplicate detection results
    - `risk_indicators` (jsonb) - List of risk indicators found
    - `score` (integer) - Background check score (0-100)
    - `completed_at` (timestamptz) - Completion timestamp
    - `created_at` (timestamptz) - Creation timestamp

  ### 8. `risk_assessments` - Comprehensive risk scoring
    - `id` (uuid, primary key) - Unique assessment identifier
    - `application_id` (uuid, foreign key) - Reference to applications table
    - `interview_score` (integer) - Score from interview (0-100)
    - `emotion_score` (integer) - Score from emotion analysis (0-100)
    - `ocr_score` (integer) - Score from document verification (0-100)
    - `background_score` (integer) - Score from background check (0-100)
    - `final_score` (integer) - Combined final risk score (0-100)
    - `risk_level` (text) - Final risk level: 'LOW', 'MEDIUM', 'HIGH'
    - `weights` (jsonb) - Weights used for score calculation
    - `detailed_report` (jsonb) - Comprehensive report data
    - `created_at` (timestamptz) - Assessment creation timestamp

  ### 9. `audit_logs` - System audit trail
    - `id` (uuid, primary key) - Unique log identifier
    - `user_id` (uuid) - User who performed action
    - `action` (text) - Action performed
    - `entity_type` (text) - Entity affected
    - `entity_id` (uuid) - ID of affected entity
    - `details` (jsonb) - Additional details
    - `ip_address` (text) - User IP address
    - `created_at` (timestamptz) - Log creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies restrict access based on user role and ownership
  - Admins have full access, applicants only access their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'applicant' CHECK (role IN ('applicant', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved', 'rejected')),
  risk_score integer CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level text CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  video_url text,
  audio_url text,
  transcript text,
  questions jsonb DEFAULT '[]',
  answers jsonb DEFAULT '[]',
  credibility_score integer CHECK (credibility_score >= 0 AND credibility_score <= 100),
  sentiment_score integer CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
  analysis jsonb DEFAULT '{}',
  duration integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create emotion_analysis table
CREATE TABLE IF NOT EXISTS emotion_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  timestamp integer NOT NULL,
  emotion text NOT NULL CHECK (emotion IN ('neutral', 'happy', 'sad', 'angry', 'fear', 'surprise', 'disgust')),
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  facial_features jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('passport', 'id_card', 'visa', 'other')),
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Create ocr_results table
CREATE TABLE IF NOT EXISTS ocr_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  extracted_text text,
  extracted_fields jsonb DEFAULT '{}',
  validation_status text DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'suspicious')),
  match_score integer CHECK (match_score >= 0 AND match_score <= 100),
  discrepancies jsonb DEFAULT '[]',
  tampering_detected boolean DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create background_checks table
CREATE TABLE IF NOT EXISTS background_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  check_type text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  results jsonb DEFAULT '{}',
  watchlist_matches jsonb DEFAULT '[]',
  identity_validation jsonb DEFAULT '{}',
  duplicate_checks jsonb DEFAULT '[]',
  risk_indicators jsonb DEFAULT '[]',
  score integer CHECK (score >= 0 AND score <= 100),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create risk_assessments table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  interview_score integer CHECK (interview_score >= 0 AND interview_score <= 100),
  emotion_score integer CHECK (emotion_score >= 0 AND emotion_score <= 100),
  ocr_score integer CHECK (ocr_score >= 0 AND ocr_score <= 100),
  background_score integer CHECK (background_score >= 0 AND background_score <= 100),
  final_score integer CHECK (final_score >= 0 AND final_score <= 100),
  risk_level text CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  weights jsonb DEFAULT '{"interview": 0.3, "emotion": 0.2, "ocr": 0.25, "background": 0.25}',
  detailed_report jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_emotion_analysis_interview_id ON emotion_analysis(interview_id);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_ocr_results_document_id ON ocr_results(document_id);
CREATE INDEX IF NOT EXISTS idx_background_checks_application_id ON background_checks(application_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_application_id ON risk_assessments(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for applications table
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can create own applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for interviews table
CREATE POLICY "Users can view related interviews"
  ON interviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = interviews.application_id 
      AND (applications.user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Users can insert own interviews"
  ON interviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = interviews.application_id 
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own interviews"
  ON interviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = interviews.application_id 
      AND applications.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = interviews.application_id 
      AND applications.user_id = auth.uid()
    )
  );

-- RLS Policies for emotion_analysis table
CREATE POLICY "Users can view related emotion analysis"
  ON emotion_analysis FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interviews 
      JOIN applications ON applications.id = interviews.application_id
      WHERE interviews.id = emotion_analysis.interview_id
      AND (applications.user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Users can insert emotion analysis"
  ON emotion_analysis FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews 
      JOIN applications ON applications.id = interviews.application_id
      WHERE interviews.id = emotion_analysis.interview_id
      AND applications.user_id = auth.uid()
    )
  );

-- RLS Policies for documents table
CREATE POLICY "Users can view related documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = documents.application_id 
      AND (applications.user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = documents.application_id 
      AND applications.user_id = auth.uid()
    )
  );

-- RLS Policies for ocr_results table
CREATE POLICY "Users can view related OCR results"
  ON ocr_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents 
      JOIN applications ON applications.id = documents.application_id
      WHERE documents.id = ocr_results.document_id
      AND (applications.user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "System can insert OCR results"
  ON ocr_results FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for background_checks table
CREATE POLICY "Users can view related background checks"
  ON background_checks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = background_checks.application_id 
      AND (applications.user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "System can insert background checks"
  ON background_checks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update background checks"
  ON background_checks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for risk_assessments table
CREATE POLICY "Users can view related risk assessments"
  ON risk_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = risk_assessments.application_id 
      AND (applications.user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "System can insert risk assessments"
  ON risk_assessments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for audit_logs table
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = '';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();