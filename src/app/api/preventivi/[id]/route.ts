import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase } from '@/lib/supabase-helpers';

// GET /api/preventivi/[id] - Ottieni un preventivo specifico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: preventivo, error } = await supabaseServer
      .from('preventivi')
      .select(`
        *,
        cliente:clienti!preventivi_cliente_id_fkey (*),
        voci:voci_preventivo (*)
      `)
      .eq('id', params.id)
      .single();

    if (error || !preventivo) {
      return NextResponse.json({ error: 'Preventivo non trovato' }, { status: 404 });
    }

    return NextResponse.json(toCamelCase(preventivo));
  } catch (error: any) {
    console.error('Errore GET /api/preventivi/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/preventivi/[id] - Aggiorna un preventivo
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { stato, titolo, descrizione, dataScadenza, voci, note } = body;

    // Se vengono aggiornate le voci, ricalcola il totale
    let importoTotale;
    if (voci) {
      importoTotale = voci.reduce((sum: number, voce: any) => {
        return sum + (voce.quantita * voce.prezzoUnitario);
      }, 0);

      // Elimina vecchie voci
      await supabaseServer
        .from('voci_preventivo')
        .delete()
        .eq('preventivo_id', params.id);
    }

    // Prepara dati aggiornamento
    const updateData: any = {};
    if (stato) updateData.stato = stato;
    if (titolo) updateData.titolo = titolo;
    if (descrizione !== undefined) updateData.descrizione = descrizione;
    if (dataScadenza) updateData.data_scadenza = dataScadenza;
    if (importoTotale !== undefined) updateData.importo_totale = importoTotale;
    if (note !== undefined) updateData.note = note;

    // Aggiorna preventivo
    const { error: updateError } = await supabaseServer
      .from('preventivi')
      .update(updateData)
      .eq('id', params.id);

    if (updateError) {
      console.error('Errore aggiornamento preventivo:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Se ci sono nuove voci, creale
    if (voci) {
      const vociData = voci.map((voce: any) => ({
        preventivo_id: params.id,
        descrizione: voce.descrizione,
        quantita: voce.quantita,
        prezzo_unitario: voce.prezzoUnitario,
        totale: voce.quantita * voce.prezzoUnitario
      }));

      const { error: vociError } = await supabaseServer
        .from('voci_preventivo')
        .insert(vociData);

      if (vociError) {
        console.error('Errore creazione voci:', vociError);
        return NextResponse.json({ error: vociError.message }, { status: 500 });
      }
    }

    // Recupera preventivo aggiornato
    const { data: preventivo } = await supabaseServer
      .from('preventivi')
      .select(`
        *,
        cliente:clienti!preventivi_cliente_id_fkey (*),
        voci:voci_preventivo (*)
      `)
      .eq('id', params.id)
      .single();

    return NextResponse.json(toCamelCase(preventivo));
  } catch (error: any) {
    console.error('Errore PATCH /api/preventivi/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/preventivi/[id] - Elimina un preventivo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Prima elimina le voci (foreign key)
    await supabaseServer
      .from('voci_preventivo')
      .delete()
      .eq('preventivo_id', params.id);

    // Poi elimina il preventivo
    const { error } = await supabaseServer
      .from('preventivi')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Errore eliminazione preventivo:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Preventivo eliminato con successo' });
  } catch (error: any) {
    console.error('Errore DELETE /api/preventivi/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

