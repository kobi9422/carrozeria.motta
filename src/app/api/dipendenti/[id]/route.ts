import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase } from '@/lib/supabase-helpers';
import bcrypt from 'bcryptjs';

// GET /api/dipendenti/[id] - Ottieni un dipendente specifico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseServer
      .from('users')
      .select('id, nome, cognome, email, telefono, ruolo, attivo, costo_orario, created_at')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Dipendente non trovato' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(data));

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/dipendenti/[id] - Modifica un dipendente
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { nome, cognome, email, telefono, password, ruolo, attivo, costoOrario } = body;

    // Prepara dati per update
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (nome !== undefined) updateData.nome = nome;
    if (cognome !== undefined) updateData.cognome = cognome;
    if (email !== undefined) updateData.email = email;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (ruolo !== undefined) updateData.ruolo = ruolo;
    if (attivo !== undefined) updateData.attivo = attivo;
    if (costoOrario !== undefined) updateData.costo_orario = costoOrario;

    // Se viene fornita una nuova password, hashala
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = hashedPassword;
    }

    // Verifica email duplicata (se viene modificata)
    if (email) {
      const { data: esistente } = await supabaseServer
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', params.id)
        .single();

      if (esistente) {
        return NextResponse.json(
          { error: 'Email già esistente' },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabaseServer
      .from('users')
      .update(updateData)
      .eq('id', params.id)
      .select('id, nome, cognome, email, telefono, ruolo, attivo, costo_orario, created_at')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Dipendente non trovato' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toCamelCase(data));

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/dipendenti/[id] - Elimina un dipendente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica se il dipendente ha ordini assegnati
    const { data: ordini, error: ordiniError } = await supabaseServer
      .from('dipendenti_ordini')
      .select('id')
      .eq('dipendente_id', params.id)
      .limit(1);

    if (ordiniError) {
      return NextResponse.json({ error: ordiniError.message }, { status: 500 });
    }

    if (ordini && ordini.length > 0) {
      return NextResponse.json(
        { error: 'Impossibile eliminare: il dipendente ha ordini assegnati' },
        { status: 400 }
      );
    }

    // Elimina il dipendente
    const { error } = await supabaseServer
      .from('users')
      .delete()
      .eq('id', params.id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Dipendente non trovato' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Dipendente eliminato con successo' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

