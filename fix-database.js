#!/usr/bin/env node

/**
 * Script per correggere il database Supabase
 * Aggiunge le colonne mancanti alla tabella users
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jnyxmgiethfesfkyknga.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpueXhtZ2lldGhmZXNma3lrbmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODQ3MDksImV4cCI6MjA3NTg2MDcwOX0.29cooMkzAii9yTarXMxKU2nIreribhSPY9amxv7xLDY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabase() {
  console.log('🔧 Inizio correzione del database...\n');

  try {
    // 1. Verifica la struttura attuale
    console.log('1️⃣ Verifico la struttura della tabella users...');
    const { data: columns, error: columnsError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (columnsError) {
      console.error('❌ Errore nel verificare la tabella:', columnsError);
      return;
    }

    console.log('✅ Tabella users trovata\n');

    // 2. Prova a inserire un utente di test per verificare le colonne
    console.log('2️⃣ Verifico se le colonne necessarie esistono...');
    
    const testUser = {
      id: 'test-' + Date.now(),
      email: 'test@test.com',
      password: 'hashed_password_here',
      nome: 'Test',
      cognome: 'User',
      telefono: '+39 123 456 7890',
      ruolo: 'employee',
      attivo: true,
      costo_orario: 25.00
    };

    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert([testUser])
      .select();

    if (insertError) {
      console.error('❌ Errore nell\'inserimento:', insertError.message);
      console.log('\n📋 Questo significa che mancano le colonne nel database.');
      console.log('   Devi eseguire manualmente le query SQL nel Supabase SQL Editor.\n');
      
      console.log('📝 Copia e incolla queste query nel SQL Editor di Supabase:');
      console.log('═'.repeat(60));
      console.log(`
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS attivo BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS costo_orario DECIMAL(10, 2) DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_attivo ON public.users(attivo);
      `);
      console.log('═'.repeat(60));
      return;
    }

    console.log('✅ Tutte le colonne necessarie esistono!\n');

    // 3. Elimina l'utente di test
    console.log('3️⃣ Pulisco l\'utente di test...');
    await supabase
      .from('users')
      .delete()
      .eq('id', testUser.id);

    console.log('✅ Pulizia completata\n');
    console.log('🎉 Database corretto con successo!');

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

fixDatabase();

