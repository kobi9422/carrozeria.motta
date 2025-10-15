import { prisma } from './prisma';
import { hashPassword, comparePassword, generateToken, verifyToken, getTokenFromRequest } from './jwt';
import { User } from '@/types';

// Funzioni di autenticazione per Carrozzeria Motta con Prisma

export async function signInWithEmail(email: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.attivo) {
      throw new Error('Credenziali non valide');
    }

    const isPasswordValid = await comparePassword(password, user.password);
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
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
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
    // Verifica se l'email esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email già registrata');
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nome,
        cognome,
        ruolo,
      },
    });

    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      cognome: user.cognome,
      ruolo: user.ruolo,
      attivo: user.attivo,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  } catch (error: any) {
    throw new Error(error.message || 'Errore durante la registrazione');
  }
}

export async function getCurrentUser(): Promise<User | null> {
  // Questa funzione sarà chiamata dal client, quindi non possiamo accedere al token qui
  // Il token sarà gestito dal middleware o dalle API routes
  return null;
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
    await prisma.user.update({
      where: { id: userId },
      data: {
        nome: updates.nome,
        cognome: updates.cognome,
        email: updates.email,
      },
    });

    return true;
  } catch (error: any) {
    throw new Error(error.message || 'Errore durante l\'aggiornamento del profilo');
  }
}

export async function changePassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return true;
  } catch (error: any) {
    throw new Error(error.message || 'Errore durante il cambio password');
  }
}
