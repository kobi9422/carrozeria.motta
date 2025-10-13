# Database Setup - Carrozzeria Motta

Questa directory contiene tutti i file necessari per configurare il database Supabase per il sistema di gestione di Carrozzeria Motta.

## File inclusi

- `schema.sql` - Schema completo del database con tabelle, enum, indici, trigger e policy RLS
- `seed.sql` - Dati di esempio per sviluppo e testing
- `README.md` - Questo file con le istruzioni

## Setup del Database

### 1. Creare un progetto Supabase

1. Vai su [supabase.com](https://supabase.com)
2. Crea un nuovo progetto
3. Annota l'URL del progetto e le chiavi API

### 2. Configurare le variabili d'ambiente

Copia il file `.env.local.example` in `.env.local` e compila i valori:

```bash
cp .env.local.example .env.local
```

Modifica `.env.local` con i tuoi valori Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Eseguire lo schema del database

1. Vai nel dashboard di Supabase
2. Naviga in "SQL Editor"
3. Copia e incolla il contenuto di `schema.sql`
4. Esegui lo script

### 4. (Opzionale) Inserire dati di esempio

Per inserire dati di test:

1. Nel SQL Editor di Supabase
2. Copia e incolla il contenuto di `seed.sql`
3. Esegui lo script

## Struttura del Database

### Tabelle principali

- **users** - Utenti del sistema (admin/dipendenti)
- **clienti** - Anagrafica clienti
- **veicoli** - Veicoli dei clienti
- **ordini_lavoro** - Ordini di lavoro/riparazioni
- **preventivi** - Preventivi per i clienti
- **voci_preventivo** - Dettaglio voci dei preventivi
- **fatture** - Fatture emesse
- **voci_fattura** - Dettaglio voci delle fatture

### Enum Types

- **user_role**: 'admin', 'employee'
- **stato_ordine**: 'in_attesa', 'in_lavorazione', 'completato', 'consegnato', 'annullato'
- **stato_preventivo**: 'bozza', 'inviato', 'accettato', 'rifiutato', 'scaduto'
- **stato_fattura**: 'bozza', 'emessa', 'pagata', 'scaduta', 'annullata'

### Funzionalità automatiche

- **Timestamp automatici**: `created_at` e `updated_at` gestiti automaticamente
- **Calcolo totali**: Importi totali di preventivi e fatture calcolati automaticamente
- **Numerazione progressiva**: Funzioni per generare numeri progressivi per ordini, preventivi e fatture
- **Row Level Security**: Policy di sicurezza per controllare l'accesso ai dati

### Sicurezza (RLS)

- **Admin**: Accesso completo a tutti i dati
- **Dipendenti**: Possono vedere solo gli ordini di lavoro assegnati a loro
- **Autenticazione**: Tutti gli utenti devono essere autenticati per accedere ai dati

## Prossimi passi

Dopo aver configurato il database:

1. Testare la connessione dall'applicazione Next.js
2. Creare il primo utente admin
3. Implementare l'autenticazione
4. Sviluppare le API routes per CRUD operations
