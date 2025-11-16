import { supabase } from '../lib/supabase';
import type { Interview } from '../lib/supabase';

const INTERVIEW_QUESTIONS = [
  'Can you tell me about yourself and your background?',
  'Why are you interested in this position?',
  'What are your key strengths and how do they relate to this role?',
  'Describe a challenging situation you faced and how you handled it.',
  'Where do you see yourself in five years?',
  'Why should we consider you for this position?',
];

export const interviewService = {
  async createInterview(applicationId: string) {
    const { data, error } = await supabase
      .from('interviews')
      .insert([
        {
          application_id: applicationId,
          questions: INTERVIEW_QUESTIONS.map((q, idx) => ({ id: idx, question: q, asked_at: null })),
          answers: [],
          analysis: {},
          duration: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getInterviewByApplication(applicationId: string) {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('application_id', applicationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateInterviewTranscript(interviewId: string, transcript: string, answers: any[]) {
    const { data, error } = await supabase
      .from('interviews')
      .update({
        transcript,
        answers,
      })
      .eq('id', interviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async completeInterview(interviewId: string, videoUrl: string, audioUrl: string, duration: number) {
    const interview = await this.getInterviewById(interviewId);
    if (!interview) throw new Error('Interview not found');

    const { credibilityScore, sentimentScore, analysis } = this.analyzeInterview(
      interview.transcript || '',
      interview.answers
    );

    const { data, error } = await supabase
      .from('interviews')
      .update({
        video_url: videoUrl,
        audio_url: audioUrl,
        duration,
        credibility_score: credibilityScore,
        sentiment_score: sentimentScore,
        analysis,
        completed_at: new Date().toISOString(),
      })
      .eq('id', interviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getInterviewById(interviewId: string) {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  analyzeInterview(transcript: string, answers: any[]) {
    const wordCount = transcript.split(' ').length;
    const avgAnswerLength = answers.length > 0
      ? answers.reduce((sum, a) => sum + (a.answer?.length || 0), 0) / answers.length
      : 0;

    const positiveWords = ['excellent', 'great', 'good', 'passionate', 'dedicated', 'skilled', 'experienced'];
    const negativeWords = ['difficult', 'problem', 'issue', 'challenge', 'struggle'];
    const uncertainWords = ['maybe', 'perhaps', 'might', 'unsure', 'don\'t know'];

    const lowerTranscript = transcript.toLowerCase();
    const positiveCount = positiveWords.filter(w => lowerTranscript.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerTranscript.includes(w)).length;
    const uncertainCount = uncertainWords.filter(w => lowerTranscript.includes(w)).length;

    const credibilityScore = Math.min(
      100,
      Math.max(
        0,
        70 +
          (avgAnswerLength > 50 ? 10 : 0) +
          (positiveCount * 3) -
          (uncertainCount * 5) -
          (answers.length < INTERVIEW_QUESTIONS.length ? 10 : 0)
      )
    );

    const sentimentScore = Math.min(
      100,
      Math.max(0, 50 + positiveCount * 8 - negativeCount * 5 - uncertainCount * 3)
    );

    const analysis = {
      word_count: wordCount,
      avg_answer_length: Math.round(avgAnswerLength),
      positive_indicators: positiveCount,
      negative_indicators: negativeCount,
      uncertainty_indicators: uncertainCount,
      questions_answered: answers.length,
      total_questions: INTERVIEW_QUESTIONS.length,
      completion_rate: Math.round((answers.length / INTERVIEW_QUESTIONS.length) * 100),
    };

    return { credibilityScore, sentimentScore, analysis };
  },

  getQuestions() {
    return INTERVIEW_QUESTIONS;
  },
};
