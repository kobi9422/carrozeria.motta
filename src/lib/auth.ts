import { hashPassword, comparePassword, generateToken, verifyToken, getTokenFromRequest } from './jwt';
import { User } from '@/types';

// Funzioni di autenticazione per Carrozzeria Motta con Supabase

export async function signInWithEmail(email: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    const { supabaseServer } = await import('@/lib/supabase');
    const bcrypt = await import('bcryptjs');

    const { data: user, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('attivo', true)
      .single();

    if (error || !user) {
      throw new Error('Credenziali non valide');
    }

    const isPasswordValid = await bcrypt.default.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenziali non valide');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      ruolo: user.ruolo,
    });

    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      nome: user.nome,
      cognome: user.cognome,
      ruolo: user.ruolo,
      attivo: user.attivo,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return { user: userWithoutPassword, token };
  } catch (error: any) {
    throw new Error(error.message || 'Errore durante il login');
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  nome: string,
  cognome: string,
  ruolo: 'admin' | 'employee'
): Promise<User> {
  try {
    const { supabaseServer } = await import('@/lib/supabase');

    // Verifica se l'email esiste già
    const { data: existingUser } = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('Email già registrata');
    }

    const hashedPassword = await hashPassword(password);

    const { data: user, error } = await supabaseServer
      .from('users')
      .insert({
        id: crypto.randomUUID(),
        email,
        password: hashedPassword,
        nome,
        cognome,
        ruolo,
        attivo: true,
      })
      .select()
      .single();

    if (error || !user) {
      throw new Error('Errore durante la creazione dell\'utente');
    }

    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      cognome: user.cognome,
      ruolo: user.ruolo,
      attivo: user.attivo,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Errore durante la registrazione');
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    return getUserFromToken(token);
  } catch (error) {
    return null;
  }
}

export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    const { supabaseServer } = await import('@/lib/supabase');
    const { data: user, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .eq('attivo', true)
      .single();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      cognome: user.cognome,
      ruolo: user.ruolo,
      attivo: user.attivo,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  } catch (error) {
    return null;
  }
}

export async function getUserFromRequest(request: Request): Promise<User | null> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }
  return getUserFromToken(token);
}

export async function isAdmin(user: User | null): boolean {
  return user?.ruolo === 'admin';
}

export async function isAuthenticated(user: User | null): boolean {
  return !!user;
}

export async function updateProfile(userId: string, updates: Partial<User>): Promise<boolean> {
  try {
    const { supabaseServer } = await import('@/lib/supabase');

    const { error } = await supabaseServer
      .from('users')
      .update({
        nome: updates.nome,
        cognome: updates.cognome,
        email: updates.email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (error: any) {
    throw new Error(error.message || 'Errore durante l\'aggiornamento del profilo');
  }
}

export async function changePassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const { supabaseServer } = await import('@/lib/supabase');
    const hashedPassword = await hashPassword(newPassword);

    const { error } = await supabaseServer
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (error: any) {
    throw new Error(error.message || 'Errore durante il cambio password');
  }
}
