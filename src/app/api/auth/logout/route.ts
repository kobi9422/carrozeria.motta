import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      message: 'Logout effettuato con successo'
    });

    // Rimuovi il cookie di autenticazione
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });

    return response;

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Errore durante il logout' },
      { status: 500 }
    );
  }
}
