import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase } from '@/lib/supabase-helpers';

// GET - Lista tutte le sessioni di lavoro (timer)
// Query params:
// - userId: filtra per dipendente specifico
// - jobId: filtra per ordine di lavoro specifico
// - active: true per vedere solo timer attivi (in corso)
// - startDate: data inizio periodo
// - endDate: data fine periodo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const jobId = searchParams.get('jobId');
    const active = searchParams.get('active') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabaseServer
      .from('job_sessions')
      .select(`
        *,
        user:users!job_sessions_user_id_fkey (
          id,
          nome,
          cognome,
          email,
          costo_orario
        ),
        job:jobs!job_sessions_job_id_fkey (
          id,
          title,
          description,
          status
        )
      `)
      .order('start_time', { ascending: false });

    // Filtri
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    if (active) {
      query = query.is('end_time', null);
    }

    if (startDate) {
      query = query.gte('start_time', startDate);
    }

    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Errore nel recupero sessioni:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calcola statistiche per ogni sessione
    const sessionsWithStats = (sessions || []).map((session: any) => {
      const startTime = new Date(session.start_time);
      const endTime = session.end_time ? new Date(session.end_time) : new Date();
      const durationMinutes = session.duration_minutes || Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
      const durationHours = durationMinutes / 60;
      const costoOrario = session.user?.costo_orario || 0;
      const costoTotale = durationHours * costoOrario;

      return {
        ...session,
        duration_minutes: durationMinutes,
        duration_hours: durationHours,
        costo_totale: costoTotale,
        is_active: !session.end_time
      };
    });

    return NextResponse.json(toCamelCase(sessionsWithStats));
  } catch (error: any) {
    console.error('Errore nel recupero sessioni:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle sessioni' },
      { status: 500 }
    );
  }
}

// POST - Avvia un nuovo timer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, jobId } = body;

    // Validazione
    if (!userId || !jobId) {
      return NextResponse.json(
        { error: 'userId e jobId sono obbligatori' },
        { status: 400 }
      );
    }

    // Verifica se c'è già un timer attivo per questo utente
    const { data: activeSession } = await supabaseServer
      .from('job_sessions')
      .select('id')
      .eq('user_id', userId)
      .is('end_time', null)
      .single();

    if (activeSession) {
      return NextResponse.json(
        { error: 'Hai già un timer attivo. Fermalo prima di avviarne uno nuovo.' },
        { status: 400 }
      );
    }

    // Crea nuova sessione
    const { data: session, error } = await supabaseServer
      .from('job_sessions')
      .insert({
        user_id: userId,
        job_id: jobId,
        start_time: new Date().toISOString()
      })
      .select(`
        *,
        user:users!job_sessions_user_id_fkey (
          id,
          nome,
          cognome,
          email,
          costo_orario
        ),
        job:jobs!job_sessions_job_id_fkey (
          id,
          title,
          description,
          status
        )
      `)
      .single();

    if (error) {
      console.error('Errore nella creazione sessione:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(session), { status: 201 });
  } catch (error: any) {
    console.error('Errore nella creazione sessione:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione della sessione' },
      { status: 500 }
    );
  }
}

// PATCH - Ferma un timer attivo
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    // Validazione
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId è obbligatorio' },
        { status: 400 }
      );
    }

    // Recupera la sessione
    const { data: session, error: fetchError } = await supabaseServer
      .from('job_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Sessione non trovata' },
        { status: 404 }
      );
    }

    if (session.end_time) {
      return NextResponse.json(
        { error: 'Questa sessione è già stata fermata' },
        { status: 400 }
      );
    }

    // Calcola durata
    const startTime = new Date(session.start_time);
    const endTime = new Date();
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

    // Aggiorna sessione
    const { data: updatedSession, error: updateError } = await supabaseServer
      .from('job_sessions')
      .update({
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes
      })
      .eq('id', sessionId)
      .select(`
        *,
        user:users!job_sessions_user_id_fkey (
          id,
          nome,
          cognome,
          email,
          costo_orario
        ),
        job:jobs!job_sessions_job_id_fkey (
          id,
          title,
          description,
          status
        )
      `)
      .single();

    if (updateError) {
      console.error('Errore nell\'aggiornamento sessione:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Calcola costo
    const durationHours = durationMinutes / 60;
    const costoOrario = updatedSession.user?.costo_orario || 0;
    const costoTotale = durationHours * costoOrario;

    return NextResponse.json(toCamelCase({
      ...updatedSession,
      duration_hours: durationHours,
      costo_totale: costoTotale
    }));
  } catch (error: any) {
    console.error('Errore nell\'aggiornamento sessione:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento della sessione' },
      { status: 500 }
    );
  }
}

