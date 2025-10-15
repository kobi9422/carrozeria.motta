import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase } from '@/lib/supabase-helpers';

// GET /api/preventivi - Ottieni tutti i preventivi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stato = searchParams.get('stato');

    let query = supabaseServer
      .from('preventivi')
      .select(`
        *,
        cliente:clienti!preventivi_cliente_id_fkey (
          id,
          nome,
          cognome,
          email,
          telefono
        ),
        voci:voci_preventivo (*)
      `)
      .order('data_creazione', { ascending: false });

    if (stato && stato !== 'tutti') {
      query = query.eq('stato', stato);
    }

    const { data: preventivi, error } = await query;

    if (error) {
      console.error('Errore Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(preventivi || []));
  } catch (error: any) {
    console.error('Errore GET /api/preventivi:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/preventivi - Crea un nuovo preventivo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clienteId, titolo, descrizione, dataScadenza, voci, note } = body;

    // Validazione
    if (!clienteId || !titolo || !voci || voci.length === 0) {
      return NextResponse.json(
        { error: 'Cliente, titolo e almeno una voce sono obbligatori' },
        { status: 400 }
      );
    }

    // Calcola importo totale
    const importoTotale = voci.reduce((sum: number, voce: any) => {
      return sum + (voce.quantita * voce.prezzoUnitario);
    }, 0);

    // Genera numero preventivo
    const anno = new Date().getFullYear();
    const { data: ultimiPreventivi } = await supabaseServer
      .from('preventivi')
      .select('numero_preventivo')
      .like('numero_preventivo', `PREV-${anno}-%`)
      .order('numero_preventivo', { ascending: false })
      .limit(1);

    let numeroProgressivo = 1;
    if (ultimiPreventivi && ultimiPreventivi.length > 0) {
      const match = ultimiPreventivi[0].numero_preventivo.match(/PREV-\d{4}-(\d+)/);
      if (match) {
        numeroProgressivo = parseInt(match[1]) + 1;
      }
    }

    const numeroPreventivo = `PREV-${anno}-${numeroProgressivo.toString().padStart(3, '0')}`;

    // Crea preventivo
    const { data: preventivo, error: prevError } = await supabaseServer
      .from('preventivi')
      .insert({
        numero_preventivo: numeroPreventivo,
        cliente_id: clienteId,
        titolo,
        descrizione: descrizione || null,
        data_scadenza: dataScadenza || null,
        importo_totale: importoTotale,
        note: note || null,
        stato: 'bozza'
      })
      .select()
      .single();

    if (prevError || !preventivo) {
      console.error('Errore creazione preventivo:', prevError);
      return NextResponse.json({ error: prevError?.message || 'Errore creazione preventivo' }, { status: 500 });
    }

    // Crea voci preventivo
    const vociData = voci.map((voce: any) => ({
      preventivo_id: preventivo.id,
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

    // Recupera preventivo completo
    const { data: preventivoCompleto } = await supabaseServer
      .from('preventivi')
      .select(`
        *,
        cliente:clienti!preventivi_cliente_id_fkey (*),
        voci:voci_preventivo (*)
      `)
      .eq('id', preventivo.id)
      .single();

    return NextResponse.json(toCamelCase(preventivoCompleto), { status: 201 });
  } catch (error: any) {
    console.error('Errore POST /api/preventivi:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

