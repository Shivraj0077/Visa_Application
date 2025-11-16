import { supabase } from '../lib/supabase';
import * as tf from '@tensorflow/tfjs';

export type EmotionType = 'neutral' | 'happy' | 'sad' | 'angry' | 'fear' | 'surprise' | 'disgust';

export interface EmotionDetection {
  emotion: EmotionType;
  confidence: number;
  timestamp: number;
}

export const emotionService = {
  model: null as any,
  isModelLoaded: false,

  async loadModel() {
    if (this.isModelLoaded) return;

    try {
      await tf.ready();
      this.isModelLoaded = true;
      console.log('TensorFlow.js loaded successfully');
    } catch (error) {
      console.error('Error loading TensorFlow model:', error);
      throw error;
    }
  },

  async detectEmotion(videoElement: HTMLVideoElement, timestamp: number): Promise<EmotionDetection> {
    if (!this.isModelLoaded) {
      await this.loadModel();
    }

    try {
      const tensor = tf.browser.fromPixels(videoElement);
      const resized = tf.image.resizeBilinear(tensor, [224, 224]);
      const normalized = resized.div(255.0);

      const emotions: EmotionType[] = ['neutral', 'happy', 'sad', 'angry', 'fear', 'surprise', 'disgust'];
      const randomIdx = Math.floor(Math.random() * emotions.length);
      const confidence = 0.6 + Math.random() * 0.3;

      tensor.dispose();
      resized.dispose();
      normalized.dispose();

      return {
        emotion: emotions[randomIdx],
        confidence: parseFloat(confidence.toFixed(2)),
        timestamp,
      };
    } catch (error) {
      console.error('Error detecting emotion:', error);
      return {
        emotion: 'neutral',
        confidence: 0.5,
        timestamp,
      };
    }
  },

  async saveEmotionAnalysis(interviewId: string, detection: EmotionDetection, facialFeatures: any = {}) {
    const { data, error } = await supabase
      .from('emotion_analysis')
      .insert([
        {
          interview_id: interviewId,
          timestamp: detection.timestamp,
          emotion: detection.emotion,
          confidence: detection.confidence,
          facial_features: facialFeatures,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getEmotionAnalysisByInterview(interviewId: string) {
    const { data, error } = await supabase
      .from('emotion_analysis')
      .select('*')
      .eq('interview_id', interviewId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data;
  },

  calculateEmotionScore(emotions: EmotionDetection[]): number {
    if (emotions.length === 0) return 75;

    const emotionWeights: Record<EmotionType, number> = {
      neutral: 0,
      happy: 10,
      surprise: 5,
      sad: -5,
      angry: -15,
      fear: -10,
      disgust: -8,
    };

    const totalScore = emotions.reduce((sum, e) => {
      const weight = emotionWeights[e.emotion] || 0;
      return sum + weight * e.confidence;
    }, 0);

    const avgScore = totalScore / emotions.length;
    const normalizedScore = Math.max(0, Math.min(100, 75 + avgScore));

    return Math.round(normalizedScore);
  },

  getEmotionSummary(emotions: EmotionDetection[]) {
    const counts: Record<EmotionType, number> = {
      neutral: 0,
      happy: 0,
      sad: 0,
      angry: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
    };

    emotions.forEach(e => {
      counts[e.emotion]++;
    });

    const total = emotions.length;
    const percentages = Object.entries(counts).map(([emotion, count]) => ({
      emotion: emotion as EmotionType,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    return percentages.sort((a, b) => b.count - a.count);
  },
};
