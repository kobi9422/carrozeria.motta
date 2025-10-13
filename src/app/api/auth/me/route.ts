import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Token non valido' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Errore durante la verifica dell\'autenticazione' },
      { status: 500 }
    );
  }
}
