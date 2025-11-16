import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { applicationService } from '../services/applicationService';
import { interviewService } from '../services/interviewService';
import { riskScoringService } from '../services/riskScoringService';
import { backgroundCheckService } from '../services/backgroundCheckService';
import { InterviewRoom } from './InterviewRoom';
import { DocumentUpload } from './DocumentUpload';
import {
  FileText,
  Video,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ApplicantDashboard() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'list' | 'interview' | 'documents' | 'results'>('list');
  const [loading, setLoading] = useState(true);
  const [creatingApplication, setCreatingApplication] = useState(false);
  const [newPosition, setNewPosition] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await applicationService.getApplicationsByUser(user!.id);
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApplication = async () => {
    if (!newPosition.trim()) return;

    setCreatingApplication(true);
    try {
      const application = await applicationService.createApplication(user!.id, newPosition);
      await loadApplications();
      setNewPosition('');
      setSelectedApplication(application);
    } catch (error) {
      console.error('Error creating application:', error);
      alert('Failed to create application');
    } finally {
      setCreatingApplication(false);
    }
  };

  const startInterview = async (application: any) => {
    try {
      let interview = await interviewService.getInterviewByApplication(application.id);

      if (!interview) {
        interview = await interviewService.createInterview(application.id);
        await applicationService.updateApplication(application.id, { status: 'in_progress' });
      }

      setSelectedApplication({ ...application, interview });
      setCurrentView('interview');
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview');
    }
  };

  const handleInterviewComplete = async () => {
    setCurrentView('documents');
    await loadApplications();
  };

  const handleDocumentsComplete = async () => {
    try {
      await backgroundCheckService.performBackgroundCheck(selectedApplication.id, {
        name: user!.full_name,
        email: user!.email,
      });

      await riskScoringService.calculateRiskScore(selectedApplication.id);

      await loadApplications();
      setCurrentView('results');
    } catch (error) {
      console.error('Error completing verification:', error);
    }
  };

  const viewResults = async (application: any) => {
    const fullApplication = await applicationService.getApplicationById(application.id);
    setSelectedApplication(fullApplication);
    setCurrentView('results');
  };

  if (currentView === 'interview' && selectedApplication) {
    return (
      <InterviewRoom
        interviewId={selectedApplication.interview.id}
        applicationId={selectedApplication.id}
        onComplete={handleInterviewComplete}
      />
    );
  }

  if (currentView === 'documents' && selectedApplication) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              setCurrentView('list');
              setSelectedApplication(null);
            }}
            className="mb-6 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
          >
            ← Back to Dashboard
          </button>
          <DocumentUpload
            applicationId={selectedApplication.id}
            onUploadComplete={handleDocumentsComplete}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'results' && selectedApplication) {
    const riskAssessment = selectedApplication.risk_assessments?.[0];

    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => {
              setCurrentView('list');
              setSelectedApplication(null);
            }}
            className="mb-6 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
          >
            ← Back to Dashboard
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Verification Results
            </h1>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className={`p-6 rounded-xl ${
                selectedApplication.risk_level === 'LOW'
                  ? 'bg-green-50 dark:bg-green-900/30'
                  : selectedApplication.risk_level === 'MEDIUM'
                  ? 'bg-yellow-50 dark:bg-yellow-900/30'
                  : 'bg-red-50 dark:bg-red-900/30'
              }`}>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Risk Level
                </h3>
                <p className={`text-3xl font-bold ${
                  selectedApplication.risk_level === 'LOW'
                    ? 'text-green-600 dark:text-green-400'
                    : selectedApplication.risk_level === 'MEDIUM'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {selectedApplication.risk_level}
                </p>
              </div>

              <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Final Score
                </h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {selectedApplication.risk_score}/100
                </p>
              </div>
            </div>

            {riskAssessment && (
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Interview
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {riskAssessment.interview_score}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Emotion
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {riskAssessment.emotion_score}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Documents
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {riskAssessment.ocr_score}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Background
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {riskAssessment.background_score}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Application Status
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Current Status:</span>
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  selectedApplication.status === 'approved'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                    : selectedApplication.status === 'rejected'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                }`}>
                  {selectedApplication.status.toUpperCase()}
                </span>
              </div>

              {riskAssessment?.detailed_report?.summary?.recommendation && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {riskAssessment.detailed_report.summary.recommendation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Applicant Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                )}
              </button>
              <span className="text-gray-700 dark:text-gray-300">{user?.full_name}</span>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Create New Application
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              placeholder="Enter position (e.g., Software Engineer)"
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={createApplication}
              disabled={creatingApplication || !newPosition.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
            >
              {creatingApplication ? 'Creating...' : 'Create Application'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Applications Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create your first application to get started with the verification process.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {app.position}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    app.status === 'approved'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                      : app.status === 'rejected'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                      : app.status === 'completed'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                  }`}>
                    {app.status}
                  </span>
                </div>

                {app.risk_score !== null && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Risk Score</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {app.risk_score}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          app.risk_score >= 70
                            ? 'bg-green-500'
                            : app.risk_score >= 40
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${app.risk_score}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {app.status === 'pending' && (
                    <button
                      onClick={() => startInterview(app)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      <Video className="w-4 h-4" />
                      Start Interview
                    </button>
                  )}

                  {app.status === 'in_progress' && (
                    <button
                      onClick={() => {
                        setSelectedApplication(app);
                        setCurrentView('documents');
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Upload Documents
                    </button>
                  )}

                  {app.status === 'completed' && (
                    <button
                      onClick={() => viewResults(app)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      <TrendingUp className="w-4 h-4" />
                      View Results
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
