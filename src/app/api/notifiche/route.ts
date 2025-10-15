import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const notifiche = [];

    // 1. Ordini in scadenza (dataFine < 3 giorni)
    const ordiniInScadenza = await prisma.ordineLavoro.findMany({
      where: {
        dataFine: {
          gte: now,
          lte: threeDaysFromNow
        },
        stato: {
          notIn: ['completato', 'consegnato', 'annullato']
        }
      },
      include: {
        cliente: true
      }
    });

    ordiniInScadenza.forEach(ordine => {
      const giorni = Math.ceil((new Date(ordine.dataFine).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      notifiche.push({
        id: `ordine-scadenza-${ordine.id}`,
        tipo: 'ordine_scadenza',
        priorita: giorni <= 1 ? 'alta' : 'media',
        titolo: `Ordine ${ordine.numeroOrdine} in scadenza`,
        messaggio: `L'ordine di ${ordine.cliente?.nome} ${ordine.cliente?.cognome} scade tra ${giorni} giorn${giorni === 1 ? 'o' : 'i'}`,
        url: '/admin/ordini-lavoro',
        data: ordine.dataFine
      });
    });

    // 2. Ordini in ritardo (dataFine < oggi && stato != completato)
    const ordiniInRitardo = await prisma.ordineLavoro.findMany({
      where: {
        dataFine: {
          lt: now
        },
        stato: {
          notIn: ['completato', 'consegnato', 'annullato']
        }
      },
      include: {
        cliente: true
      }
    });

    ordiniInRitardo.forEach(ordine => {
      const giorni = Math.ceil((now.getTime() - new Date(ordine.dataFine).getTime()) / (1000 * 60 * 60 * 24));
      notifiche.push({
        id: `ordine-ritardo-${ordine.id}`,
        tipo: 'ordine_ritardo',
        priorita: 'alta',
        titolo: `Ordine ${ordine.numeroOrdine} in ritardo`,
        messaggio: `L'ordine di ${ordine.cliente?.nome} ${ordine.cliente?.cognome} è in ritardo di ${giorni} giorn${giorni === 1 ? 'o' : 'i'}`,
        url: '/admin/ordini-lavoro',
        data: ordine.dataFine
      });
    });

    // 3. Fatture non pagate (stato=emessa && dataScadenza < oggi)
    const fattureNonPagate = await prisma.fattura.findMany({
      where: {
        stato: 'emessa',
        dataScadenza: {
          lt: now
        }
      },
      include: {
        cliente: true
      }
    });

    fattureNonPagate.forEach(fattura => {
      const giorni = Math.ceil((now.getTime() - new Date(fattura.dataScadenza).getTime()) / (1000 * 60 * 60 * 24));
      notifiche.push({
        id: `fattura-scaduta-${fattura.id}`,
        tipo: 'fattura_scaduta',
        priorita: 'alta',
        titolo: `Fattura ${fattura.numeroFattura} scaduta`,
        messaggio: `La fattura di ${fattura.cliente?.nome} ${fattura.cliente?.cognome} è scaduta da ${giorni} giorn${giorni === 1 ? 'o' : 'i'}`,
        url: '/admin/fatture',
        data: fattura.dataScadenza
      });
    });

    // 4. Fatture in scadenza (stato=emessa && dataScadenza < 7 giorni)
    const setteGiorniDaOra = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fattureInScadenza = await prisma.fattura.findMany({
      where: {
        stato: 'emessa',
        dataScadenza: {
          gte: now,
          lte: setteGiorniDaOra
        }
      },
      include: {
        cliente: true
      }
    });

    fattureInScadenza.forEach(fattura => {
      const giorni = Math.ceil((new Date(fattura.dataScadenza).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      notifiche.push({
        id: `fattura-scadenza-${fattura.id}`,
        tipo: 'fattura_scadenza',
        priorita: giorni <= 2 ? 'alta' : 'media',
        titolo: `Fattura ${fattura.numeroFattura} in scadenza`,
        messaggio: `La fattura di ${fattura.cliente?.nome} ${fattura.cliente?.cognome} scade tra ${giorni} giorn${giorni === 1 ? 'o' : 'i'}`,
        url: '/admin/fatture',
        data: fattura.dataScadenza
      });
    });

    // Ordina per priorità e data
    notifiche.sort((a, b) => {
      if (a.priorita === 'alta' && b.priorita !== 'alta') return -1;
      if (a.priorita !== 'alta' && b.priorita === 'alta') return 1;
      return new Date(a.data).getTime() - new Date(b.data).getTime();
    });

    return NextResponse.json({
      notifiche,
      totale: notifiche.length,
      critiche: notifiche.filter(n => n.priorita === 'alta').length
    });
  } catch (error) {
    console.error('Errore nel caricamento notifiche:', error);
    return NextResponse.json({ error: 'Errore nel caricamento notifiche' }, { status: 500 });
  }
}

