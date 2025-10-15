import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase } from '@/lib/supabase-helpers';

// GET - Ottieni singolo ordine
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: ordine, error } = await supabaseServer
      .from('ordini_lavoro')
      .select(`
        *,
        cliente:clienti!ordini_lavoro_cliente_id_fkey (
          id,
          nome,
          cognome,
          email,
          telefono
        ),
        veicolo:veicoli!ordini_lavoro_veicolo_id_fkey (
          id,
          marca,
          modello,
          targa,
          anno
        )
      `)
      .eq('id', params.id)
      .single();

    if (error || !ordine) {
      return NextResponse.json(
        { error: 'Ordine non trovato' },
        { status: 404 }
      );
    }

    // Recupera dipendenti assegnati
    const { data: dipendentiAssegnati } = await supabaseServer
      .from('dipendenti_ordini')
      .select(`
        dipendente:users!dipendenti_ordini_dipendente_id_fkey (
          id,
          nome,
          cognome,
          email
        )
      `)
      .eq('ordine_lavoro_id', params.id);

    const ordineWithDipendenti = {
      ...ordine,
      dipendenti_assegnati: (dipendentiAssegnati || []).map((d: any) => d.dipendente).filter(Boolean)
    };

    return NextResponse.json(toCamelCase(ordineWithDipendenti));
  } catch (error: any) {
    console.error('Errore nel recupero ordine:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dell\'ordine' },
      { status: 500 }
    );
  }
}

// PATCH - Aggiorna ordine
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      descrizione,
      stato,
      priorita,
      dataInizio,
      dataFine,
      costoStimato,
      tempoLavorato,
      dipendentiIds,
      note
    } = body;

    // Prepara i dati da aggiornare
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (descrizione !== undefined) updateData.descrizione = descrizione;
    if (stato !== undefined) updateData.stato = stato;
    if (priorita !== undefined) updateData.priorita = priorita;
    if (dataInizio !== undefined) updateData.data_inizio = new Date(dataInizio).toISOString();
    if (dataFine !== undefined) updateData.data_fine = dataFine ? new Date(dataFine).toISOString() : null;
    if (costoStimato !== undefined) updateData.costo_stimato = parseFloat(costoStimato);
    if (tempoLavorato !== undefined) updateData.tempo_lavorato = parseInt(tempoLavorato);
    if (note !== undefined) updateData.note = note;

    // Aggiorna ordine
    const { data: ordine, error: updateError } = await supabaseServer
      .from('ordini_lavoro')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        cliente:clienti!ordini_lavoro_cliente_id_fkey (
          id,
          nome,
          cognome
        ),
        veicolo:veicoli!ordini_lavoro_veicolo_id_fkey (
          id,
          marca,
          modello,
          targa
        )
      `)
      .single();

    if (updateError) {
      console.error('Errore nell\'aggiornamento ordine:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Gestione dipendenti assegnati
    if (dipendentiIds !== undefined) {
      // Rimuovi tutte le assegnazioni esistenti
      await supabaseServer
        .from('dipendenti_ordini')
        .delete()
        .eq('ordine_lavoro_id', params.id);

      // Crea nuove assegnazioni
      if (dipendentiIds.length > 0) {
        const assegnazioni = dipendentiIds.map((dipId: string) => ({
          id: crypto.randomUUID(),
          dipendente_id: dipId,
          ordine_lavoro_id: params.id
        }));

        await supabaseServer
          .from('dipendenti_ordini')
          .insert(assegnazioni);
      }
    }

    // Recupera dipendenti assegnati
    const { data: dipendentiAssegnati } = await supabaseServer
      .from('dipendenti_ordini')
      .select(`
        dipendente:users!dipendenti_ordini_dipendente_id_fkey (
          id,
          nome,
          cognome,
          email
        )
      `)
      .eq('ordine_lavoro_id', params.id);

    const ordineWithDipendenti = {
      ...ordine,
      dipendenti_assegnati: (dipendentiAssegnati || []).map((d: any) => d.dipendente).filter(Boolean)
    };

    return NextResponse.json(toCamelCase(ordineWithDipendenti));
  } catch (error: any) {
    console.error('Errore nell\'aggiornamento ordine:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento dell\'ordine' },
      { status: 500 }
    );
  }
}

// DELETE - Elimina ordine
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Prima elimina le relazioni con i dipendenti
    await supabaseServer
      .from('dipendenti_ordini')
      .delete()
      .eq('ordine_lavoro_id', params.id);

    // Poi elimina l'ordine
    const { error } = await supabaseServer
      .from('ordini_lavoro')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Errore nell\'eliminazione ordine:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Ordine eliminato con successo' });
  } catch (error: any) {
    console.error('Errore nell\'eliminazione ordine:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione dell\'ordine' },
      { status: 500 }
    );
  }
}

