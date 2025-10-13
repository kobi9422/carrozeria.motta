import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Ottieni le impostazioni (crea se non esistono)
export async function GET() {
  try {
    let impostazioni = await prisma.impostazioni.findFirst();
    
    // Se non esistono impostazioni, crea quelle di default
    if (!impostazioni) {
      impostazioni = await prisma.impostazioni.create({
        data: {
          nomeAzienda: 'Carrozzeria Motta',
          indirizzo: '',
          citta: '',
          cap: '',
          provincia: '',
          telefono: '',
          email: '',
          partitaIva: '',
          codiceFiscale: '',
          iban: '',
          banca: '',
          condizioniPagamento: 'Pagamento a 30 giorni',
          noteLegaliFattura: '',
          validitaPreventivi: 30,
          noteStandardPreventivo: ''
        }
      });
    }

    return NextResponse.json(impostazioni);
  } catch (error: any) {
    console.error('Errore nel recupero delle impostazioni:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle impostazioni' },
      { status: 500 }
    );
  }
}

// PATCH - Aggiorna le impostazioni
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Trova le impostazioni esistenti
    let impostazioni = await prisma.impostazioni.findFirst();
    
    if (!impostazioni) {
      // Se non esistono, creale
      impostazioni = await prisma.impostazioni.create({
        data: body
      });
    } else {
      // Altrimenti aggiornale
      impostazioni = await prisma.impostazioni.update({
        where: { id: impostazioni.id },
        data: body
      });
    }

    return NextResponse.json(impostazioni);
  } catch (error: any) {
    console.error('Errore nell\'aggiornamento delle impostazioni:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento delle impostazioni' },
      { status: 500 }
    );
  }
}

