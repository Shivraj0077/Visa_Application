import { supabase } from '../lib/supabase';
import { interviewService } from './interviewService';
import { emotionService } from './emotionService';
import { ocrService } from './ocrService';
import { backgroundCheckService } from './backgroundCheckService';

const DEFAULT_WEIGHTS = {
  interview: 0.3,
  emotion: 0.2,
  ocr: 0.25,
  background: 0.25,
};

export const riskScoringService = {
  async calculateRiskScore(applicationId: string) {
    const interview = await interviewService.getInterviewByApplication(applicationId);
    const emotions = interview ? await emotionService.getEmotionAnalysisByInterview(interview.id) : [];
    const documents = await ocrService.getDocumentsByApplication(applicationId);
    const backgroundCheck = await backgroundCheckService.getBackgroundCheckByApplication(applicationId);

    const interviewScore = this.calculateInterviewScore(interview);
    const emotionScore = emotionService.calculateEmotionScore(emotions);
    const ocrScore = this.calculateOCRScore(documents);
    const backgroundScore = backgroundCheck?.score || 50;

    const finalScore = Math.round(
      interviewScore * DEFAULT_WEIGHTS.interview +
        emotionScore * DEFAULT_WEIGHTS.emotion +
        ocrScore * DEFAULT_WEIGHTS.ocr +
        backgroundScore * DEFAULT_WEIGHTS.background
    );

    const riskLevel = this.determineRiskLevel(finalScore);

    const detailedReport = this.generateDetailedReport({
      interview,
      emotions,
      documents,
      backgroundCheck,
      scores: {
        interview: interviewScore,
        emotion: emotionScore,
        ocr: ocrScore,
        background: backgroundScore,
        final: finalScore,
      },
      riskLevel,
    });

    const { data, error } = await supabase
      .from('risk_assessments')
      .insert([
        {
          application_id: applicationId,
          interview_score: interviewScore,
          emotion_score: emotionScore,
          ocr_score: ocrScore,
          background_score: backgroundScore,
          final_score: finalScore,
          risk_level: riskLevel,
          weights: DEFAULT_WEIGHTS,
          detailed_report: detailedReport,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('applications')
      .update({
        risk_score: finalScore,
        risk_level: riskLevel,
        status: 'completed',
      })
      .eq('id', applicationId);

    return data;
  },

  calculateInterviewScore(interview: any): number {
    if (!interview || !interview.completed_at) return 0;

    const credibilityScore = interview.credibility_score || 0;
    const sentimentScore = interview.sentiment_score || 0;

    return Math.round((credibilityScore + sentimentScore) / 2);
  },

  calculateOCRScore(documents: any[]): number {
    if (!documents || documents.length === 0) return 50;

    const ocrResults = documents
      .map(doc => doc.ocr_results?.[0])
      .filter(Boolean);

    if (ocrResults.length === 0) return 50;

    let totalScore = 0;
    let penalties = 0;

    ocrResults.forEach((result: any) => {
      if (result.tampering_detected) penalties += 30;
      if (result.validation_status === 'suspicious') penalties += 20;
      if (result.validation_status === 'invalid') penalties += 15;
      if (result.match_score) {
        totalScore += result.match_score;
      } else {
        totalScore += 50;
      }
    });

    const avgScore = totalScore / ocrResults.length;
    const finalScore = Math.max(0, avgScore - penalties);

    return Math.round(finalScore);
  },

  determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score >= 70) return 'LOW';
    if (score >= 40) return 'MEDIUM';
    return 'HIGH';
  },

  generateDetailedReport(data: any) {
    const { interview, emotions, documents, backgroundCheck, scores, riskLevel } = data;

    const report: any = {
      summary: {
        final_score: scores.final,
        risk_level: riskLevel,
        assessment_date: new Date().toISOString(),
        recommendation: this.generateRecommendation(riskLevel, scores),
      },
      interview_analysis: {
        score: scores.interview,
        completed: !!interview?.completed_at,
        credibility: interview?.credibility_score || 0,
        sentiment: interview?.sentiment_score || 0,
        duration: interview?.duration || 0,
        questions_answered: interview?.answers?.length || 0,
        key_findings: interview?.analysis || {},
      },
      emotion_analysis: {
        score: scores.emotion,
        total_detections: emotions.length,
        summary: emotionService.getEmotionSummary(emotions),
        dominant_emotion: this.getDominantEmotion(emotions),
      },
      document_verification: {
        score: scores.ocr,
        documents_submitted: documents.length,
        documents_verified: documents.filter((d: any) =>
          d.ocr_results?.[0]?.validation_status === 'valid'
        ).length,
        tampering_detected: documents.some((d: any) =>
          d.ocr_results?.[0]?.tampering_detected
        ),
        discrepancies: documents
          .flatMap((d: any) => d.ocr_results?.[0]?.discrepancies || [])
          .slice(0, 10),
      },
      background_check: {
        score: scores.background,
        status: backgroundCheck?.status || 'not_completed',
        watchlist_matches: backgroundCheck?.watchlist_matches?.length || 0,
        risk_indicators: backgroundCheck?.risk_indicators?.length || 0,
        identity_validated: backgroundCheck?.identity_validation?.validated || false,
      },
      risk_factors: this.identifyRiskFactors(data),
      strengths: this.identifyStrengths(data),
    };

    return report;
  },

  generateRecommendation(riskLevel: string, scores: any): string {
    if (riskLevel === 'LOW') {
      return 'Candidate shows strong verification results across all areas. Recommended for approval.';
    } else if (riskLevel === 'MEDIUM') {
      return 'Candidate shows some concerns. Additional verification or interview recommended before final decision.';
    } else {
      return 'Candidate shows significant risk indicators. Not recommended for approval without thorough additional investigation.';
    }
  },

  getDominantEmotion(emotions: any[]): string {
    if (emotions.length === 0) return 'none';

    const summary = emotionService.getEmotionSummary(emotions);
    return summary[0]?.emotion || 'none';
  },

  identifyRiskFactors(data: any): string[] {
    const factors: string[] = [];

    if (data.scores.interview < 60) {
      factors.push('Low interview credibility and sentiment scores');
    }

    if (data.scores.emotion < 50) {
      factors.push('Concerning emotional patterns detected during interview');
    }

    if (data.scores.ocr < 60) {
      factors.push('Document verification issues or discrepancies found');
    }

    if (data.scores.background < 60) {
      factors.push('Background check revealed potential concerns');
    }

    if (data.backgroundCheck?.watchlist_matches?.length > 0) {
      factors.push('Watchlist matches detected');
    }

    if (data.documents.some((d: any) => d.ocr_results?.[0]?.tampering_detected)) {
      factors.push('Possible document tampering detected');
    }

    if (data.backgroundCheck?.risk_indicators?.length > 3) {
      factors.push('Multiple risk indicators in background check');
    }

    return factors;
  },

  identifyStrengths(data: any): string[] {
    const strengths: string[] = [];

    if (data.scores.interview >= 75) {
      strengths.push('Strong interview performance with high credibility');
    }

    if (data.scores.emotion >= 70) {
      strengths.push('Positive emotional indicators throughout interview');
    }

    if (data.scores.ocr >= 80) {
      strengths.push('All documents verified successfully with no discrepancies');
    }

    if (data.scores.background >= 85) {
      strengths.push('Clean background check with no red flags');
    }

    if (data.interview?.analysis?.completion_rate === 100) {
      strengths.push('Completed all interview questions thoroughly');
    }

    return strengths;
  },

  async getRiskAssessmentByApplication(applicationId: string) {
    const { data, error } = await supabase
      .from('risk_assessments')
      .select('*')
      .eq('application_id', applicationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};
