import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Ottieni singolo ordine
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ordine = await prisma.ordineLavoro.findUnique({
      where: { id: params.id },
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

    if (!ordine) {
      return NextResponse.json(
        { error: 'Ordine non trovato' },
        { status: 404 }
      );
    }

    return NextResponse.json(ordine);
  } catch (error) {
    console.error('Errore nel recupero ordine:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dell\'ordine' },
      { status: 500 }
    );
  }
}

// PATCH - Aggiorna ordine
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      descrizione,
      stato,
      priorita,
      dataInizio,
      dataFine,
      costoStimato,
      tempoLavorato,
      dipendentiIds
    } = body;

    // Prepara i dati da aggiornare
    const updateData: any = {};
    
    if (descrizione !== undefined) updateData.descrizione = descrizione;
    if (stato !== undefined) updateData.stato = stato;
    if (priorita !== undefined) updateData.priorita = priorita;
    if (dataInizio !== undefined) updateData.dataInizio = new Date(dataInizio);
    if (dataFine !== undefined) updateData.dataFine = dataFine ? new Date(dataFine) : null;
    if (costoStimato !== undefined) updateData.costoStimato = parseFloat(costoStimato);
    if (tempoLavorato !== undefined) updateData.tempoLavorato = parseInt(tempoLavorato);

    // Gestione dipendenti assegnati
    if (dipendentiIds !== undefined) {
      // Rimuovi tutte le assegnazioni esistenti
      await prisma.dipendentiOrdini.deleteMany({
        where: { ordineLavoroId: params.id }
      });

      // Crea nuove assegnazioni
      if (dipendentiIds.length > 0) {
        updateData.dipendenti = {
          create: dipendentiIds.map((dipId: string) => ({
            dipendente: {
              connect: { id: dipId }
            }
          }))
        };
      }
    }

    const ordine = await prisma.ordineLavoro.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(ordine);
  } catch (error) {
    console.error('Errore nell\'aggiornamento ordine:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dell\'ordine' },
      { status: 500 }
    );
  }
}

// DELETE - Elimina ordine
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Prima elimina le relazioni con i dipendenti
    await prisma.dipendentiOrdini.deleteMany({
      where: { ordineLavoroId: params.id }
    });

    // Poi elimina l'ordine
    await prisma.ordineLavoro.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Ordine eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione ordine:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione dell\'ordine' },
      { status: 500 }
    );
  }
}

