#!/usr/bin/env node

/**
 * Script per testare il login
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://jnyxmgiethfesfkyknga.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpueXhtZ2lldGhmZXNma3lrbmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODQ3MDksImV4cCI6MjA3NTg2MDcwOX0.29cooMkzAii9yTarXMxKU2nIreribhSPY9amxv7xLDY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('🔐 Testando il login...\n');

  try {
    // Test 1: Admin login
    console.log('1️⃣ Testando login admin...');
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@carrozzeriamotta.it')
      .eq('attivo', true)
      .single();

    if (adminError) {
      console.error('❌ Errore nel recuperare admin:', adminError.message);
      return;
    }

    console.log('✅ Utente admin trovato');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password hash: ${adminUser.password.substring(0, 20)}...`);

    // Verifica la password
    const adminPasswordMatch = await bcrypt.compare('admin123', adminUser.password);
    console.log(`   Password match: ${adminPasswordMatch ? '✅ Corretta' : '❌ Errata'}`);

    if (!adminPasswordMatch) {
      console.log('\n❌ La password admin non corrisponde!');
      console.log('   Password nel DB:', adminUser.password);
      console.log('   Devo rigenerare la password...\n');
      
      // Rigenera la password
      const newPassword = await bcrypt.hash('admin123', 12);
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', adminUser.id);

      if (updateError) {
        console.error('❌ Errore nell\'aggiornamento:', updateError.message);
      } else {
        console.log('✅ Password admin rigenerata');
      }
    }

    // Test 2: Employee login
    console.log('\n2️⃣ Testando login dipendente...');
    const { data: employeeUser, error: employeeError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'dipendente@carrozzeriamotta.it')
      .eq('attivo', true)
      .single();

    if (employeeError) {
      console.error('❌ Errore nel recuperare dipendente:', employeeError.message);
      return;
    }

    console.log('✅ Utente dipendente trovato');
    console.log(`   Email: ${employeeUser.email}`);
    console.log(`   Password hash: ${employeeUser.password.substring(0, 20)}...`);

    // Verifica la password
    const employeePasswordMatch = await bcrypt.compare('dipendente123', employeeUser.password);
    console.log(`   Password match: ${employeePasswordMatch ? '✅ Corretta' : '❌ Errata'}`);

    if (!employeePasswordMatch) {
      console.log('\n❌ La password dipendente non corrisponde!');
      console.log('   Devo rigenerare la password...\n');
      
      // Rigenera la password
      const newPassword = await bcrypt.hash('dipendente123', 12);
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', employeeUser.id);

      if (updateError) {
        console.error('❌ Errore nell\'aggiornamento:', updateError.message);
      } else {
        console.log('✅ Password dipendente rigenerata');
      }
    }

    console.log('\n🎉 Test completato!\n');
    console.log('📋 Credenziali di test:');
    console.log('   Admin: admin@carrozzeriamotta.it / admin123');
    console.log('   Dipendente: dipendente@carrozzeriamotta.it / dipendente123');

  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

testLogin();

