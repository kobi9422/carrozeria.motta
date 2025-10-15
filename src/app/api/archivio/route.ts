import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase } from '@/lib/supabase-helpers';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// GET - Ottieni tutti gli elementi archiviati
export async function GET(request: NextRequest) {
  try {
    // Verifica autenticazione
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return NextResponse.json({ error: 'Token non valido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // 'ordini' | 'preventivi' | 'fatture' | null (tutti)
    const clienteId = searchParams.get('clienteId');
    const dataInizio = searchParams.get('dataInizio');
    const dataFine = searchParams.get('dataFine');

    const risultati: any = {
      ordini: [],
      preventivi: [],
      fatture: []
    };

    // Fetch ordini archiviati
    if (!tipo || tipo === 'ordini') {
      let queryOrdini = supabaseServer
        .from('ordini_lavoro')
        .select(`
          *,
          cliente:clienti(id, nome, cognome, ragione_sociale, tipo_cliente),
          veicolo:veicoli(id, marca, modello, targa)
        `)
        .eq('archiviato', true)
        .order('data_archiviazione', { ascending: false });

      if (clienteId) queryOrdini = queryOrdini.eq('cliente_id', clienteId);
      if (dataInizio) queryOrdini = queryOrdini.gte('data_archiviazione', dataInizio);
      if (dataFine) queryOrdini = queryOrdini.lte('data_archiviazione', dataFine);

      const { data: ordini, error: errOrdini } = await queryOrdini;

      if (errOrdini) {
        console.error('Errore fetch ordini archiviati:', errOrdini);
      } else {
        risultati.ordini = ordini?.map(toCamelCase) || [];
      }
    }

    // Fetch preventivi archiviati
    if (!tipo || tipo === 'preventivi') {
      let queryPreventivi = supabaseServer
        .from('preventivi')
        .select(`
          *,
          cliente:clienti(id, nome, cognome, ragione_sociale, tipo_cliente),
          voci:voci_preventivo(*)
        `)
        .eq('archiviato', true)
        .order('data_archiviazione', { ascending: false });

      if (clienteId) queryPreventivi = queryPreventivi.eq('cliente_id', clienteId);
      if (dataInizio) queryPreventivi = queryPreventivi.gte('data_archiviazione', dataInizio);
      if (dataFine) queryPreventivi = queryPreventivi.lte('data_archiviazione', dataFine);

      const { data: preventivi, error: errPreventivi } = await queryPreventivi;

      if (errPreventivi) {
        console.error('Errore fetch preventivi archiviati:', errPreventivi);
      } else {
        risultati.preventivi = preventivi?.map(toCamelCase) || [];
      }
    }

    // Fetch fatture archiviate
    if (!tipo || tipo === 'fatture') {
      let queryFatture = supabaseServer
        .from('fatture')
        .select(`
          *,
          cliente:clienti(id, nome, cognome, ragione_sociale, tipo_cliente),
          voci:voci_fattura(*)
        `)
        .eq('archiviato', true)
        .order('data_archiviazione', { ascending: false });

      if (clienteId) queryFatture = queryFatture.eq('cliente_id', clienteId);
      if (dataInizio) queryFatture = queryFatture.gte('data_archiviazione', dataInizio);
      if (dataFine) queryFatture = queryFatture.lte('data_archiviazione', dataFine);

      const { data: fatture, error: errFatture } = await queryFatture;

      if (errFatture) {
        console.error('Errore fetch fatture archiviate:', errFatture);
      } else {
        risultati.fatture = fatture?.map(toCamelCase) || [];
      }
    }

    return NextResponse.json(risultati);
  } catch (error: any) {
    console.error('Errore nel recupero archivio:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dell\'archivio' },
      { status: 500 }
    );
  }
}

