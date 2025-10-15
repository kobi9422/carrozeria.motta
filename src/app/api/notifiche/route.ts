import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET() {
  try {
    const now = new Date().toISOString();
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const notifiche: any[] = [];

    // 1. Ordini in scadenza (data_fine < 3 giorni)
    const { data: ordiniInScadenza } = await supabaseServer
      .from('ordini_lavoro')
      .select(`
        *,
        cliente:clienti!ordini_lavoro_cliente_id_fkey (nome, cognome)
      `)
      .gte('data_fine', now)
      .lte('data_fine', threeDaysFromNow)
      .not('stato', 'in', '(completato,consegnato,annullato)');

    ordiniInScadenza?.forEach(ordine => {
      const giorni = Math.ceil((new Date(ordine.data_fine).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      notifiche.push({
        id: `ordine-scadenza-${ordine.id}`,
        tipo: 'ordine_scadenza',
        priorita: giorni <= 1 ? 'alta' : 'media',
        titolo: `Ordine ${ordine.numero_ordine} in scadenza`,
        messaggio: `L'ordine di ${ordine.cliente?.nome} ${ordine.cliente?.cognome} scade tra ${giorni} giorn${giorni === 1 ? 'o' : 'i'}`,
        url: '/admin/ordini-lavoro',
        data: ordine.data_fine
      });
    });

    // 2. Ordini in ritardo (data_fine < oggi && stato != completato)
    const { data: ordiniInRitardo } = await supabaseServer
      .from('ordini_lavoro')
      .select(`
        *,
        cliente:clienti!ordini_lavoro_cliente_id_fkey (nome, cognome)
      `)
      .lt('data_fine', now)
      .not('stato', 'in', '(completato,consegnato,annullato)');

    ordiniInRitardo?.forEach(ordine => {
      const giorni = Math.ceil((Date.now() - new Date(ordine.data_fine).getTime()) / (1000 * 60 * 60 * 24));
      notifiche.push({
        id: `ordine-ritardo-${ordine.id}`,
        tipo: 'ordine_ritardo',
        priorita: 'alta',
        titolo: `Ordine ${ordine.numero_ordine} in ritardo`,
        messaggio: `L'ordine di ${ordine.cliente?.nome} ${ordine.cliente?.cognome} è in ritardo di ${giorni} giorn${giorni === 1 ? 'o' : 'i'}`,
        url: '/admin/ordini-lavoro',
        data: ordine.data_fine
      });
    });

    // 3. Fatture non pagate (stato=emessa && data_scadenza < oggi)
    const { data: fattureNonPagate } = await supabaseServer
      .from('fatture')
      .select(`
        *,
        cliente:clienti!fatture_cliente_id_fkey (nome, cognome)
      `)
      .eq('stato', 'emessa')
      .lt('data_scadenza', now);

    fattureNonPagate?.forEach(fattura => {
      const giorni = Math.ceil((Date.now() - new Date(fattura.data_scadenza).getTime()) / (1000 * 60 * 60 * 24));
      notifiche.push({
        id: `fattura-scaduta-${fattura.id}`,
        tipo: 'fattura_scaduta',
        priorita: 'alta',
        titolo: `Fattura ${fattura.numero_fattura} scaduta`,
        messaggio: `La fattura di ${fattura.cliente?.nome} ${fattura.cliente?.cognome} è scaduta da ${giorni} giorn${giorni === 1 ? 'o' : 'i'}`,
        url: '/admin/fatture',
        data: fattura.data_scadenza
      });
    });

    // 4. Fatture in scadenza (stato=emessa && data_scadenza < 7 giorni)
    const setteGiorniDaOra = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: fattureInScadenza } = await supabaseServer
      .from('fatture')
      .select(`
        *,
        cliente:clienti!fatture_cliente_id_fkey (nome, cognome)
      `)
      .eq('stato', 'emessa')
      .gte('data_scadenza', now)
      .lte('data_scadenza', setteGiorniDaOra);

    fattureInScadenza?.forEach(fattura => {
      const giorni = Math.ceil((new Date(fattura.data_scadenza).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      notifiche.push({
        id: `fattura-scadenza-${fattura.id}`,
        tipo: 'fattura_scadenza',
        priorita: giorni <= 2 ? 'alta' : 'media',
        titolo: `Fattura ${fattura.numero_fattura} in scadenza`,
        messaggio: `La fattura di ${fattura.cliente?.nome} ${fattura.cliente?.cognome} scade tra ${giorni} giorn${giorni === 1 ? 'o' : 'i'}`,
        url: '/admin/fatture',
        data: fattura.data_scadenza
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

