import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase } from '@/lib/supabase-helpers';
import { getCurrentUser } from '@/lib/auth';

// GET /api/timer/attivi - Ottieni tutti i timer attivi (solo admin)
export async function GET(request: NextRequest) {
  try {
    // Verifica autenticazione e ruolo admin
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (user.ruolo !== 'admin') {
      return NextResponse.json({ error: 'Solo gli admin possono vedere tutti i timer' }, { status: 403 });
    }

    // Ottieni tutte le sessioni attive (end_time = null)
    const { data: sessioni, error } = await supabaseServer
      .from('ordini_lavoro_sessioni')
      .select(`
        *,
        user:users!ordini_lavoro_sessioni_user_id_fkey (
          id,
          nome,
          cognome,
          email,
          costo_orario
        ),
        ordine:ordini_lavoro!ordini_lavoro_sessioni_ordine_lavoro_id_fkey (
          id,
          numero_ordine,
          descrizione,
          stato,
          clienti (
            id,
            nome,
            cognome
          ),
          veicoli (
            id,
            marca,
            modello,
            targa
          )
        )
      `)
      .is('end_time', null)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Errore recupero timer attivi:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calcola durata e costo per ogni sessione
    const sessioniConDettagli = (sessioni || []).map((sessione: any) => {
      const startTime = new Date(sessione.start_time);
      const now = new Date();
      const durationMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
      const durationHours = durationMinutes / 60;
      const costoOrario = sessione.user?.costo_orario || 0;
      const costoAttuale = durationHours * costoOrario;

      return {
        ...sessione,
        riepilogo: {
          duration_minutes: durationMinutes,
          duration_hours: parseFloat(durationHours.toFixed(2)),
          costo_orario: costoOrario,
          costo_attuale: parseFloat(costoAttuale.toFixed(2))
        }
      };
    });

    return NextResponse.json(toCamelCase(sessioniConDettagli));

  } catch (error: any) {
    console.error('Errore GET /api/timer/attivi:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

