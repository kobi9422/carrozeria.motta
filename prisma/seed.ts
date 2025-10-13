import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crea utente admin di default
  const adminPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@carrozzeriamotta.it' },
    update: {},
    create: {
      email: 'admin@carrozzeriamotta.it',
      password: adminPassword,
      nome: 'Admin',
      cognome: 'Carrozzeria Motta',
      ruolo: 'admin',
      attivo: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Crea utente dipendente di esempio
  const employeePassword = await bcrypt.hash('dipendente123', 12);
  
  const employee = await prisma.user.upsert({
    where: { email: 'dipendente@carrozzeriamotta.it' },
    update: {},
    create: {
      email: 'dipendente@carrozzeriamotta.it',
      password: employeePassword,
      nome: 'Mario',
      cognome: 'Rossi',
      ruolo: 'employee',
      attivo: true,
    },
  });

  console.log('✅ Employee user created:', employee.email);

  // Crea alcuni clienti di esempio
  const cliente1 = await prisma.cliente.create({
    data: {
      nome: 'Luca',
      cognome: 'Verdi',
      telefono: '+39 333 1234567',
      email: 'luca.verdi@email.com',
      indirizzo: 'Via Roma 123',
      citta: 'Milano',
      cap: '20100',
      provincia: 'MI',
    },
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nome: 'Anna',
      cognome: 'Bianchi',
      telefono: '+39 333 7654321',
      email: 'anna.bianchi@email.com',
      indirizzo: 'Via Garibaldi 456',
      citta: 'Roma',
      cap: '00100',
      provincia: 'RM',
    },
  });

  console.log('✅ Sample clients created');

  // Crea alcuni veicoli di esempio
  const veicolo1 = await prisma.veicolo.create({
    data: {
      clienteId: cliente1.id,
      marca: 'Fiat',
      modello: 'Panda',
      anno: 2020,
      targa: 'AB123CD',
      colore: 'Bianco',
      carburante: 'Benzina',
    },
  });

  const veicolo2 = await prisma.veicolo.create({
    data: {
      clienteId: cliente2.id,
      marca: 'BMW',
      modello: 'Serie 3',
      anno: 2019,
      targa: 'EF456GH',
      colore: 'Nero',
      carburante: 'Diesel',
    },
  });

  console.log('✅ Sample vehicles created');

  // Crea alcuni ordini di lavoro di esempio
  const ordine1 = await prisma.ordineLavoro.create({
    data: {
      numeroOrdine: 'ORD-2025-001',
      clienteId: cliente1.id,
      veicoloId: veicolo1.id,
      descrizione: 'Riparazione paraurti anteriore e verniciatura',
      stato: 'in_corso',
      priorita: 'alta',
      dataInizio: new Date('2025-01-10'),
      dataFine: new Date('2025-01-15'),
      costoStimato: 850.00,
      tempoLavorato: 3600, // 1 ora
      dipendenti: {
        create: [
          { dipendente: { connect: { id: employee.id } } }
        ]
      }
    },
  });

  const ordine2 = await prisma.ordineLavoro.create({
    data: {
      numeroOrdine: 'ORD-2025-002',
      clienteId: cliente2.id,
      veicoloId: veicolo2.id,
      descrizione: 'Sostituzione portiera posteriore destra',
      stato: 'in_attesa',
      priorita: 'media',
      dataInizio: new Date('2025-01-13'),
      costoStimato: 1200.00,
      tempoLavorato: 0,
    },
  });

  console.log('✅ Sample work orders created');

  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📋 Credenziali di accesso:');
  console.log('👤 Admin: admin@carrozzeriamotta.it / admin123');
  console.log('👤 Dipendente: dipendente@carrozzeriamotta.it / dipendente123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
