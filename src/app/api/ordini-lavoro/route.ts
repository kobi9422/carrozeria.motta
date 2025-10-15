import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { toCamelCase, generateUUID } from '@/lib/supabase-helpers';

// GET /api/ordini-lavoro - Ottieni tutti gli ordini di lavoro
export async function GET(request: NextRequest) {
  try {
    // Verifica autenticazione
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const stato = searchParams.get('stato');
    const dipendenteId = searchParams.get('dipendente_id');

    let query = supabaseServer
      .from('ordini_lavoro')
      .select(`
        *,
        clienti (
          id,
          nome,
          cognome,
          telefono,
          email
        ),
        veicoli (
          id,
          marca,
          modello,
          targa,
          colore
        ),
        users (
          id,
          nome,
          cognome
        )
      `, { count: 'exact' });

    // Se l'utente è un dipendente, mostra solo i suoi ordini
    if (user.ruolo === 'employee') {
      query = query.eq('dipendente_id', user.id);
    }

    // Filtro per dipendente specifico (solo per admin)
    if (dipendenteId && user.ruolo === 'admin') {
      query = query.eq('dipendente_id', dipendenteId);
    }

    // Filtro per stato
    if (stato) {
      query = query.eq('stato', stato);
    }

    // Filtro di ricerca
    if (search) {
      query = query.or(`numero_ordine.ilike.%${search}%,titolo.ilike.%${search}%,descrizione.ilike.%${search}%`);
    }

    // Paginazione
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Ordinamento
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: toCamelCase(data || []),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/ordini-lavoro - Crea un nuovo ordine di lavoro
export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione e che sia admin
    const user = await getCurrentUser();
    if (!user || user.ruolo !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const {
      cliente_id,
      veicolo_id,
      dipendente_id,
      titolo,
      descrizione,
      stato,
      data_inizio,
      data_fine_prevista,
      costo_stimato,
      note
    } = body;

    // Validazione base
    if (!cliente_id || !veicolo_id || !titolo || !descrizione || !data_inizio) {
      return NextResponse.json({
        error: 'Cliente, veicolo, titolo, descrizione e data inizio sono obbligatori'
      }, { status: 400 });
    }

    // Genera numero ordine automatico
    const { data: numeroOrdine, error: numeroError } = await supabaseServer
      .rpc('generate_numero_ordine');

    if (numeroError) {
      return NextResponse.json({ error: numeroError.message }, { status: 500 });
    }

    const { data, error } = await supabaseServer
      .from('ordini_lavoro')
      .insert({
        id: generateUUID(),
        numero_ordine: numeroOrdine,
        cliente_id,
        veicolo_id,
        dipendente_id,
        titolo,
        descrizione,
        stato: stato || 'in_attesa',
        data_inizio,
        data_fine_prevista,
        costo_stimato,
        note,
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        clienti (
          id,
          nome,
          cognome,
          telefono,
          email
        ),
        veicoli (
          id,
          marca,
          modello,
          targa,
          colore
        ),
        users (
          id,
          nome,
          cognome
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(data), { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
