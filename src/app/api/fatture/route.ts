import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase, generateUUID } from '@/lib/supabase-helpers';

// GET /api/fatture - Ottieni tutte le fatture
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stato = searchParams.get('stato');

    let query = supabaseServer
      .from('fatture')
      .select(`
        *,
        cliente:clienti!fatture_cliente_id_fkey (
          id,
          nome,
          cognome,
          email,
          telefono,
          partita_iva,
          codice_fiscale
        ),
        voci:voci_fattura (*)
      `)
      .order('data_emissione', { ascending: false });

    if (stato && stato !== 'tutti') {
      query = query.eq('stato', stato);
    }

    const { data: fatture, error } = await query;

    if (error) {
      console.error('Errore Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(fatture || []));
  } catch (error: any) {
    console.error('Errore GET /api/fatture:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/fatture - Crea una nuova fattura
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clienteId, dataScadenza, voci, note } = body;

    // Validazione
    if (!clienteId || !dataScadenza || !voci || voci.length === 0) {
      return NextResponse.json(
        { error: 'Cliente, data scadenza e almeno una voce sono obbligatori' },
        { status: 400 }
      );
    }

    // Calcola importo totale
    const importoTotale = voci.reduce((sum: number, voce: any) => {
      return sum + (voce.quantita * voce.prezzoUnitario);
    }, 0);

    // Genera numero fattura
    const anno = new Date().getFullYear();
    const { data: ultimeFatture } = await supabaseServer
      .from('fatture')
      .select('numero_fattura')
      .like('numero_fattura', `FATT-${anno}-%`)
      .order('numero_fattura', { ascending: false })
      .limit(1);

    let numeroProgressivo = 1;
    if (ultimeFatture && ultimeFatture.length > 0) {
      const match = ultimeFatture[0].numero_fattura.match(/FATT-\d{4}-(\d+)/);
      if (match) {
        numeroProgressivo = parseInt(match[1]) + 1;
      }
    }

    const numeroFattura = `FATT-${anno}-${numeroProgressivo.toString().padStart(3, '0')}`;

    // Genera ID per la fattura
    const fatturaId = generateUUID();

    // Crea fattura
    const { data: fattura, error: fattError } = await supabaseServer
      .from('fatture')
      .insert({
        id: fatturaId,
        numero_fattura: numeroFattura,
        cliente_id: clienteId,
        data_scadenza: dataScadenza,
        importo_totale: importoTotale,
        note: note || null,
        stato: 'emessa'
      })
      .select()
      .single();

    if (fattError || !fattura) {
      console.error('Errore creazione fattura:', fattError);
      return NextResponse.json({ error: fattError?.message || 'Errore creazione fattura' }, { status: 500 });
    }

    // Crea voci fattura
    const vociData = voci.map((voce: any) => ({
      id: generateUUID(),
      fattura_id: fattura.id,
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

    // Recupera fattura completa
    const { data: fatturaCompleta } = await supabaseServer
      .from('fatture')
      .select(`
        *,
        cliente:clienti!fatture_cliente_id_fkey (*),
        voci:voci_fattura (*)
      `)
      .eq('id', fattura.id)
      .single();

    return NextResponse.json(toCamelCase(fatturaCompleta), { status: 201 });
  } catch (error: any) {
    console.error('Errore POST /api/fatture:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

