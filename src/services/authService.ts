import { supabase } from '../lib/supabase';

export const authService = {
  async signUp(email: string, password: string, fullName: string, role: 'applicant' | 'admin' = 'applicant') {
    const passwordHash = await hashPassword(password);

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new Error('User already exists');
    }

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: passwordHash,
          full_name: fullName,
          role,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const token = generateToken(data.id, data.email, data.role);

    return {
      user: {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
      },
      token,
    };
  },

  async signIn(email: string, password: string) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      token,
    };
  },

  async getCurrentUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateUser(userId: string, updates: { full_name?: string; email?: string }) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  verifyToken(token: string) {
    try {
      const payload = decodeToken(token);
      return payload;
    } catch {
      return null;
    }
  },
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

function generateToken(userId: string, email: string, role: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      userId,
      email,
      role,
      iat: Date.now(),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
  );
  const signature = btoa(`${header}.${payload}.secret`);
  return `${header}.${payload}.${signature}`;
}

function decodeToken(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');

  const payload = JSON.parse(atob(parts[1]));

  if (payload.exp < Date.now()) {
    throw new Error('Token expired');
  }

  return payload;
}
