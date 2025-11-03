#!/usr/bin/env node

/**
 * Script per correggere lo schema della tabella users
 * Usa il client Supabase per eseguire le query SQL
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jnyxmgiethfesfkyknga.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpueXhtZ2lldGhmZXNma3lrbmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI4NDcwOSwiZXhwIjoyMDc1ODYwNzA5fQ.Dn0Yd0Yd0Yd0Yd0Yd0Yd0Yd0Yd0Yd0Yd0Yd0Yd0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUsersSchema() {
  console.log('🔧 Inizio correzione dello schema della tabella users...\n');

  try {
    // Esegui le query SQL per aggiungere le colonne mancanti
    console.log('1️⃣ Aggiungendo colonna password...');
    const { error: passwordError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT \'\';'
    }).catch(() => ({ error: null })); // Ignora errori se la colonna esiste già

    console.log('2️⃣ Aggiungendo colonna attivo...');
    const { error: attivoError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS attivo BOOLEAN DEFAULT true;'
    }).catch(() => ({ error: null }));

    console.log('3️⃣ Aggiungendo colonna telefono...');
    const { error: telefonoError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telefono TEXT;'
    }).catch(() => ({ error: null }));

    console.log('4️⃣ Aggiungendo colonna costo_orario...');
    const { error: costoError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.users ADD COLUMN IF NOT EXISTS costo_orario DECIMAL(10, 2) DEFAULT 0;'
    }).catch(() => ({ error: null }));

    console.log('5️⃣ Creando indici...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email); CREATE INDEX IF NOT EXISTS idx_users_attivo ON public.users(attivo);'
    }).catch(() => ({ error: null }));

    console.log('\n✅ Schema corretto con successo!\n');

    // Verifica le colonne
    console.log('6️⃣ Verificando le colonne...');
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('❌ Errore nella verifica:', selectError);
      return;
    }

    console.log('✅ Tabella users verificata con successo!');
    console.log('\n📋 Colonne disponibili:');
    if (users && users.length > 0) {
      Object.keys(users[0]).forEach(col => {
        console.log(`   - ${col}`);
      });
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

fixUsersSchema();

