import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase } from '@/lib/supabase-helpers';
import { getCurrentUser } from '@/lib/auth';

// GET /api/dashboard/live - Dashboard live per admin
// Mostra tutti i dipendenti e chi sta lavorando in tempo reale
export async function GET(request: NextRequest) {
  try {
    // Verifica autenticazione
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Recupera tutti i dipendenti attivi
    const { data: dipendenti, error: dipendentiError } = await supabaseServer
      .from('users')
      .select('id, nome, cognome, email, ruolo, costo_orario')
      .eq('attivo', true)
      .order('cognome', { ascending: true });

    if (dipendentiError) {
      console.error('Errore recupero dipendenti:', dipendentiError);
      return NextResponse.json({ error: dipendentiError.message }, { status: 500 });
    }

    // Recupera tutte le sessioni attive (timer in corso)
    const { data: sessioniAttive, error: sessioniError } = await supabaseServer
      .from('ordini_lavoro_sessioni')
      .select(`
        *,
        user:users!ordini_lavoro_sessioni_user_id_fkey (
          id,
          nome,
          cognome,
          costo_orario
        ),
        ordine:ordini_lavoro!ordini_lavoro_sessioni_ordine_lavoro_id_fkey (
          id,
          numero_ordine,
          descrizione,
          stato,
          veicolo:veicoli!ordini_lavoro_veicolo_id_fkey (
            marca,
            modello,
            targa
          )
        )
      `)
      .is('end_time', null)
      .order('start_time', { ascending: false });

    if (sessioniError) {
      console.error('Errore recupero sessioni:', sessioniError);
      return NextResponse.json({ error: sessioniError.message }, { status: 500 });
    }

    // Mappa sessioni per user_id
    const sessioniPerDipendente = new Map();
    (sessioniAttive || []).forEach((sessione: any) => {
      sessioniPerDipendente.set(sessione.user_id, sessione);
    });

    // Combina dipendenti con stato lavoro
    const dipendentiConStato = (dipendenti || []).map((dip: any) => {
      const sessione = sessioniPerDipendente.get(dip.id);
      
      if (sessione) {
        // Calcola durata corrente
        const startTime = new Date(sessione.start_time);
        const now = new Date();
        const durationMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
        const durationHours = durationMinutes / 60;
        const costoAttuale = durationHours * (dip.costo_orario || 0);

        return {
          ...dip,
          stato: 'lavorando',
          sessione_attiva: {
            id: sessione.id,
            ordine_lavoro_id: sessione.ordine_lavoro_id,
            numero_ordine: sessione.ordine?.numero_ordine,
            descrizione: sessione.ordine?.descrizione,
            veicolo: sessione.ordine?.veicolo ?
              `${sessione.ordine.veicolo.marca} ${sessione.ordine.veicolo.modello} (${sessione.ordine.veicolo.targa})` :
              null,
            start_time: sessione.start_time,
            duration_minutes: durationMinutes,
            duration_hours: parseFloat(durationHours.toFixed(2)),
            costo_attuale: parseFloat(costoAttuale.toFixed(2))
          }
        };
      } else {
        return {
          ...dip,
          stato: 'disponibile',
          sessione_attiva: null
        };
      }
    });

    // Statistiche generali
    const dipendentiLavorando = dipendentiConStato.filter((d: any) => d.stato === 'lavorando');
    const dipendentiDisponibili = dipendentiConStato.filter((d: any) => d.stato === 'disponibile');

    // Calcola totale ore e costi in corso
    const totaleOreInCorso = dipendentiLavorando.reduce((sum: number, d: any) => {
      return sum + (d.sessione_attiva?.duration_hours || 0);
    }, 0);

    const totaleCostoInCorso = dipendentiLavorando.reduce((sum: number, d: any) => {
      return sum + (d.sessione_attiva?.costo_attuale || 0);
    }, 0);

    // Recupera ordini in corso
    const { data: ordiniInCorso } = await supabaseServer
      .from('ordini_lavoro')
      .select(`
        id,
        numero_ordine,
        descrizione,
        stato,
        data_inizio,
        veicolo:veicoli!ordini_lavoro_veicolo_id_fkey (
          marca,
          modello,
          targa
        ),
        cliente:clienti!ordini_lavoro_cliente_id_fkey (
          nome,
          cognome
        )
      `)
      .in('stato', ['in_progress', 'pending'])
      .order('data_inizio', { ascending: false })
      .limit(10);

    // Per ogni ordine, conta quanti dipendenti ci stanno lavorando
    const ordiniConDipendenti = await Promise.all(
      (ordiniInCorso || []).map(async (ordine: any) => {
        const { data: sessioniOrdine } = await supabaseServer
          .from('ordini_lavoro_sessioni')
          .select(`
            user:users!ordini_lavoro_sessioni_user_id_fkey (
              id,
              nome,
              cognome
            )
          `)
          .eq('ordine_lavoro_id', ordine.id)
          .is('end_time', null);

        return {
          ...ordine,
          dipendenti_attivi: (sessioniOrdine || []).map((s: any) => ({
            id: s.user?.id,
            nome: s.user?.nome,
            cognome: s.user?.cognome
          }))
        };
      })
    );

    return NextResponse.json(toCamelCase({
      dipendenti: dipendentiConStato,
      statistiche: {
        totale_dipendenti: dipendentiConStato.length,
        dipendenti_lavorando: dipendentiLavorando.length,
        dipendenti_disponibili: dipendentiDisponibili.length,
        totale_ore_in_corso: parseFloat(totaleOreInCorso.toFixed(2)),
        totale_costo_in_corso: parseFloat(totaleCostoInCorso.toFixed(2))
      },
      ordini_in_corso: ordiniConDipendenti,
      timestamp: new Date().toISOString()
    }));
  } catch (error: any) {
    console.error('Errore dashboard live:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

