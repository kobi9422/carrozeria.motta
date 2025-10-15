import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase, generateUUID } from '@/lib/supabase-helpers';

// GET /api/clienti - Ottieni tutti i clienti
export async function GET(request: NextRequest) {
  try {
    const { data: clienti, error } = await supabaseServer
      .from('clienti')
      .select('*')
      .order('cognome', { ascending: true })
      .order('nome', { ascending: true });

    if (error) {
      console.error('Errore Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(clienti));
  } catch (error: any) {
    console.error('Errore GET /api/clienti:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clienti - Crea un nuovo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, cognome, telefono, email } = body;

    // Validazione base
    if (!nome || !cognome) {
      return NextResponse.json({ error: 'Nome e cognome sono obbligatori' }, { status: 400 });
    }

    const { data: cliente, error } = await supabaseServer
      .from('clienti')
      .insert({
        id: generateUUID(),
        nome,
        cognome,
        telefono: telefono || null,
        email: email || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Errore Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(cliente), { status: 201 });
  } catch (error: any) {
    console.error('Errore POST /api/clienti:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
