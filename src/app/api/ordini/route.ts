import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase } from '@/lib/supabase-helpers';

// GET - Lista tutti gli ordini
export async function GET(request: NextRequest) {
  try {
    // Recupera ordini con relazioni
    const { data: ordini, error } = await supabaseServer
      .from('ordini_lavoro')
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
      .order('data_inizio', { ascending: false });

    if (error) {
      console.error('Errore nel recupero ordini:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Per ogni ordine, recupera i dipendenti assegnati
    const ordiniWithDipendenti = await Promise.all(
      (ordini || []).map(async (ordine: any) => {
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
          .eq('ordine_lavoro_id', ordine.id);

        return {
          ...ordine,
          dipendenti_assegnati: (dipendentiAssegnati || []).map((d: any) => d.dipendente?.id).filter(Boolean)
        };
      })
    );

    return NextResponse.json(toCamelCase(ordiniWithDipendenti));
  } catch (error: any) {
    console.error('Errore nel recupero ordini:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero degli ordini' },
      { status: 500 }
    );
  }
}

// POST - Crea nuovo ordine
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clienteId,
      veicoloId,
      descrizione,
      stato,
      priorita,
      dataInizio,
      dataFine,
      costoStimato,
      dipendentiIds,
      note
    } = body;

    // Validazione
    if (!clienteId || !descrizione) {
      return NextResponse.json(
        { error: 'Cliente e descrizione sono obbligatori' },
        { status: 400 }
      );
    }

    // Genera numero ordine
    const anno = new Date().getFullYear();
    const { data: ultimiOrdini } = await supabaseServer
      .from('ordini_lavoro')
      .select('numero_ordine')
      .like('numero_ordine', `ORD-${anno}-%`)
      .order('numero_ordine', { ascending: false })
      .limit(1);

    let numeroProgressivo = 1;
    if (ultimiOrdini && ultimiOrdini.length > 0) {
      const match = ultimiOrdini[0].numero_ordine.match(/ORD-\d{4}-(\d+)/);
      if (match) {
        numeroProgressivo = parseInt(match[1]) + 1;
      }
    }

    const numeroOrdine = `ORD-${anno}-${numeroProgressivo.toString().padStart(3, '0')}`;

    const now = new Date().toISOString();
    const ordineId = crypto.randomUUID();

    // Crea ordine
    const { data: ordine, error: ordineError } = await supabaseServer
      .from('ordini_lavoro')
      .insert({
        id: ordineId,
        numero_ordine: numeroOrdine,
        cliente_id: clienteId,
        veicolo_id: veicoloId || null,
        descrizione,
        stato: stato || 'in_attesa',
        priorita: priorita || 'media',
        data_inizio: dataInizio ? new Date(dataInizio).toISOString() : now,
        data_fine: dataFine ? new Date(dataFine).toISOString() : null,
        costo_stimato: parseFloat(costoStimato) || 0,
        tempo_lavorato: 0,
        note: note || null,
        updated_at: now
      })
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

    if (ordineError) {
      console.error('Errore nella creazione ordine:', ordineError);
      return NextResponse.json({ error: ordineError.message }, { status: 500 });
    }

    // Assegna dipendenti se specificati
    if (dipendentiIds && dipendentiIds.length > 0) {
      const assegnazioni = dipendentiIds.map((dipId: string) => ({
        id: crypto.randomUUID(),
        dipendente_id: dipId,
        ordine_lavoro_id: ordineId
      }));

      const { error: assegnazioniError } = await supabaseServer
        .from('dipendenti_ordini')
        .insert(assegnazioni);

      if (assegnazioniError) {
        console.error('Errore nell\'assegnazione dipendenti:', assegnazioniError);
        // Non blocchiamo la creazione dell'ordine per questo errore
      }
    }

    return NextResponse.json(toCamelCase(ordine), { status: 201 });
  } catch (error: any) {
    console.error('Errore nella creazione ordine:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione dell\'ordine' },
      { status: 500 }
    );
  }
}

