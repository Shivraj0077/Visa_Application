# AI-Driven Interview & Background Verification System

A comprehensive, production-ready web application for conducting AI-powered interviews, background checks, document verification, and risk assessment for applicants.

## Features

### Authentication System
- JWT-based authentication
- Role-based access control (Applicant/Admin)
- Secure password hashing
- Session management

### Applicant Features
- **Application Management**: Create and track multiple applications
- **AI-Driven Interview**:
  - WebRTC-based video/audio recording
  - Real-time interview with predefined questions
  - Automatic transcript generation
  - AI analysis of credibility and sentiment
- **Emotion Detection**:
  - TensorFlow.js-powered facial emotion recognition
  - Real-time emotion tracking during interviews
  - Comprehensive emotion analysis reports
- **Document Verification**:
  - Upload passport, ID card, or visa documents
  - OCR text extraction using Tesseract.js
  - Automatic field validation and matching
  - Tampering detection
- **Risk Assessment Dashboard**:
  - View comprehensive risk scores
  - Detailed breakdown of all verification stages
  - Real-time application status tracking

### Admin Features
- **Comprehensive Dashboard**:
  - Overview of all applications
  - Statistical insights
  - Filter by application status
- **Application Review**:
  - Detailed view of applicant data
  - Interview playback and transcript review
  - Document verification results
  - Background check reports
  - Emotion analysis summary
- **Decision Making**:
  - Approve or reject applications
  - Add administrative notes
  - Download PDF reports

### Core Services

#### 1. Interview Service
- Manages interview sessions
- Analyzes interview responses using NLP techniques
- Calculates credibility and sentiment scores
- Stores interview recordings and transcripts

#### 2. Emotion Detection Service
- Real-time facial emotion recognition
- Supports: neutral, happy, sad, angry, fear, surprise, disgust
- Calculates emotion-based risk scores
- Provides detailed emotion summaries

#### 3. OCR Service
- Document text extraction using Tesseract.js
- Field validation (name, DOB, nationality, etc.)
- Match score calculation
- Tampering detection
- Document storage and management

#### 4. Background Check Service
- Watchlist screening (simulated with mock data)
- Identity validation
- Duplicate detection
- Risk indicator identification
- Comprehensive background scoring

#### 5. Risk Scoring Service
- Weighted score calculation from all verification stages
- Risk level determination (LOW/MEDIUM/HIGH)
- Detailed report generation
- Identifies strengths and risk factors

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router DOM** for navigation
- **Lucide React** for icons
- **TensorFlow.js** for emotion detection
- **Tesseract.js** for OCR
- **jsPDF** for PDF report generation

### Backend/Services
- **Supabase** for database and storage
- **WebRTC** for video/audio capture
- Custom service layer for all business logic

### Database (Supabase PostgreSQL)
- Users
- Applications
- Interviews
- Emotion Analysis
- Documents
- OCR Results
- Background Checks
- Risk Assessments
- Audit Logs

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Environment Setup

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Set up Supabase:
   - The database schema has been automatically created via migrations
   - Create a storage bucket named `documents` for file uploads
   - Enable Row Level Security on all tables (already configured)

### Running the Application

#### Development Mode
```bash
npm run dev
```

The application will start at `http://localhost:5173`

#### Build for Production
```bash
npm run build
```

#### Preview Production Build
```bash
npm run preview
```

## Usage Guide

### For Applicants

1. **Sign Up**: Create an applicant account
2. **Create Application**: Enter the position you're applying for
3. **Complete Interview**:
   - Allow camera and microphone access
   - Start recording
   - Answer all interview questions
   - Complete the interview session
4. **Upload Documents**:
   - Upload passport, ID, or visa
   - Enter expected information for verification
   - Wait for OCR processing
5. **View Results**: Check your risk assessment and application status

### For Administrators

1. **Sign Up**: Create an admin account
2. **Dashboard Overview**: View statistics and all applications
3. **Review Applications**:
   - Click "View" on any application
   - Watch interview recordings
   - Review emotion analysis
   - Check document verification results
   - Review background check reports
4. **Make Decisions**:
   - Add administrative notes
   - Approve or reject applications
   - Download comprehensive PDF reports

## API Architecture

The application uses a service-based architecture with the following main services:

- `authService`: User authentication and session management
- `applicationService`: Application CRUD and status management
- `interviewService`: Interview session and analysis
- `emotionService`: Real-time emotion detection and scoring
- `ocrService`: Document upload, OCR processing, and validation
- `backgroundCheckService`: Background verification and screening
- `riskScoringService`: Comprehensive risk assessment

## Security Features

- JWT-based authentication
- Row Level Security (RLS) policies on all database tables
- Secure password hashing
- Input validation and sanitization
- CORS configuration
- Audit logging for all critical actions
- Role-based access control

## Database Schema

The system uses a comprehensive PostgreSQL database with:
- 9 main tables
- Foreign key relationships for data integrity
- Indexes for optimal query performance
- Row Level Security for data protection
- Automatic timestamp tracking
- JSONB fields for flexible data storage

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Note**: WebRTC features require HTTPS in production or localhost in development.

## Development Notes

### Mock Data
- Background check service uses simulated watchlist data
- Emotion detection includes mock model for demonstration
- All services are designed to be easily replaced with real APIs

### Extensibility
- Service-based architecture allows easy feature addition
- Type-safe TypeScript implementation
- Modular component structure
- Clear separation of concerns

## Troubleshooting

### Camera/Microphone Access Issues
- Ensure you're using HTTPS or localhost
- Check browser permissions
- Allow access when prompted

### OCR Processing Slow
- Large images may take longer to process
- Compress images before upload for better performance

### Dark Mode Not Working
- Clear browser cache
- Check localStorage for theme setting

## Future Enhancements

- Real AI/ML models for interview analysis
- Integration with actual watchlist databases
- Multi-language support
- Video quality optimization
- Real-time collaboration features
- Advanced analytics dashboard
- Email notifications
- SMS verification
- Biometric authentication

## License

This is a demonstration project for educational purposes.

## Support

For issues or questions, please refer to the code documentation or create an issue in the repository.
