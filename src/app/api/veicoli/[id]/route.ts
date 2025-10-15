import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase } from '@/lib/supabase-helpers';
import { getCurrentUser } from '@/lib/auth';

// GET /api/veicoli/[id] - Ottieni un veicolo specifico
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
      .from('veicoli')
      .select(`
        *,
        cliente:clienti!veicoli_cliente_id_fkey (
          id,
          nome,
          cognome,
          email,
          telefono
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(data));

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/veicoli/[id] - Modifica un veicolo
export async function PATCH(
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
    const { clienteId, marca, modello, anno, targa, colore, numeroTelaio, cilindrata, alimentazione, note } = body;

    // Prepara dati per update
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (clienteId !== undefined) updateData.cliente_id = clienteId;
    if (marca !== undefined) updateData.marca = marca;
    if (modello !== undefined) updateData.modello = modello;
    if (anno !== undefined) updateData.anno = anno;
    if (targa !== undefined) updateData.targa = targa;
    if (colore !== undefined) updateData.colore = colore;
    if (numeroTelaio !== undefined) updateData.numero_telaio = numeroTelaio;
    if (cilindrata !== undefined) updateData.cilindrata = cilindrata;
    if (alimentazione !== undefined) updateData.alimentazione = alimentazione;
    if (note !== undefined) updateData.note = note;

    const { data, error } = await supabaseServer
      .from('veicoli')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        cliente:clienti!veicoli_cliente_id_fkey (
          id,
          nome,
          cognome
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(data));

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/veicoli/[id] - Elimina un veicolo
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

    // Verifica se il veicolo ha ordini di lavoro associati
    const { data: ordini, error: ordiniError } = await supabaseServer
      .from('ordini_lavoro')
      .select('id')
      .eq('veicolo_id', params.id)
      .limit(1);

    if (ordiniError) {
      return NextResponse.json({ error: ordiniError.message }, { status: 500 });
    }

    if (ordini && ordini.length > 0) {
      return NextResponse.json(
        { error: 'Impossibile eliminare: il veicolo ha ordini di lavoro associati' },
        { status: 400 }
      );
    }

    // Elimina il veicolo
    const { error } = await supabaseServer
      .from('veicoli')
      .delete()
      .eq('id', params.id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Veicolo eliminato con successo' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

