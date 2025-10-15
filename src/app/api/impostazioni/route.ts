import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase } from '@/lib/supabase-helpers';

// GET - Ottieni le impostazioni (crea se non esistono)
export async function GET() {
  try {
    const { data: impostazioniList } = await supabaseServer
      .from('impostazioni')
      .select('*')
      .limit(1);

    let impostazioni = impostazioniList?.[0];

    // Se non esistono impostazioni, crea quelle di default
    if (!impostazioni) {
      const { data: nuoveImpostazioni } = await supabaseServer
        .from('impostazioni')
        .insert({
          nome_azienda: 'Carrozzeria Motta',
          indirizzo: '',
          citta: '',
          cap: '',
          provincia: '',
          telefono: '',
          email: '',
          partita_iva: '',
          codice_fiscale: '',
          iban: '',
          banca: '',
          condizioni_pagamento: 'Pagamento a 30 giorni',
          note_legali_fattura: '',
          validita_preventivi: 30,
          note_standard_preventivo: ''
        })
        .select()
        .single();

      impostazioni = nuoveImpostazioni;
    }

    return NextResponse.json(toCamelCase(impostazioni));
  } catch (error: any) {
    console.error('Errore nel recupero delle impostazioni:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle impostazioni' },
      { status: 500 }
    );
  }
}

// PATCH - Aggiorna le impostazioni
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { toSnakeCase } = await import('@/lib/supabase-helpers');

    // Converti i dati in snake_case
    const snakeData = toSnakeCase(body);

    // Trova le impostazioni esistenti
    const { data: impostazioniList } = await supabaseServer
      .from('impostazioni')
      .select('*')
      .limit(1);

    let impostazioni = impostazioniList?.[0];

    if (!impostazioni) {
      // Se non esistono, creale
      const { data: nuoveImpostazioni } = await supabaseServer
        .from('impostazioni')
        .insert(snakeData)
        .select()
        .single();

      impostazioni = nuoveImpostazioni;
    } else {
      // Altrimenti aggiornale
      const { data: impostazioniAggiornate } = await supabaseServer
        .from('impostazioni')
        .update(snakeData)
        .eq('id', impostazioni.id)
        .select()
        .single();

      impostazioni = impostazioniAggiornate;
    }

    return NextResponse.json(toCamelCase(impostazioni));
  } catch (error: any) {
    console.error('Errore nell\'aggiornamento delle impostazioni:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento delle impostazioni' },
      { status: 500 }
    );
  }
}

