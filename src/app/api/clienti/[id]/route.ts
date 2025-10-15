import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { toCamelCase } from '@/lib/supabase-helpers';

// GET /api/clienti/[id] - Ottieni un cliente specifico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticazione
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from('clienti')
      .select(`
        *,
        veicoli (*)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(data));

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/clienti/[id] - Aggiorna un cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticazione
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { nome, cognome, telefono, email, indirizzo, citta, cap, note } = body;

    // Validazione base
    if (!nome || !cognome) {
      return NextResponse.json({ error: 'Nome e cognome sono obbligatori' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('clienti')
      .update({
        nome,
        cognome,
        telefono,
        email,
        indirizzo,
        citta,
        cap,
        note
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(data));

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clienti/[id] - Elimina un cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticazione e che sia admin
    const user = await getCurrentUser();
    if (!user || user.ruolo !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Verifica se il cliente ha ordini di lavoro associati
    const { data: ordini, error: ordiniError } = await supabaseServer
      .from('ordini_lavoro')
      .select('id')
      .eq('cliente_id', params.id)
      .limit(1);

    if (ordiniError) {
      return NextResponse.json({ error: ordiniError.message }, { status: 500 });
    }

    if (ordini && ordini.length > 0) {
      return NextResponse.json({
        error: 'Impossibile eliminare il cliente: ha ordini di lavoro associati'
      }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('clienti')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Cliente eliminato con successo' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
