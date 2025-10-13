import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/clienti - Ottieni tutti i clienti
export async function GET(request: NextRequest) {
  try {
    const clienti = await prisma.cliente.findMany({
      orderBy: [
        { cognome: 'asc' },
        { nome: 'asc' }
      ]
    });

    return NextResponse.json(clienti);
  } catch (error: any) {
    console.error('Errore GET /api/clienti:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clienti - Crea un nuovo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, cognome, telefono, email } = body;

    // Validazione base
    if (!nome || !cognome) {
      return NextResponse.json({ error: 'Nome e cognome sono obbligatori' }, { status: 400 });
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome,
        cognome,
        telefono: telefono || null,
        email: email || null
      }
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error: any) {
    console.error('Errore POST /api/clienti:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
