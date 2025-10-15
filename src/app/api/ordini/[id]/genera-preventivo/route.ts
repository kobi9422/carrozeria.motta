import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase, generateUUID } from '@/lib/supabase-helpers';

// POST /api/ordini/[id]/genera-preventivo - Genera preventivo da ordine completato
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Recupera ordine con dettagli
    const { data: ordine, error: ordineError } = await supabaseServer
      .from('ordini_lavoro')
      .select(`
        *,
        cliente:clienti!ordini_lavoro_cliente_id_fkey (
          id,
          nome,
          cognome,
          email
        ),
        veicolo:veicoli!ordini_lavoro_veicolo_id_fkey (
          id,
          marca,
          modello,
          targa
        )
      `)
      .eq('id', params.id)
      .single();

    if (ordineError || !ordine) {
      return NextResponse.json(
        { error: 'Ordine non trovato' },
        { status: 404 }
      );
    }

    // Recupera tutte le sessioni di lavoro per questo ordine
    const { data: sessioni, error: sessioniError } = await supabaseServer
      .from('ordini_lavoro_sessioni')
      .select(`
        *,
        user:users!ordini_lavoro_sessioni_user_id_fkey (
          id,
          nome,
          cognome,
          costo_orario
        )
      `)
      .eq('ordine_lavoro_id', params.id)
      .not('end_time', 'is', null); // Solo sessioni completate

    if (sessioniError) {
      console.error('Errore recupero sessioni:', sessioniError);
      return NextResponse.json({ error: sessioniError.message }, { status: 500 });
    }

    // Calcola totale ore e costi per dipendente
    const costiPerDipendente = new Map();
    let totaleOre = 0;
    let totaleCosto = 0;

    (sessioni || []).forEach((sessione: any) => {
      const durationMinutes = sessione.duration_minutes || 0;
      const durationHours = durationMinutes / 60;
      const costoOrario = sessione.user?.costo_orario || 0;
      const costo = durationHours * costoOrario;

      totaleOre += durationHours;
      totaleCosto += costo;

      const dipKey = sessione.user_id;
      if (!costiPerDipendente.has(dipKey)) {
        costiPerDipendente.set(dipKey, {
          nome: `${sessione.user?.nome} ${sessione.user?.cognome}`,
          ore: 0,
          costoOrario: costoOrario,
          totale: 0
        });
      }

      const dip = costiPerDipendente.get(dipKey);
      dip.ore += durationHours;
      dip.totale += costo;
    });

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

    // Crea voci preventivo
    const voci: any[] = [];

    // Voce per manodopera
    if (totaleOre > 0) {
      voci.push({
        descrizione: `Manodopera - ${totaleOre.toFixed(2)} ore`,
        quantita: totaleOre,
        prezzoUnitario: totaleCosto / totaleOre, // Costo medio orario
        aliquotaIva: 22
      });
    }

    // Aggiungi dettaglio per ogni dipendente nelle note
    let noteDettaglio = `Ordine: ${ordine.numero_ordine}\n`;
    if (ordine.veicolo) {
      noteDettaglio += `Veicolo: ${ordine.veicolo.marca} ${ordine.veicolo.modello} (${ordine.veicolo.targa})\n`;
    }
    noteDettaglio += `\nDettaglio ore lavorate:\n`;
    
    costiPerDipendente.forEach((dip, key) => {
      noteDettaglio += `- ${dip.nome}: ${dip.ore.toFixed(2)}h × €${dip.costoOrario.toFixed(2)}/h = €${dip.totale.toFixed(2)}\n`;
    });

    // Calcola importo totale con IVA
    const importoTotale = voci.reduce((sum, voce) => {
      const subtotale = voce.quantita * voce.prezzoUnitario;
      const iva = voce.aliquotaIva || 22;
      const totaleConIva = subtotale * (1 + iva / 100);
      return sum + totaleConIva;
    }, 0);

    // Crea preventivo
    const preventivoId = generateUUID();
    const now = new Date().toISOString();

    const { data: preventivo, error: prevError } = await supabaseServer
      .from('preventivi')
      .insert({
        id: preventivoId,
        numero_preventivo: numeroPreventivo,
        cliente_id: ordine.cliente_id,
        titolo: `Lavoro completato - ${ordine.descrizione}`,
        descrizione: ordine.descrizione,
        data_scadenza: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 giorni
        importo_totale: importoTotale,
        note: noteDettaglio,
        stato: 'bozza',
        updated_at: now
      })
      .select()
      .single();

    if (prevError || !preventivo) {
      console.error('Errore creazione preventivo:', prevError);
      return NextResponse.json({ error: prevError?.message || 'Errore creazione preventivo' }, { status: 500 });
    }

    // Crea voci preventivo
    const vociData = voci.map((voce) => {
      const subtotale = voce.quantita * voce.prezzoUnitario;
      const iva = voce.aliquotaIva || 22;
      const totaleConIva = subtotale * (1 + iva / 100);

      return {
        id: generateUUID(),
        preventivo_id: preventivo.id,
        descrizione: voce.descrizione,
        quantita: voce.quantita,
        prezzo_unitario: voce.prezzoUnitario,
        aliquota_iva: iva,
        totale: totaleConIva,
        updated_at: now
      };
    });

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

    return NextResponse.json(toCamelCase({
      preventivo: preventivoCompleto,
      riepilogo: {
        totaleOre: parseFloat(totaleOre.toFixed(2)),
        totaleCosto: parseFloat(totaleCosto.toFixed(2)),
        numeroSessioni: sessioni?.length || 0,
        dipendenti: Array.from(costiPerDipendente.values())
      }
    }), { status: 201 });
  } catch (error: any) {
    console.error('Errore generazione preventivo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

