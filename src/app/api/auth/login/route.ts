import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password sono richiesti' },
        { status: 400 }
      );
    }

    // Cerca l'utente nel database Supabase
    const { data: user, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('attivo', true)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // Verifica la password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // Genera JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, ruolo: user.ruolo },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Rimuovi la password dalla risposta
    const { password: _, ...userWithoutPassword } = user;

    // Imposta il token come cookie httpOnly
    const response = NextResponse.json({
      user: userWithoutPassword,
      message: 'Login effettuato con successo'
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 giorni
    });

    return response;

  } catch (error: any) {
    console.error('Errore login:', error);
    return NextResponse.json(
      { error: error.message || 'Errore durante il login' },
      { status: 500 }
    );
  }
}
