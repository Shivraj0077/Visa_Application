import { supabase } from '../lib/supabase';

const WATCHLIST_DATABASE = [
  { name: 'john doe', reason: 'fraud', severity: 'high' },
  { name: 'jane smith', reason: 'identity theft', severity: 'medium' },
  { name: 'robert johnson', reason: 'document forgery', severity: 'high' },
];

const KNOWN_FAKE_PATTERNS = [
  { pattern: /test\s*user/i, reason: 'Test account pattern' },
  { pattern: /fake\s*name/i, reason: 'Fake name pattern' },
  { pattern: /^[a-z]{1,3}[0-9]{3,}$/i, reason: 'Generated name pattern' },
];

export const backgroundCheckService = {
  async performBackgroundCheck(applicationId: string, userData: any) {
    const checkId = await this.createBackgroundCheck(applicationId);

    try {
      const watchlistResults = await this.checkWatchlists(userData.name);
      const identityResults = await this.validateIdentity(userData);
      const duplicateResults = await this.checkDuplicates(userData.email);

      const riskIndicators = [
        ...watchlistResults.matches.map((m: any) => ({ type: 'watchlist', ...m })),
        ...identityResults.issues,
        ...duplicateResults.duplicates,
      ];

      const score = this.calculateBackgroundScore(watchlistResults, identityResults, duplicateResults);

      await this.updateBackgroundCheck(checkId, {
        status: 'completed',
        results: {
          watchlist: watchlistResults,
          identity: identityResults,
          duplicates: duplicateResults,
        },
        watchlist_matches: watchlistResults.matches,
        identity_validation: identityResults,
        duplicate_checks: duplicateResults.duplicates,
        risk_indicators: riskIndicators,
        score,
        completed_at: new Date().toISOString(),
      });

      return { checkId, score, riskIndicators };
    } catch (error) {
      await this.updateBackgroundCheck(checkId, {
        status: 'failed',
      });
      throw error;
    }
  },

  async createBackgroundCheck(applicationId: string) {
    const { data, error } = await supabase
      .from('background_checks')
      .insert([
        {
          application_id: applicationId,
          check_type: 'comprehensive',
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  },

  async updateBackgroundCheck(checkId: string, updates: any) {
    const { error } = await supabase
      .from('background_checks')
      .update(updates)
      .eq('id', checkId);

    if (error) throw error;
  },

  async checkWatchlists(name: string) {
    await this.simulateApiDelay();

    const normalizedName = name.toLowerCase().trim();
    const matches = WATCHLIST_DATABASE.filter(entry =>
      normalizedName.includes(entry.name) || entry.name.includes(normalizedName)
    );

    return {
      checked: true,
      databases_searched: ['INTERPOL', 'FBI', 'OFAC', 'EU Sanctions'],
      matches: matches.map(m => ({
        name: m.name,
        reason: m.reason,
        severity: m.severity,
        database: 'Global Watchlist',
      })),
      clean: matches.length === 0,
    };
  },

  async validateIdentity(userData: any) {
    await this.simulateApiDelay();

    const issues = [];

    for (const pattern of KNOWN_FAKE_PATTERNS) {
      if (pattern.pattern.test(userData.name)) {
        issues.push({
          type: 'fake_identity',
          description: pattern.reason,
          severity: 'high',
        });
      }
    }

    if (userData.email && /temp|disposable|fake|test/i.test(userData.email)) {
      issues.push({
        type: 'suspicious_email',
        description: 'Disposable or temporary email pattern detected',
        severity: 'medium',
      });
    }

    if (userData.name && userData.name.length < 3) {
      issues.push({
        type: 'invalid_name',
        description: 'Name too short to be valid',
        severity: 'high',
      });
    }

    return {
      validated: issues.length === 0,
      issues,
      confidence: Math.max(0, 100 - issues.length * 25),
    };
  },

  async checkDuplicates(email: string) {
    await this.simulateApiDelay();

    const { data: existingApplications } = await supabase
      .from('applications')
      .select(`
        id,
        created_at,
        users!applications_user_id_fkey(email, full_name)
      `)
      .neq('users.email', email);

    const duplicates: any[] = [];

    if (existingApplications) {
      for (const app of existingApplications) {
        const user = app.users as any;
        if (user && this.isSimilarEmail(email, user.email)) {
          duplicates.push({
            type: 'similar_email',
            email: user.email,
            application_id: app.id,
            created_at: app.created_at,
            similarity: 'high',
          });
        }
      }
    }

    return {
      checked: true,
      duplicates,
      has_duplicates: duplicates.length > 0,
    };
  },

  isSimilarEmail(email1: string, email2: string): boolean {
    const normalize = (e: string) => e.toLowerCase().replace(/[.\-_]/g, '');
    const norm1 = normalize(email1);
    const norm2 = normalize(email2);

    if (norm1 === norm2) return true;

    const username1 = email1.split('@')[0];
    const username2 = email2.split('@')[0];

    return username1 === username2;
  },

  calculateBackgroundScore(watchlist: any, identity: any, duplicates: any): number {
    let score = 100;

    score -= watchlist.matches.length * 30;

    score -= identity.issues.filter((i: any) => i.severity === 'high').length * 20;
    score -= identity.issues.filter((i: any) => i.severity === 'medium').length * 10;

    score -= duplicates.duplicates.length * 15;

    return Math.max(0, Math.min(100, score));
  },

  async getBackgroundCheckByApplication(applicationId: string) {
    const { data, error } = await supabase
      .from('background_checks')
      .select('*')
      .eq('application_id', applicationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  simulateApiDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  },
};
