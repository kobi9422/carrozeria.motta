import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/fatture - Ottieni tutte le fatture
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stato = searchParams.get('stato');

    const where: any = {};
    if (stato && stato !== 'tutti') {
      where.stato = stato;
    }

    const fatture = await prisma.fattura.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            cognome: true,
            email: true,
            telefono: true,
            partitaIva: true,
            codiceFiscale: true
          }
        },
        voci: true
      },
      orderBy: {
        dataEmissione: 'desc'
      }
    });

    return NextResponse.json(fatture);
  } catch (error: any) {
    console.error('Errore GET /api/fatture:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/fatture - Crea una nuova fattura
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clienteId, dataScadenza, voci, note } = body;

    // Validazione
    if (!clienteId || !dataScadenza || !voci || voci.length === 0) {
      return NextResponse.json(
        { error: 'Cliente, data scadenza e almeno una voce sono obbligatori' },
        { status: 400 }
      );
    }

    // Calcola importo totale
    const importoTotale = voci.reduce((sum: number, voce: any) => {
      return sum + (voce.quantita * voce.prezzoUnitario);
    }, 0);

    // Genera numero fattura
    const anno = new Date().getFullYear();
    const ultimaFattura = await prisma.fattura.findFirst({
      where: {
        numeroFattura: {
          startsWith: `FATT-${anno}-`
        }
      },
      orderBy: {
        numeroFattura: 'desc'
      }
    });

    let numeroProgressivo = 1;
    if (ultimaFattura) {
      const match = ultimaFattura.numeroFattura.match(/FATT-\d{4}-(\d+)/);
      if (match) {
        numeroProgressivo = parseInt(match[1]) + 1;
      }
    }

    const numeroFattura = `FATT-${anno}-${numeroProgressivo.toString().padStart(3, '0')}`;

    // Crea fattura con voci
    const fattura = await prisma.fattura.create({
      data: {
        numeroFattura,
        clienteId,
        dataScadenza: new Date(dataScadenza),
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

    return NextResponse.json(fattura, { status: 201 });
  } catch (error: any) {
    console.error('Errore POST /api/fatture:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

