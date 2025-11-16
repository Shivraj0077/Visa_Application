import { useState, useRef, useEffect } from 'react';
import { Video, Mic, MicOff, VideoOff, StopCircle, Play } from 'lucide-react';
import { interviewService } from '../services/interviewService';
import { emotionService } from '../services/emotionService';

interface InterviewRoomProps {
  interviewId: string;
  applicationId: string;
  onComplete: () => void;
}

export function InterviewRoom({ interviewId, applicationId, onComplete }: InterviewRoomProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [transcript, setTranscript] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const emotionIntervalRef = useRef<number | null>(null);

  const questions = interviewService.getQuestions();

  useEffect(() => {
    startCamera();
    emotionService.loadModel();

    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
      if (emotionIntervalRef.current) clearInterval(emotionIntervalRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Please allow camera and microphone access to continue with the interview.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);
    setIsRecording(true);

    timerRef.current = window.setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    emotionIntervalRef.current = window.setInterval(() => {
      detectEmotion();
    }, 3000);
  };

  const detectEmotion = async () => {
    if (videoRef.current && isRecording) {
      try {
        const detection = await emotionService.detectEmotion(videoRef.current, duration * 1000);
        await emotionService.saveEmotionAnalysis(interviewId, detection);
      } catch (error) {
        console.error('Emotion detection error:', error);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
        emotionIntervalRef.current = null;
      }
    }
  };

  const handleAnswerSubmit = () => {
    if (!currentAnswer.trim()) return;

    const newAnswer = {
      question_id: currentQuestionIndex,
      question: questions[currentQuestionIndex],
      answer: currentAnswer,
      timestamp: duration,
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    const updatedTranscript = transcript + `\n\nQ: ${questions[currentQuestionIndex]}\nA: ${currentAnswer}`;
    setTranscript(updatedTranscript);

    interviewService.updateInterviewTranscript(interviewId, updatedTranscript, updatedAnswers);

    setCurrentAnswer('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    stopRecording();

    try {
      const recordedBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(recordedBlob);
      const audioUrl = videoUrl;

      await interviewService.completeInterview(interviewId, videoUrl, audioUrl, duration);

      onComplete();
    } catch (error) {
      console.error('Error completing interview:', error);
      alert('Failed to complete interview. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 bg-blue-600 text-white">
            <h1 className="text-2xl font-bold">AI Interview Session</h1>
            <p className="text-blue-100 mt-1">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 p-6">
            <div>
              <div className="bg-gray-900 rounded-xl overflow-hidden relative aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <VideoOff className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-black/50 px-3 py-2 rounded-lg">
                  <span className="text-white font-mono text-lg">{formatTime(duration)}</span>
                </div>
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 px-3 py-2 rounded-lg">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    <span className="text-white font-semibold">Recording</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-colors ${
                    isVideoEnabled
                      ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {isVideoEnabled ? (
                    <Video className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                  ) : (
                    <VideoOff className="w-6 h-6 text-white" />
                  )}
                </button>

                <button
                  onClick={toggleAudio}
                  className={`p-4 rounded-full transition-colors ${
                    isAudioEnabled
                      ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {isAudioEnabled ? (
                    <Mic className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                  ) : (
                    <MicOff className="w-6 h-6 text-white" />
                  )}
                </button>

                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="px-6 py-4 bg-green-500 hover:bg-green-600 rounded-full text-white font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Play className="w-6 h-6" />
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="px-6 py-4 bg-red-500 hover:bg-red-600 rounded-full text-white font-semibold flex items-center gap-2 transition-colors"
                  >
                    <StopCircle className="w-6 h-6" />
                    Stop Recording
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="bg-blue-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Current Question:</h3>
                <p className="text-lg text-gray-800 dark:text-gray-200">
                  {questions[currentQuestionIndex]}
                </p>
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Answer
                </label>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  placeholder="Type your answer here..."
                  rows={8}
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAnswerSubmit}
                    disabled={!currentAnswer.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Submit Answer'}
                  </button>

                  {currentQuestionIndex === questions.length - 1 && answers.length === questions.length - 1 && (
                    <button
                      onClick={handleComplete}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      {isProcessing ? 'Processing...' : 'Complete Interview'}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Answered: {answers.length} / {questions.length}
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(answers.length / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
