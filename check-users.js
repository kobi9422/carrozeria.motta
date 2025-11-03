#!/usr/bin/env node

/**
 * Script per verificare gli utenti nel database
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://jnyxmgiethfesfkyknga.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpueXhtZ2lldGhmZXNma3lrbmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODQ3MDksImV4cCI6MjA3NTg2MDcwOX0.29cooMkzAii9yTarXMxKU2nIreribhSPY9amxv7xLDY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
  console.log('🔍 Verificando gli utenti nel database...\n');

  try {
    // Ottieni tutti gli utenti
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, nome, cognome, ruolo, attivo, password')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Errore nel recuperare gli utenti:', error.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ Nessun utente trovato nel database!\n');
      console.log('📝 Devo creare gli utenti di test...\n');
      
      // Crea gli utenti di test
      await createTestUsers();
      return;
    }

    console.log(`✅ Trovati ${users.length} utenti:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Nome: ${user.nome} ${user.cognome}`);
      console.log(`   Ruolo: ${user.ruolo}`);
      console.log(`   Attivo: ${user.attivo ? '✅ Sì' : '❌ No'}`);
      console.log(`   Password: ${user.password ? '✅ Presente' : '❌ Mancante'}`);
      console.log('');
    });

    // Verifica se gli utenti di test esistono
    const adminExists = users.some(u => u.email === 'admin@carrozzeriamotta.it');
    const employeeExists = users.some(u => u.email === 'dipendente@carrozzeriamotta.it');

    if (!adminExists || !employeeExists) {
      console.log('📝 Creando gli utenti di test mancanti...\n');
      await createTestUsers();
    }

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

async function createTestUsers() {
  try {
    console.log('🔐 Hashando le password...');
    
    const adminPassword = await bcrypt.hash('admin123', 12);
    const employeePassword = await bcrypt.hash('dipendente123', 12);

    console.log('✅ Password hashate\n');

    // Crea utente admin
    console.log('1️⃣ Creando utente admin...');
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .insert({
        email: 'admin@carrozzeriamotta.it',
        password: adminPassword,
        nome: 'Admin',
        cognome: 'Carrozzeria Motta',
        ruolo: 'admin',
        attivo: true
      })
      .select()
      .single();

    if (adminError) {
      if (adminError.code === '23505') {
        console.log('⚠️  Utente admin già esiste');
      } else {
        console.error('❌ Errore:', adminError.message);
      }
    } else {
      console.log('✅ Utente admin creato:', admin.email);
    }

    // Crea utente dipendente
    console.log('\n2️⃣ Creando utente dipendente...');
    const { data: employee, error: employeeError } = await supabase
      .from('users')
      .insert({
        email: 'dipendente@carrozzeriamotta.it',
        password: employeePassword,
        nome: 'Mario',
        cognome: 'Rossi',
        ruolo: 'employee',
        attivo: true
      })
      .select()
      .single();

    if (employeeError) {
      if (employeeError.code === '23505') {
        console.log('⚠️  Utente dipendente già esiste');
      } else {
        console.error('❌ Errore:', employeeError.message);
      }
    } else {
      console.log('✅ Utente dipendente creato:', employee.email);
    }

    console.log('\n🎉 Utenti di test creati con successo!\n');
    console.log('📋 Credenziali di test:');
    console.log('   Admin: admin@carrozzeriamotta.it / admin123');
    console.log('   Dipendente: dipendente@carrozzeriamotta.it / dipendente123');

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

checkUsers();

