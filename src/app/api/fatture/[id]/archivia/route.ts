import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase } from '@/lib/supabase-helpers';

// PATCH - Archivia o ripristina una fattura
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { archivia } = body; // true = archivia, false = ripristina

    const now = new Date().toISOString();

    const { data: fattura, error } = await supabaseServer
      .from('fatture')
      .update({
        archiviato: archivia,
        data_archiviazione: archivia ? now : null,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Errore archiviazione fattura:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(fattura));
  } catch (error: any) {
    console.error('Errore archiviazione fattura:', error);
    return NextResponse.json(
      { error: 'Errore nell\'archiviazione della fattura' },
      { status: 500 }
    );
  }
}

