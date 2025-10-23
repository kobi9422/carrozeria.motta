import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

// POST - Upload firma digitale
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file fornito' },
        { status: 400 }
      );
    }

    // Valida il tipo di file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Il file deve essere un\'immagine' },
        { status: 400 }
      );
    }

    // Converti il file in base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Salva nella tabella impostazioni
    const { data: impostazioniList } = await supabaseServer
      .from('impostazioni')
      .select('id')
      .limit(1);

    if (!impostazioniList || impostazioniList.length === 0) {
      return NextResponse.json(
        { error: 'Impostazioni non trovate' },
        { status: 404 }
      );
    }

    const { data: updated, error } = await supabaseServer
      .from('impostazioni')
      .update({ firma_url: dataUrl })
      .eq('id', impostazioniList[0].id)
      .select()
      .single();

    if (error) {
      console.error('Errore upload firma:', error);
      return NextResponse.json(
        { error: 'Errore nel salvataggio della firma' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Firma caricata con successo',
      firmaUrl: dataUrl
    });
  } catch (error: any) {
    console.error('Errore upload firma:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

