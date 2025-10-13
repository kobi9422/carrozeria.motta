import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

// GET /api/veicoli - Ottieni tutti i veicoli
export async function GET(request: NextRequest) {
  try {
    // Verifica autenticazione
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database non configurato' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const clienteId = searchParams.get('cliente_id');

    let query = supabase
      .from('veicoli')
      .select(`
        *,
        clienti (
          id,
          nome,
          cognome
        )
      `, { count: 'exact' });

    // Filtro per cliente specifico
    if (clienteId) {
      query = query.eq('cliente_id', clienteId);
    }

    // Filtro di ricerca
    if (search) {
      query = query.or(`marca.ilike.%${search}%,modello.ilike.%${search}%,targa.ilike.%${search}%`);
    }

    // Paginazione
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Ordinamento
    query = query.order('marca', { ascending: true }).order('modello', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
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

// POST /api/veicoli - Crea un nuovo veicolo
export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database non configurato' }, { status: 500 });
    }

    const body = await request.json();
    const { cliente_id, marca, modello, anno, targa, colore, numero_telaio, note } = body;

    // Validazione base
    if (!cliente_id || !marca || !modello || !targa) {
      return NextResponse.json({ 
        error: 'Cliente, marca, modello e targa sono obbligatori' 
      }, { status: 400 });
    }

    // Verifica che il cliente esista
    const { data: cliente, error: clienteError } = await supabase
      .from('clienti')
      .select('id')
      .eq('id', cliente_id)
      .single();

    if (clienteError || !cliente) {
      return NextResponse.json({ error: 'Cliente non trovato' }, { status: 400 });
    }

    // Verifica che la targa non sia già in uso
    const { data: targaEsistente, error: targaError } = await supabase
      .from('veicoli')
      .select('id')
      .eq('targa', targa)
      .single();

    if (targaError && targaError.code !== 'PGRST116') {
      return NextResponse.json({ error: targaError.message }, { status: 500 });
    }

    if (targaEsistente) {
      return NextResponse.json({ error: 'Targa già esistente' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('veicoli')
      .insert({
        cliente_id,
        marca,
        modello,
        anno,
        targa,
        colore,
        numero_telaio,
        note
      })
      .select(`
        *,
        clienti (
          id,
          nome,
          cognome
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
