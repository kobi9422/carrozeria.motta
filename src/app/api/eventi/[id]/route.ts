import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase } from '@/lib/supabase-helpers';
import { getCurrentUser } from '@/lib/auth';

// GET /api/eventi/[id] - Ottieni un evento specifico
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

    const { data: evento, error } = await supabaseServer
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
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Errore Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!evento) {
      return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 });
    }

    return NextResponse.json(toCamelCase(evento));
  } catch (error: any) {
    console.error('Errore GET /api/eventi/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/eventi/[id] - Aggiorna un evento
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

    // Validazione tipo se fornito
    if (tipo) {
      const tipiValidi = ['ordine', 'appuntamento', 'scadenza', 'altro'];
      if (!tipiValidi.includes(tipo)) {
        return NextResponse.json(
          { error: `Tipo non valido. Valori ammessi: ${tipiValidi.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (titolo !== undefined) updateData.titolo = titolo;
    if (descrizione !== undefined) updateData.descrizione = descrizione;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (dataInizio !== undefined) updateData.data_inizio = dataInizio;
    if (dataFine !== undefined) updateData.data_fine = dataFine;
    if (oraInizio !== undefined) updateData.ora_inizio = oraInizio;
    if (oraFine !== undefined) updateData.ora_fine = oraFine;
    if (tuttoIlGiorno !== undefined) updateData.tutto_il_giorno = tuttoIlGiorno;
    if (clienteId !== undefined) updateData.cliente_id = clienteId;
    if (veicoloId !== undefined) updateData.veicolo_id = veicoloId;
    if (ordineLavoroId !== undefined) updateData.ordine_lavoro_id = ordineLavoroId;
    if (note !== undefined) updateData.note = note;
    if (colore !== undefined) updateData.colore = colore;

    const { data: evento, error } = await supabaseServer
      .from('eventi')
      .update(updateData)
      .eq('id', params.id)
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

    if (!evento) {
      return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 });
    }

    return NextResponse.json(toCamelCase(evento));
  } catch (error: any) {
    console.error('Errore PUT /api/eventi/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/eventi/[id] - Elimina un evento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticazione
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { error } = await supabaseServer
      .from('eventi')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Errore Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Evento eliminato con successo' });
  } catch (error: any) {
    console.error('Errore DELETE /api/eventi/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

