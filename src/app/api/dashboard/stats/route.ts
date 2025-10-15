import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { toCamelCase } from '@/lib/supabase-helpers';

// GET /api/dashboard/stats - Ottieni statistiche per la dashboard
export async function GET(request: NextRequest) {
  try {
    // Verifica autenticazione
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const stats: any = {};

    if (user.ruolo === 'admin') {
      // Statistiche per admin
      
      // Ordini di lavoro attivi
      const { count: ordiniAttivi, error: ordiniAttiviError } = await supabaseServer
        .from('ordini_lavoro')
        .select('*', { count: 'exact', head: true })
        .in('stato', ['in_attesa', 'in_lavorazione']);

      if (ordiniAttiviError) {
        return NextResponse.json({ error: ordiniAttiviError.message }, { status: 500 });
      }

      // Ordini completati questo mese
      const inizioMese = new Date();
      inizioMese.setDate(1);
      inizioMese.setHours(0, 0, 0, 0);

      const { count: ordiniCompletatiMese, error: ordiniCompletatiError } = await supabaseServer
        .from('ordini_lavoro')
        .select('*', { count: 'exact', head: true })
        .eq('stato', 'completato')
        .gte('data_fine_effettiva', inizioMese.toISOString());

      if (ordiniCompletatiError) {
        return NextResponse.json({ error: ordiniCompletatiError.message }, { status: 500 });
      }

      // Fatturato del mese
      const { data: fattureDelMese, error: fattureError } = await supabaseServer
        .from('fatture')
        .select('importo_totale')
        .eq('stato', 'pagata')
        .gte('data_pagamento', inizioMese.toISOString());

      if (fattureError) {
        return NextResponse.json({ error: fattureError.message }, { status: 500 });
      }

      const fatturato = fattureDelMese?.reduce((sum, fattura) => sum + (fattura.importo_totale || 0), 0) || 0;

      // Clienti totali
      const { count: clientiTotali, error: clientiError } = await supabaseServer
        .from('clienti')
        .select('*', { count: 'exact', head: true });

      if (clientiError) {
        return NextResponse.json({ error: clientiError.message }, { status: 500 });
      }

      // Preventivi in attesa
      const { count: preventiviInAttesa, error: preventiviError } = await supabaseServer
        .from('preventivi')
        .select('*', { count: 'exact', head: true })
        .in('stato', ['bozza', 'inviato']);

      if (preventiviError) {
        return NextResponse.json({ error: preventiviError.message }, { status: 500 });
      }

      // Fatture scadute
      const oggi = new Date().toISOString().split('T')[0];
      const { count: fattureScadute, error: fattureScaduteError } = await supabaseServer
        .from('fatture')
        .select('*', { count: 'exact', head: true })
        .eq('stato', 'emessa')
        .lt('data_scadenza', oggi);

      if (fattureScaduteError) {
        return NextResponse.json({ error: fattureScaduteError.message }, { status: 500 });
      }

      stats.ordini_attivi = ordiniAttivi || 0;
      stats.ordini_completati_mese = ordiniCompletatiMese || 0;
      stats.fatturato_mese = fatturato;
      stats.clienti_totali = clientiTotali || 0;
      stats.preventivi_in_attesa = preventiviInAttesa || 0;
      stats.fatture_scadute = fattureScadute || 0;

    } else {
      // Statistiche per dipendenti
      
      // Ordini assegnati al dipendente
      const { count: ordiniAssegnati, error: ordiniAssegnatiError } = await supabaseServer
        .from('ordini_lavoro')
        .select('*', { count: 'exact', head: true })
        .eq('dipendente_id', user.id)
        .in('stato', ['in_attesa', 'in_lavorazione']);

      if (ordiniAssegnatiError) {
        return NextResponse.json({ error: ordiniAssegnatiError.message }, { status: 500 });
      }

      // Ordini in lavorazione
      const { count: ordiniInLavorazione, error: ordiniInLavorazioneError } = await supabaseServer
        .from('ordini_lavoro')
        .select('*', { count: 'exact', head: true })
        .eq('dipendente_id', user.id)
        .eq('stato', 'in_lavorazione');

      if (ordiniInLavorazioneError) {
        return NextResponse.json({ error: ordiniInLavorazioneError.message }, { status: 500 });
      }

      // Ordini completati oggi
      const oggi = new Date().toISOString().split('T')[0];
      const { count: ordiniCompletatiOggi, error: ordiniCompletatiOggiError } = await supabaseServer
        .from('ordini_lavoro')
        .select('*', { count: 'exact', head: true })
        .eq('dipendente_id', user.id)
        .eq('stato', 'completato')
        .gte('data_fine_effettiva', oggi);

      if (ordiniCompletatiOggiError) {
        return NextResponse.json({ error: ordiniCompletatiOggiError.message }, { status: 500 });
      }

      stats.ordini_assegnati = ordiniAssegnati || 0;
      stats.ordini_in_lavorazione = ordiniInLavorazione || 0;
      stats.ordini_completati_oggi = ordiniCompletatiOggi || 0;
    }

    return NextResponse.json(toCamelCase(stats));

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
