import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { applicationService } from '../services/applicationService';
import {
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Eye,
  LogOut,
  Moon,
  Sun,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';

export function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await applicationService.getAllApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewApplication = async (applicationId: string) => {
    try {
      const data = await applicationService.getApplicationById(applicationId);
      setSelectedApplication(data);
    } catch (error) {
      console.error('Error loading application:', error);
    }
  };

  const updateApplicationStatus = async (
    applicationId: string,
    status: 'approved' | 'rejected',
    notes: string
  ) => {
    try {
      await applicationService.updateApplicationStatus(applicationId, status, notes, user!.id);
      await loadApplications();
      if (selectedApplication?.id === applicationId) {
        await viewApplication(applicationId);
      }
      alert(`Application ${status} successfully`);
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application');
    }
  };

  const downloadReport = (application: any) => {
    const doc = new jsPDF();
    const riskAssessment = application.risk_assessments?.[0];

    doc.setFontSize(20);
    doc.text('Verification Report', 20, 20);

    doc.setFontSize(12);
    doc.text(`Applicant: ${application.users.full_name}`, 20, 35);
    doc.text(`Email: ${application.users.email}`, 20, 42);
    doc.text(`Position: ${application.position}`, 20, 49);
    doc.text(`Application Date: ${new Date(application.created_at).toLocaleDateString()}`, 20, 56);

    doc.setFontSize(16);
    doc.text('Risk Assessment', 20, 70);

    doc.setFontSize(12);
    doc.text(`Risk Level: ${application.risk_level || 'N/A'}`, 20, 80);
    doc.text(`Final Score: ${application.risk_score || 'N/A'}/100`, 20, 87);

    if (riskAssessment) {
      doc.text(`Interview Score: ${riskAssessment.interview_score}`, 20, 100);
      doc.text(`Emotion Score: ${riskAssessment.emotion_score}`, 20, 107);
      doc.text(`Document Score: ${riskAssessment.ocr_score}`, 20, 114);
      doc.text(`Background Score: ${riskAssessment.background_score}`, 20, 121);
    }

    doc.setFontSize(16);
    doc.text('Decision', 20, 135);

    doc.setFontSize(12);
    doc.text(`Status: ${application.status.toUpperCase()}`, 20, 145);

    if (application.admin_notes) {
      doc.text('Admin Notes:', 20, 155);
      const splitNotes = doc.splitTextToSize(application.admin_notes, 170);
      doc.text(splitNotes, 20, 162);
    }

    doc.save(`verification_report_${application.id}.pdf`);
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending' || a.status === 'in_progress').length,
    completed: applications.filter(a => a.status === 'completed').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (selectedApplication) {
    const riskAssessment = selectedApplication.risk_assessments?.[0];
    const interview = selectedApplication.interviews?.[0];
    const documents = selectedApplication.documents || [];
    const backgroundCheck = selectedApplication.background_checks?.[0];

    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setSelectedApplication(null)}
            className="mb-6 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
          >
            ← Back to Dashboard
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Application Review
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedApplication.users.full_name} - {selectedApplication.position}
                </p>
              </div>
              <button
                onClick={() => downloadReport(selectedApplication)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-8">
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
                <p className={`text-2xl font-bold ${
                  selectedApplication.risk_level === 'LOW'
                    ? 'text-green-600 dark:text-green-400'
                    : selectedApplication.risk_level === 'MEDIUM'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {selectedApplication.risk_level || 'N/A'}
                </p>
              </div>

              <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Final Score
                </h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {selectedApplication.risk_score || 'N/A'}/100
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Status
                </h3>
                <p className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                  {selectedApplication.status}
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Applied
                </h3>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {new Date(selectedApplication.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {riskAssessment && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Detailed Scores
                </h2>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Interview Score
                    </h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {riskAssessment.interview_score}/100
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Emotion Score
                    </h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {riskAssessment.emotion_score}/100
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Document Score
                    </h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {riskAssessment.ocr_score}/100
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Background Score
                    </h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {riskAssessment.background_score}/100
                    </p>
                  </div>
                </div>
              </div>
            )}

            {interview && (
              <div className="mb-8 bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Interview Analysis
                </h2>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Credibility Score</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {interview.credibility_score}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sentiment Score</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {interview.sentiment_score}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {Math.floor(interview.duration / 60)}m {interview.duration % 60}s
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Questions Answered</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {interview.answers?.length || 0}
                    </p>
                  </div>
                </div>
                {interview.video_url && (
                  <div className="mt-4">
                    <video
                      src={interview.video_url}
                      controls
                      className="w-full max-w-2xl rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {documents.length > 0 && (
              <div className="mb-8 bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Documents Submitted
                </h2>
                <div className="space-y-3">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white capitalize">
                            {doc.document_type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {doc.file_name}
                          </p>
                        </div>
                        {doc.ocr_results?.[0] && (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            doc.ocr_results[0].validation_status === 'valid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                              : doc.ocr_results[0].validation_status === 'suspicious'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                          }`}>
                            {doc.ocr_results[0].validation_status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {backgroundCheck && (
              <div className="mb-8 bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Background Check Results
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {backgroundCheck.score}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Watchlist Matches</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {backgroundCheck.watchlist_matches?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Risk Indicators</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {backgroundCheck.risk_indicators?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                      {backgroundCheck.status}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedApplication.status === 'completed' && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Make Decision
                </h2>
                <div className="space-y-4">
                  <textarea
                    id="admin-notes"
                    placeholder="Add notes about your decision..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    rows={4}
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        const notes = (document.getElementById('admin-notes') as HTMLTextAreaElement)?.value || '';
                        updateApplicationStatus(selectedApplication.id, 'approved', notes);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve Application
                    </button>
                    <button
                      onClick={() => {
                        const notes = (document.getElementById('admin-notes') as HTMLTextAreaElement)?.value || '';
                        updateApplicationStatus(selectedApplication.id, 'rejected', notes);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Application
                    </button>
                  </div>
                </div>
              </div>
            )}
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
              Admin Dashboard
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
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Approved</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.approved}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.rejected}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Applications</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Applicant
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Position
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Risk Score
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr
                      key={app.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {app.users.full_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {app.users.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-900 dark:text-white">
                        {app.position}
                      </td>
                      <td className="py-4 px-4">
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
                      </td>
                      <td className="py-4 px-4 text-gray-900 dark:text-white font-semibold">
                        {app.risk_score ? `${app.risk_score}/100` : 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-gray-900 dark:text-white">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => viewApplication(app.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
