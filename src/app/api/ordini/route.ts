import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Lista tutti gli ordini
export async function GET(request: NextRequest) {
  try {
    const ordini = await prisma.ordineLavoro.findMany({
      include: {
        cliente: true,
        veicolo: true,
        dipendenti: {
          include: {
            dipendente: {
              select: {
                id: true,
                nome: true,
                cognome: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        dataInizio: 'desc'
      }
    });

    // Trasforma i dati per il frontend
    const ordiniFormatted = ordini.map(ordine => ({
      id: ordine.id,
      numeroOrdine: ordine.numeroOrdine,
      cliente: {
        id: ordine.cliente.id,
        nome: ordine.cliente.nome,
        cognome: ordine.cliente.cognome
      },
      veicolo: ordine.veicolo ? {
        id: ordine.veicolo.id,
        marca: ordine.veicolo.marca,
        modello: ordine.veicolo.modello,
        targa: ordine.veicolo.targa
      } : null,
      descrizione: ordine.descrizione,
      stato: ordine.stato,
      priorita: ordine.priorita,
      dataInizio: ordine.dataInizio.toISOString().split('T')[0],
      dataFine: ordine.dataFine ? ordine.dataFine.toISOString().split('T')[0] : null,
      costoStimato: ordine.costoStimato,
      tempoLavorato: ordine.tempoLavorato || 0,
      dipendentiAssegnati: ordine.dipendenti.map(d => d.dipendente.id)
    }));

    return NextResponse.json(ordiniFormatted);
  } catch (error) {
    console.error('Errore nel recupero ordini:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero degli ordini' },
      { status: 500 }
    );
  }
}

// POST - Crea nuovo ordine
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clienteId,
      veicoloId,
      descrizione,
      stato,
      priorita,
      dataInizio,
      dataFine,
      costoStimato,
      dipendentiIds
    } = body;

    // Validazione
    if (!clienteId || !descrizione) {
      return NextResponse.json(
        { error: 'Cliente e descrizione sono obbligatori' },
        { status: 400 }
      );
    }

    // Genera numero ordine
    const anno = new Date().getFullYear();
    const ultimoOrdine = await prisma.ordineLavoro.findFirst({
      where: {
        numeroOrdine: {
          startsWith: `ORD-${anno}-`
        }
      },
      orderBy: {
        numeroOrdine: 'desc'
      }
    });

    let numeroProgressivo = 1;
    if (ultimoOrdine) {
      const match = ultimoOrdine.numeroOrdine.match(/ORD-\d{4}-(\d+)/);
      if (match) {
        numeroProgressivo = parseInt(match[1]) + 1;
      }
    }

    const numeroOrdine = `ORD-${anno}-${numeroProgressivo.toString().padStart(3, '0')}`;

    // Crea ordine
    const ordine = await prisma.ordineLavoro.create({
      data: {
        numeroOrdine,
        clienteId,
        veicoloId: veicoloId || null,
        descrizione,
        stato: stato || 'in_attesa',
        priorita: priorita || 'media',
        dataInizio: new Date(dataInizio),
        dataFine: dataFine ? new Date(dataFine) : null,
        costoStimato: parseFloat(costoStimato) || 0,
        tempoLavorato: 0,
        dipendenti: dipendentiIds && dipendentiIds.length > 0 ? {
          create: dipendentiIds.map((dipId: string) => ({
            dipendente: {
              connect: { id: dipId }
            }
          }))
        } : undefined
      },
      include: {
        cliente: true,
        veicolo: true,
        dipendenti: {
          include: {
            dipendente: true
          }
        }
      }
    });

    return NextResponse.json(ordine, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione ordine:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione dell\'ordine' },
      { status: 500 }
    );
  }
}

