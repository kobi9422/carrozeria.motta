import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase } from '@/lib/supabase-helpers';

// GET /api/fatture/[id] - Ottieni una fattura specifica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: fattura, error } = await supabaseServer
      .from('fatture')
      .select(`
        *,
        cliente:clienti!fatture_cliente_id_fkey (*),
        voci:voci_fattura (*)
      `)
      .eq('id', params.id)
      .single();

    if (error || !fattura) {
      return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 });
    }

    return NextResponse.json(toCamelCase(fattura));
  } catch (error: any) {
    console.error('Errore GET /api/fatture/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/fatture/[id] - Aggiorna una fattura
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { stato, dataScadenza, dataPagamento, voci, note } = body;

    // Se vengono aggiornate le voci, ricalcola il totale
    let importoTotale;
    if (voci) {
      importoTotale = voci.reduce((sum: number, voce: any) => {
        return sum + (voce.quantita * voce.prezzoUnitario);
      }, 0);

      // Elimina vecchie voci
      await supabaseServer
        .from('voci_fattura')
        .delete()
        .eq('fattura_id', params.id);
    }

    // Prepara dati aggiornamento
    const updateData: any = {};
    if (stato) updateData.stato = stato;
    if (dataScadenza) updateData.data_scadenza = dataScadenza;
    if (dataPagamento !== undefined) updateData.data_pagamento = dataPagamento || null;
    if (importoTotale !== undefined) updateData.importo_totale = importoTotale;
    if (note !== undefined) updateData.note = note;

    // Aggiorna fattura
    const { error: updateError } = await supabaseServer
      .from('fatture')
      .update(updateData)
      .eq('id', params.id);

    if (updateError) {
      console.error('Errore aggiornamento fattura:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Se ci sono nuove voci, creale
    if (voci) {
      const vociData = voci.map((voce: any) => ({
        fattura_id: params.id,
        descrizione: voce.descrizione,
        quantita: voce.quantita,
        prezzo_unitario: voce.prezzoUnitario,
        totale: voce.quantita * voce.prezzoUnitario
      }));

      const { error: vociError } = await supabaseServer
        .from('voci_fattura')
        .insert(vociData);

      if (vociError) {
        console.error('Errore creazione voci:', vociError);
        return NextResponse.json({ error: vociError.message }, { status: 500 });
      }
    }

    // Recupera fattura aggiornata
    const { data: fattura } = await supabaseServer
      .from('fatture')
      .select(`
        *,
        cliente:clienti!fatture_cliente_id_fkey (*),
        voci:voci_fattura (*)
      `)
      .eq('id', params.id)
      .single();

    return NextResponse.json(toCamelCase(fattura));
  } catch (error: any) {
    console.error('Errore PATCH /api/fatture/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/fatture/[id] - Elimina una fattura
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Prima elimina le voci (foreign key)
    await supabaseServer
      .from('voci_fattura')
      .delete()
      .eq('fattura_id', params.id);

    // Poi elimina la fattura
    const { error } = await supabaseServer
      .from('fatture')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Errore eliminazione fattura:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Fattura eliminata con successo' });
  } catch (error: any) {
    console.error('Errore DELETE /api/fatture/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

