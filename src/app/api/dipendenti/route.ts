import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase, generateUUID } from '@/lib/supabase-helpers';
import bcrypt from 'bcryptjs';

// GET - Lista tutti i dipendenti
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const attiviOnly = searchParams.get('attivi') === 'true';

    let query = supabaseServer
      .from('users')
      .select('id, nome, cognome, email, telefono, ruolo, attivo, costo_orario, created_at')
      .order('cognome', { ascending: true });

    if (attiviOnly) {
      query = query.eq('attivo', true);
    }

    const { data: dipendenti, error } = await query;

    if (error) {
      console.error('Errore nel recupero dipendenti:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(dipendenti || []));
  } catch (error: any) {
    console.error('Errore nel recupero dipendenti:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei dipendenti' },
      { status: 500 }
    );
  }
}

// POST - Crea nuovo dipendente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, cognome, email, telefono, password, ruolo, costoOrario } = body;

    // Validazione
    if (!nome || !cognome || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, cognome, email e password sono obbligatori' },
        { status: 400 }
      );
    }

    // Verifica email duplicata
    const { data: esistente } = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (esistente) {
      return NextResponse.json(
        { error: 'Email già esistente' },
        { status: 400 }
      );
    }

    // Hash password con bcryptjs (usa $2b$ invece di $2a$)
    const hashedPassword = await bcrypt.hash(password, 12);

    const now = new Date().toISOString();

    const { data: dipendente, error } = await supabaseServer
      .from('users')
      .insert({
        id: generateUUID(),
        nome,
        cognome,
        email,
        telefono: telefono || null,
        password: hashedPassword,
        ruolo: ruolo || 'employee',
        attivo: true,
        costo_orario: costoOrario || 0,
        updated_at: now
      })
      .select('id, nome, cognome, email, telefono, ruolo, attivo, costo_orario, created_at')
      .single();

    if (error) {
      console.error('Errore nella creazione dipendente:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(dipendente), { status: 201 });
  } catch (error: any) {
    console.error('Errore nella creazione dipendente:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione del dipendente' },
      { status: 500 }
    );
  }
}

