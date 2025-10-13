import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - Lista tutti i dipendenti
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const attiviOnly = searchParams.get('attivi') === 'true';

    const dipendenti = await prisma.user.findMany({
      where: attiviOnly ? { attivo: true } : undefined,
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        telefono: true,
        ruolo: true,
        attivo: true,
        createdAt: true
      },
      orderBy: {
        cognome: 'asc'
      }
    });

    return NextResponse.json(dipendenti);
  } catch (error) {
    console.error('Errore nel recupero dipendenti:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei dipendenti' },
      { status: 500 }
    );
  }
}

// POST - Crea nuovo dipendente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, cognome, email, telefono, password, ruolo } = body;

    // Validazione
    if (!nome || !cognome || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, cognome, email e password sono obbligatori' },
        { status: 400 }
      );
    }

    // Verifica email duplicata
    const esistente = await prisma.user.findUnique({
      where: { email }
    });

    if (esistente) {
      return NextResponse.json(
        { error: 'Email già esistente' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const dipendente = await prisma.user.create({
      data: {
        nome,
        cognome,
        email,
        telefono,
        password: hashedPassword,
        ruolo: ruolo || 'employee',
        attivo: true
      },
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        telefono: true,
        ruolo: true,
        attivo: true,
        createdAt: true
      }
    });

    return NextResponse.json(dipendente, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione dipendente:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione del dipendente' },
      { status: 500 }
    );
  }
}

