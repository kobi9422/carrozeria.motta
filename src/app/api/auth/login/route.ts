import { NextRequest, NextResponse } from 'next/server';
import { signInWithEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password sono richiesti' },
        { status: 400 }
      );
    }

    const result = await signInWithEmail(email, password);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // Imposta il token come cookie httpOnly
    const response = NextResponse.json({
      user: result.user,
      message: 'Login effettuato con successo'
    });

    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 giorni
    });

    return response;

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Errore durante il login' },
      { status: 500 }
    );
  }
}
