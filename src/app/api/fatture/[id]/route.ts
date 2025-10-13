import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/fatture/[id] - Ottieni una fattura specifica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fattura = await prisma.fattura.findUnique({
      where: { id: params.id },
      include: {
        cliente: true,
        voci: true
      }
    });

    if (!fattura) {
      return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 });
    }

    return NextResponse.json(fattura);
  } catch (error: any) {
    console.error('Errore GET /api/fatture/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/fatture/[id] - Aggiorna una fattura
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { stato, dataScadenza, dataPagamento, voci, note } = body;

    // Se vengono aggiornate le voci, ricalcola il totale
    let importoTotale;
    if (voci) {
      importoTotale = voci.reduce((sum: number, voce: any) => {
        return sum + (voce.quantita * voce.prezzoUnitario);
      }, 0);

      // Elimina vecchie voci e crea nuove
      await prisma.voceFattura.deleteMany({
        where: { fatturaId: params.id }
      });
    }

    const fattura = await prisma.fattura.update({
      where: { id: params.id },
      data: {
        ...(stato && { stato }),
        ...(dataScadenza && { dataScadenza: new Date(dataScadenza) }),
        ...(dataPagamento !== undefined && { 
          dataPagamento: dataPagamento ? new Date(dataPagamento) : null 
        }),
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

    return NextResponse.json(fattura);
  } catch (error: any) {
    console.error('Errore PATCH /api/fatture/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/fatture/[id] - Elimina una fattura
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.fattura.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Fattura eliminata con successo' });
  } catch (error: any) {
    console.error('Errore DELETE /api/fatture/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

