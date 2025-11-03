#!/usr/bin/env node

/**
 * Script per generare gli hash bcrypt delle password
 * Uso: node scripts/generate-password-hashes.js
 */

const bcrypt = require('bcryptjs');

async function generateHashes() {
  console.log('🔐 Generazione hash bcrypt per le password...\n');

  const passwords = [
    { email: 'admin@carrozzeriamotta.it', password: 'admin123' },
    { email: 'dipendente@carrozzeriamotta.it', password: 'dipendente123' }
  ];

  for (const { email, password } of passwords) {
    const hash = await bcrypt.hash(password, 12);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log('---\n');
  }
}

generateHashes().catch(console.error);

