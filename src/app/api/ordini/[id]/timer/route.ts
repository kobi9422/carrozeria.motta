import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase, generateUUID } from '@/lib/supabase-helpers';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/ordini/[id]/timer - Start timer per ordine
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticazione
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, JWT_SECRET) as any;
    const userId = decoded.userId;

    // Verifica che l'ordine esista
    const { data: ordine, error: ordineError } = await supabaseServer
      .from('ordini_lavoro')
      .select('id, numero_ordine, descrizione, stato')
      .eq('id', params.id)
      .single();

    if (ordineError || !ordine) {
      return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });
    }

    // Verifica che non ci sia già un timer attivo per QUESTO SPECIFICO ordine
    const { data: timerAttivoOrdine } = await supabaseServer
      .from('ordini_lavoro_sessioni')
      .select('id')
      .eq('user_id', userId)
      .eq('ordine_lavoro_id', params.id)
      .is('end_time', null)
      .single();

    if (timerAttivoOrdine) {
      return NextResponse.json(
        { error: 'Hai già un timer attivo per questo ordine.' },
        { status: 400 }
      );
    }

    // Crea nuova sessione
    const sessioneId = generateUUID();
    const now = new Date().toISOString();

    const { data: sessione, error: sessioneError } = await supabaseServer
      .from('ordini_lavoro_sessioni')
      .insert({
        id: sessioneId,
        ordine_lavoro_id: params.id,
        user_id: userId,
        start_time: now,
        created_at: now
      })
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
          stato
        )
      `)
      .single();

    if (sessioneError || !sessione) {
      console.error('Errore creazione sessione:', sessioneError);
      return NextResponse.json(
        { error: sessioneError?.message || 'Errore creazione sessione' },
        { status: 500 }
      );
    }

    return NextResponse.json(toCamelCase({
      message: 'Timer avviato',
      sessione
    }), { status: 201 });
  } catch (error: any) {
    console.error('Errore start timer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/ordini/[id]/timer - Stop timer per ordine
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticazione
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, JWT_SECRET) as any;
    const userId = decoded.userId;

    // Trova sessione attiva per questo ordine e utente
    const { data: sessione, error: sessioneError } = await supabaseServer
      .from('ordini_lavoro_sessioni')
      .select('*')
      .eq('ordine_lavoro_id', params.id)
      .eq('user_id', userId)
      .is('end_time', null)
      .single();

    if (sessioneError || !sessione) {
      return NextResponse.json(
        { error: 'Nessun timer attivo trovato per questo ordine' },
        { status: 404 }
      );
    }

    // Calcola durata
    const startTime = new Date(sessione.start_time);
    const endTime = new Date();
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

    // Aggiorna sessione
    const { data: sessioneAggiornata, error: updateError } = await supabaseServer
      .from('ordini_lavoro_sessioni')
      .update({
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes
      })
      .eq('id', sessione.id)
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
          stato
        )
      `)
      .single();

    if (updateError || !sessioneAggiornata) {
      console.error('Errore aggiornamento sessione:', updateError);
      return NextResponse.json(
        { error: updateError?.message || 'Errore aggiornamento sessione' },
        { status: 500 }
      );
    }

    // Calcola costo
    const durationHours = durationMinutes / 60;
    const costoOrario = sessioneAggiornata.user?.costo_orario || 0;
    const costo = durationHours * costoOrario;

    return NextResponse.json(toCamelCase({
      message: 'Timer fermato',
      sessione: sessioneAggiornata,
      riepilogo: {
        duration_minutes: durationMinutes,
        duration_hours: parseFloat(durationHours.toFixed(2)),
        costo_orario: costoOrario,
        costo_totale: parseFloat(costo.toFixed(2))
      }
    }));
  } catch (error: any) {
    console.error('Errore stop timer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/ordini/[id]/timer - Get timer attivo per ordine
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticazione
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, JWT_SECRET) as any;
    const userId = decoded.userId;

    // Trova sessione attiva per questo ordine e utente
    const { data: sessione } = await supabaseServer
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
          stato
        )
      `)
      .eq('ordine_lavoro_id', params.id)
      .eq('user_id', userId)
      .is('end_time', null)
      .single();

    if (!sessione) {
      return NextResponse.json({ timer_attivo: false, sessione: null });
    }

    // Calcola durata corrente
    const startTime = new Date(sessione.start_time);
    const now = new Date();
    const durationMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
    const durationHours = durationMinutes / 60;
    const costoOrario = sessione.user?.costo_orario || 0;
    const costoAttuale = durationHours * costoOrario;

    return NextResponse.json(toCamelCase({
      timer_attivo: true,
      sessione,
      riepilogo: {
        duration_minutes: durationMinutes,
        duration_hours: parseFloat(durationHours.toFixed(2)),
        costo_orario: costoOrario,
        costo_attuale: parseFloat(costoAttuale.toFixed(2))
      }
    }));
  } catch (error: any) {
    console.error('Errore get timer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

