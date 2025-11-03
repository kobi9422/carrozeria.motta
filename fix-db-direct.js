#!/usr/bin/env node

/**
 * Script per correggere il database usando il client Supabase
 * Esegue le query SQL necessarie per aggiungere le colonne mancanti
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://jnyxmgiethfesfkyknga.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpueXhtZ2lldGhmZXNma3lrbmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODQ3MDksImV4cCI6MjA3NTg2MDcwOX0.29cooMkzAii9yTarXMxKU2nIreribhSPY9amxv7xLDY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixDatabase() {
  console.log('🔧 Inizio correzione del database...\n');

  try {
    // 1. Verifica se la tabella users esiste e quali colonne ha
    console.log('1️⃣ Verificando la struttura della tabella users...');
    const { data: existingUsers, error: selectError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('❌ Errore nel verificare la tabella:', selectError.message);
      console.log('\n📝 Soluzione: Devi eseguire manualmente le query SQL nel Supabase SQL Editor');
      console.log('   URL: https://supabase.com/dashboard/project/jnyxmgiethfesfkyknga/sql/new\n');
      
      console.log('📋 Copia e incolla queste query una alla volta:\n');
      console.log('═'.repeat(70));
      console.log(`
-- 1. Aggiungi colonna password
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';

-- 2. Aggiungi colonna attivo
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS attivo BOOLEAN DEFAULT true;

-- 3. Aggiungi colonna telefono
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telefono TEXT;

-- 4. Aggiungi colonna costo_orario
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS costo_orario DECIMAL(10, 2) DEFAULT 0;

-- 5. Crea indice su email
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 6. Crea indice su attivo
CREATE INDEX IF NOT EXISTS idx_users_attivo ON public.users(attivo);

-- 7. Crea utente admin di test
INSERT INTO public.users (id, email, password, nome, cognome, ruolo, attivo, created_at, updated_at)
VALUES (
  'admin-' || gen_random_uuid()::text,
  'admin@carrozzeriamotta.it',
  '${await bcrypt.hash('admin123', 12)}',
  'Admin',
  'Carrozzeria Motta',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 8. Crea utente dipendente di test
INSERT INTO public.users (id, email, password, nome, cognome, ruolo, attivo, created_at, updated_at)
VALUES (
  'employee-' || gen_random_uuid()::text,
  'dipendente@carrozzeriamotta.it',
  '${await bcrypt.hash('dipendente123', 12)}',
  'Mario',
  'Rossi',
  'employee',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
      `);
      console.log('═'.repeat(70));
      return;
    }

    console.log('✅ Tabella users trovata');
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('\n📋 Colonne attuali:');
      Object.keys(existingUsers[0]).forEach(col => {
        console.log(`   ✓ ${col}`);
      });
    }

    // 2. Verifica se mancano le colonne
    const requiredColumns = ['password', 'attivo', 'telefono', 'costo_orario'];
    const existingColumns = existingUsers && existingUsers.length > 0 ? Object.keys(existingUsers[0]) : [];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('\n❌ Colonne mancanti:');
      missingColumns.forEach(col => {
        console.log(`   ✗ ${col}`);
      });
      
      console.log('\n📝 Devi eseguire le query SQL nel Supabase SQL Editor');
      console.log('   URL: https://supabase.com/dashboard/project/jnyxmgiethfesfkyknga/sql/new\n');
      
      console.log('📋 Copia e incolla queste query:\n');
      console.log('═'.repeat(70));
      console.log(`
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS attivo BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS costo_orario DECIMAL(10, 2) DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_attivo ON public.users(attivo);
      `);
      console.log('═'.repeat(70));
    } else {
      console.log('\n✅ Tutte le colonne necessarie sono presenti!');
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

fixDatabase();

