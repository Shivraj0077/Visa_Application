import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { ocrService } from '../services/ocrService';

interface DocumentUploadProps {
  applicationId: string;
  onUploadComplete: () => void;
}

export function DocumentUpload({ applicationId, onUploadComplete }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<'passport' | 'id_card' | 'visa'>('passport');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const [expectedName, setExpectedName] = useState('');
  const [expectedDOB, setExpectedDOB] = useState('');
  const [expectedNationality, setExpectedNationality] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    try {
      const document = await ocrService.uploadDocument(applicationId, selectedFile, documentType);

      setUploading(false);
      setProcessing(true);

      const expectedData = {
        name: expectedName,
        dateOfBirth: expectedDOB,
        nationality: expectedNationality,
      };

      const ocrResult = await ocrService.processDocument(selectedFile, document.id, expectedData);

      setResult(ocrResult);
      setProcessing(false);

      setTimeout(() => {
        onUploadComplete();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload and process document');
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Document Upload & Verification
      </h2>

      {!result && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="passport">Passport</option>
              <option value="id_card">Identity Card</option>
              <option value="visa">Visa</option>
            </select>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expected Name
              </label>
              <input
                type="text"
                value={expectedName}
                onChange={(e) => setExpectedName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth
              </label>
              <input
                type="text"
                value={expectedDOB}
                onChange={(e) => setExpectedDOB(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="01/01/1990"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nationality
              </label>
              <input
                type="text"
                value={expectedNationality}
                onChange={(e) => setExpectedNationality(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="American"
              />
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
            {selectedFile ? (
              <div className="space-y-4">
                <FileText className="w-16 h-16 text-blue-600 mx-auto" />
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-semibold">
                    Click to upload
                  </span>
                  <span className="text-gray-600 dark:text-gray-400"> or drag and drop</span>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  PNG, JPG, PDF up to 10MB
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading || processing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {uploading || processing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                {uploading ? 'Uploading...' : 'Processing with OCR...'}
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload & Verify Document
              </>
            )}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className={`p-6 rounded-xl ${
            result.validation_status === 'valid'
              ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800'
              : result.validation_status === 'suspicious'
              ? 'bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800'
              : 'bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {result.validation_status === 'valid' ? (
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Verification {result.validation_status === 'valid' ? 'Successful' : 'Failed'}
                </h3>
                <p className={`text-sm ${
                  result.validation_status === 'valid'
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  Match Score: {result.match_score}%
                </p>
              </div>
            </div>

            {result.extracted_fields && Object.keys(result.extracted_fields).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Extracted Information:</h4>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(result.extracted_fields).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </dt>
                      <dd className="font-semibold text-gray-900 dark:text-white">{value as string}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {result.discrepancies && result.discrepancies.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Discrepancies Found:</h4>
                <ul className="space-y-2 text-sm">
                  {result.discrepancies.map((d: any, i: number) => (
                    <li key={i} className="text-red-600 dark:text-red-400">
                      {d.field}: {d.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.tampering_detected && (
              <div className="bg-red-100 dark:bg-red-900/50 rounded-lg p-4 mt-4">
                <p className="text-red-800 dark:text-red-200 font-semibold">
                  ⚠️ Possible document tampering detected
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setResult(null);
              setSelectedFile(null);
              setExpectedName('');
              setExpectedDOB('');
              setExpectedNationality('');
            }}
            className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Upload Another Document
          </button>
        </div>
      )}
    </div>
  );
}
