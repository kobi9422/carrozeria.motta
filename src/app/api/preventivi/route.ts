import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/preventivi - Ottieni tutti i preventivi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stato = searchParams.get('stato');

    const where: any = {};
    if (stato && stato !== 'tutti') {
      where.stato = stato;
    }

    const preventivi = await prisma.preventivo.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            email: true,
            telefono: true
          }
        },
        voci: true
      },
      orderBy: {
        dataCreazione: 'desc'
      }
    });

    return NextResponse.json(preventivi);
  } catch (error: any) {
    console.error('Errore GET /api/preventivi:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/preventivi - Crea un nuovo preventivo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clienteId, titolo, descrizione, dataScadenza, voci, note } = body;

    // Validazione
    if (!clienteId || !titolo || !voci || voci.length === 0) {
      return NextResponse.json(
        { error: 'Cliente, titolo e almeno una voce sono obbligatori' },
        { status: 400 }
      );
    }

    // Calcola importo totale
    const importoTotale = voci.reduce((sum: number, voce: any) => {
      return sum + (voce.quantita * voce.prezzoUnitario);
    }, 0);

    // Genera numero preventivo
    const anno = new Date().getFullYear();
    const ultimoPreventivo = await prisma.preventivo.findFirst({
      where: {
        numeroPreventivo: {
          startsWith: `PREV-${anno}-`
        }
      },
      orderBy: {
        numeroPreventivo: 'desc'
      }
    });

    let numeroProgressivo = 1;
    if (ultimoPreventivo) {
      const match = ultimoPreventivo.numeroPreventivo.match(/PREV-\d{4}-(\d+)/);
      if (match) {
        numeroProgressivo = parseInt(match[1]) + 1;
      }
    }

    const numeroPreventivo = `PREV-${anno}-${numeroProgressivo.toString().padStart(3, '0')}`;

    // Crea preventivo con voci
    const preventivo = await prisma.preventivo.create({
      data: {
        numeroPreventivo,
        clienteId,
        titolo,
        descrizione: descrizione || null,
        dataScadenza: dataScadenza ? new Date(dataScadenza) : null,
        importoTotale,
        note: note || null,
        voci: {
          create: voci.map((voce: any) => ({
            descrizione: voce.descrizione,
            quantita: voce.quantita,
            prezzoUnitario: voce.prezzoUnitario,
            totale: voce.quantita * voce.prezzoUnitario
          }))
        }
      },
      include: {
        cliente: true,
        voci: true
      }
    });

    return NextResponse.json(preventivo, { status: 201 });
  } catch (error: any) {
    console.error('Errore POST /api/preventivi:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

