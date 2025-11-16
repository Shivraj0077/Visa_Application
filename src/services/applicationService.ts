import { supabase } from '../lib/supabase';
import type { Application } from '../lib/supabase';

export const applicationService = {
  async createApplication(userId: string, position: string) {
    const { data, error } = await supabase
      .from('applications')
      .insert([
        {
          user_id: userId,
          position,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await this.logAudit(userId, 'create_application', 'application', data.id);

    return data;
  },

  async getApplicationsByUser(userId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAllApplications() {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        users!applications_user_id_fkey(email, full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getApplicationById(applicationId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        users!applications_user_id_fkey(id, email, full_name),
        interviews(*),
        documents(*),
        background_checks(*),
        risk_assessments(*)
      `)
      .eq('id', applicationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateApplication(applicationId: string, updates: Partial<Application>) {
    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateApplicationStatus(
    applicationId: string,
    status: Application['status'],
    adminNotes?: string,
    userId?: string
  ) {
    const updates: Partial<Application> = { status };
    if (adminNotes) updates.admin_notes = adminNotes;

    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      await this.logAudit(userId, 'update_status', 'application', applicationId, { status, adminNotes });
    }

    return data;
  },

  async logAudit(userId: string, action: string, entityType: string, entityId: string, details?: any) {
    await supabase.from('audit_logs').insert([
      {
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details || {},
      },
    ]);
  },
};
