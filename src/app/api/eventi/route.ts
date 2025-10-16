import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase, generateUUID } from '@/lib/supabase-helpers';
import { getCurrentUser } from '@/lib/auth';

// GET /api/eventi - Ottieni tutti gli eventi
export async function GET(request: NextRequest) {
  try {
    // Verifica autenticazione
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dataInizio = searchParams.get('dataInizio');
    const dataFine = searchParams.get('dataFine');
    const tipo = searchParams.get('tipo');

    let query = supabaseServer
      .from('eventi')
      .select(`
        *,
        cliente:clienti!eventi_cliente_id_fkey (
          id,
          nome,
          cognome,
          email,
          telefono
        ),
        veicolo:veicoli!eventi_veicolo_id_fkey (
          id,
          marca,
          modello,
          targa
        ),
        createdBy:users!eventi_created_by_fkey (
          id,
          nome,
          cognome
        )
      `)
      .order('data_inizio', { ascending: true });

    // Filtri
    if (dataInizio) {
      query = query.gte('data_inizio', dataInizio);
    }
    if (dataFine) {
      query = query.lte('data_inizio', dataFine);
    }
    if (tipo && tipo !== 'tutti') {
      query = query.eq('tipo', tipo);
    }

    const { data: eventi, error } = await query;

    if (error) {
      console.error('Errore Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(eventi));
  } catch (error: any) {
    console.error('Errore GET /api/eventi:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/eventi - Crea un nuovo evento
export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const {
      titolo,
      descrizione,
      tipo,
      dataInizio,
      dataFine,
      oraInizio,
      oraFine,
      tuttoIlGiorno,
      clienteId,
      veicoloId,
      ordineLavoroId,
      note,
      colore
    } = body;

    // Validazione
    if (!titolo || !tipo || !dataInizio) {
      return NextResponse.json(
        { error: 'Titolo, tipo e data inizio sono obbligatori' },
        { status: 400 }
      );
    }

    // Validazione tipo
    const tipiValidi = ['ordine', 'appuntamento', 'scadenza', 'altro'];
    if (!tipiValidi.includes(tipo)) {
      return NextResponse.json(
        { error: `Tipo non valido. Valori ammessi: ${tipiValidi.join(', ')}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { data: evento, error } = await supabaseServer
      .from('eventi')
      .insert({
        id: generateUUID(),
        titolo,
        descrizione,
        tipo,
        data_inizio: dataInizio,
        data_fine: dataFine || null,
        ora_inizio: oraInizio || null,
        ora_fine: oraFine || null,
        tutto_il_giorno: tuttoIlGiorno || false,
        cliente_id: clienteId || null,
        veicolo_id: veicoloId || null,
        ordine_lavoro_id: ordineLavoroId || null,
        note: note || null,
        colore: colore || '#3B82F6',
        created_by: user.id,
        created_at: now,
        updated_at: now
      })
      .select(`
        *,
        cliente:clienti!eventi_cliente_id_fkey (
          id,
          nome,
          cognome,
          email,
          telefono
        ),
        veicolo:veicoli!eventi_veicolo_id_fkey (
          id,
          marca,
          modello,
          targa
        ),
        createdBy:users!eventi_created_by_fkey (
          id,
          nome,
          cognome
        )
      `)
      .single();

    if (error) {
      console.error('Errore Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(evento), { status: 201 });
  } catch (error: any) {
    console.error('Errore POST /api/eventi:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

