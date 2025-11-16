# Quick Setup Guide

## Step 1: Supabase Configuration

### 1.1 Get Supabase Credentials

1. Go to https://supabase.com and sign in
2. Create a new project (or use existing)
3. Go to **Settings** > **API**
4. Copy your:
   - Project URL
   - anon/public key

### 1.2 Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 1.3 Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **Create a new bucket**
3. Name it: `documents`
4. Make it **Public** (for demo purposes)
5. Click **Create bucket**

### 1.4 Set Storage Policies

In the Storage section, click on the `documents` bucket and set up policies:

**Policy for INSERT:**
```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');
```

**Policy for SELECT:**
```sql
CREATE POLICY "Allow public to view documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
```

## Step 2: Database Setup

The database schema is automatically created when you first run the application. The migration has already been applied with all necessary tables and policies.

### Verify Database Tables

In Supabase dashboard, go to **Database** > **Tables** and verify these tables exist:
- users
- applications
- interviews
- emotion_analysis
- documents
- ocr_results
- background_checks
- risk_assessments
- audit_logs

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run the Application

### Development Mode
```bash
npm run dev
```

Visit: http://localhost:5173

### Production Build
```bash
npm run build
npm run preview
```

## Step 5: Create Test Accounts

### Create Admin Account
1. Click "Sign Up"
2. Fill in details
3. Select "Administrator" as account type
4. Click "Create Account"

### Create Applicant Account
1. Click "Sign Up"
2. Fill in details
3. Select "Applicant" as account type
4. Click "Create Account"

## Step 6: Test the System

### As Applicant:
1. Create a new application
2. Start the AI interview
3. Allow camera/microphone access
4. Answer questions and complete interview
5. Upload documents (passport, ID, or visa)
6. View your risk assessment results

### As Admin:
1. View all applications on dashboard
2. Click "View" on any application
3. Review interview, documents, and scores
4. Approve or reject the application
5. Download PDF report

## Troubleshooting

### Camera/Microphone Not Working
- Use Chrome or Edge browser
- Ensure you're on localhost or HTTPS
- Allow permissions when prompted

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Connection Issues
- Verify `.env` file has correct credentials
- Check Supabase project is active
- Ensure RLS policies are configured

### Storage Upload Issues
- Verify `documents` bucket exists
- Check storage policies are set
- Ensure bucket is public

## Production Deployment

### Recommended Platforms
- **Vercel**: Automatic deployment from Git
- **Netlify**: Simple drag-and-drop deployment
- **AWS Amplify**: Full-featured hosting

### Environment Variables
Make sure to set these in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Build Command
```bash
npm run build
```

### Output Directory
```
dist/
```

## Security Checklist

- [ ] Change default admin credentials
- [ ] Enable email verification in production
- [ ] Use strong passwords
- [ ] Review and test RLS policies
- [ ] Enable Supabase Auth rate limiting
- [ ] Configure CORS properly
- [ ] Use HTTPS in production
- [ ] Regular security audits

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Supabase configuration
3. Review the README.md for detailed documentation
4. Check that all npm packages are installed correctly

## Next Steps

- Customize interview questions in `src/services/interviewService.ts`
- Add custom watchlist entries in `src/services/backgroundCheckService.ts`
- Modify risk scoring weights in `src/services/riskScoringService.ts`
- Customize UI colors and branding in Tailwind config
- Add more document types as needed
- Integrate real AI/ML models for production use
