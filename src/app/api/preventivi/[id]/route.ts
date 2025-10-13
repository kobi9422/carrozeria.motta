import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/preventivi/[id] - Ottieni un preventivo specifico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const preventivo = await prisma.preventivo.findUnique({
      where: { id: params.id },
      include: {
        cliente: true,
        voci: true
      }
    });

    if (!preventivo) {
      return NextResponse.json({ error: 'Preventivo non trovato' }, { status: 404 });
    }

    return NextResponse.json(preventivo);
  } catch (error: any) {
    console.error('Errore GET /api/preventivi/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/preventivi/[id] - Aggiorna un preventivo
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { stato, titolo, descrizione, dataScadenza, voci, note } = body;

    // Se vengono aggiornate le voci, ricalcola il totale
    let importoTotale;
    if (voci) {
      importoTotale = voci.reduce((sum: number, voce: any) => {
        return sum + (voce.quantita * voce.prezzoUnitario);
      }, 0);

      // Elimina vecchie voci e crea nuove
      await prisma.vocePreventivo.deleteMany({
        where: { preventivoId: params.id }
      });
    }

    const preventivo = await prisma.preventivo.update({
      where: { id: params.id },
      data: {
        ...(stato && { stato }),
        ...(titolo && { titolo }),
        ...(descrizione !== undefined && { descrizione }),
        ...(dataScadenza && { dataScadenza: new Date(dataScadenza) }),
        ...(importoTotale !== undefined && { importoTotale }),
        ...(note !== undefined && { note }),
        ...(voci && {
          voci: {
            create: voci.map((voce: any) => ({
              descrizione: voce.descrizione,
              quantita: voce.quantita,
              prezzoUnitario: voce.prezzoUnitario,
              totale: voce.quantita * voce.prezzoUnitario
            }))
          }
        })
      },
      include: {
        cliente: true,
        voci: true
      }
    });

    return NextResponse.json(preventivo);
  } catch (error: any) {
    console.error('Errore PATCH /api/preventivi/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/preventivi/[id] - Elimina un preventivo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.preventivo.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Preventivo eliminato con successo' });
  } catch (error: any) {
    console.error('Errore DELETE /api/preventivi/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

