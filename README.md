# 🚗 Carrozzeria Motta - Sistema di Gestione

Sistema completo di gestione per carrozzeria con dashboard separate per amministratori e dipendenti.

## 🚀 Avvio Rapido

### Prerequisiti
- Node.js 18+
- npm o yarn

### Installazione e Avvio

```bash
# Clona il repository
git clone <repository-url>
cd carrozzeria-motta

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

### 🔑 Credenziali di Accesso

**Amministratore:**
- Email: `admin@carrozzeriamotta.it`
- Password: `admin123`

**Dipendente:**
- Email: `dipendente@carrozzeriamotta.it`
- Password: `dipendente123`

## 🏗️ Architettura

### Stack Tecnologico
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Database**: SQLite locale con Prisma ORM
- **Autenticazione**: JWT con cookie httpOnly
- **UI Components**: React Hook Form + Lucide Icons
- **Calendario**: React Big Calendar
- **PDF**: jsPDF per preventivi e fatture

### Struttura Database
- **Users**: Gestione utenti (admin/dipendenti)
- **Clienti**: Anagrafica clienti
- **Veicoli**: Veicoli associati ai clienti
- **Ordini di Lavoro**: Gestione riparazioni
- **Preventivi**: Creazione e gestione preventivi
- **Fatture**: Sistema di fatturazione

## 📱 Funzionalità

### Dashboard Amministratore
- ✅ Panoramica statistiche
- ✅ Gestione clienti completa
- ✅ Gestione ordini di lavoro
- ✅ Calendario personalizzabile
- ✅ Sistema preventivi
- ✅ Sistema fatturazione
- ✅ Gestione dipendenti

### Dashboard Dipendente
- ✅ Visualizzazione ordini assegnati
- ✅ Aggiornamento stato lavori
- ✅ Statistiche personali

## 🛠️ Comandi Utili

```bash
# Database
npm run db:generate    # Genera client Prisma
npm run db:push        # Sincronizza schema
npm run db:seed        # Popola dati di esempio
npm run db:studio      # Apri Prisma Studio

# Sviluppo
npm run dev           # Server di sviluppo
npm run build         # Build produzione
npm run start         # Avvia build produzione
npm run lint          # Linting codice
```

## 📁 Struttura Progetto

```
carrozzeria-motta/
├── prisma/
│   ├── schema.prisma     # Schema database
│   ├── seed.ts          # Dati di esempio
│   └── dev.db           # Database SQLite
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── admin/       # Dashboard admin
│   │   ├── employee/    # Dashboard dipendenti
│   │   ├── auth/        # Autenticazione
│   │   └── api/         # API routes
│   ├── components/      # Componenti React
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utility e configurazioni
│   └── types/          # Definizioni TypeScript
└── database/           # Documentazione DB (legacy)
```

## 🔒 Sicurezza

- **Autenticazione JWT** con cookie httpOnly
- **Hash password** con bcrypt (12 rounds)
- **Row Level Security** tramite middleware
- **Validazione input** con Zod
- **Protezione CSRF** tramite SameSite cookies

## 🚀 Deploy su Render

### Prerequisiti
- Account GitHub
- Account Render.com (gratuito)

### Passaggi

1. **Push su GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TUO-USERNAME/carrozzeria-motta.git
git push -u origin main
```

2. **Crea Web Service su Render**:
   - Vai su [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connetti il repository GitHub
   - Configura:
     - **Name**: `carrozzeria-motta`
     - **Region**: Frankfurt (o più vicino a te)
     - **Branch**: `main`
     - **Build Command**: `npm install && npx prisma generate && npm run build`
     - **Start Command**: `npm start`

3. **Aggiungi Persistent Disk**:
   - Nella configurazione del servizio
   - Scroll down → "Disks"
   - Click "Add Disk"
   - **Name**: `carrozzeria-db`
   - **Mount Path**: `/opt/render/project/src/prisma`
   - **Size**: 1 GB (gratuito)

4. **Configura Environment Variables**:
   - `DATABASE_URL` = `file:./dev.db`
   - `JWT_SECRET` = (genera un valore sicuro casuale)
   - `NODE_ENV` = `production`

5. **Deploy**:
   - Click "Create Web Service"
   - Attendi il deploy (3-5 minuti)
   - Il tuo sito sarà disponibile su `https://carrozzeria-motta.onrender.com`

⚠️ **IMPORTANTE**: Cambia la password admin dopo il primo accesso!

## 📊 Dati di Esempio

Il sistema include dati di esempio:
- 2 utenti (admin + dipendente)
- 2 clienti con veicoli
- 2 ordini di lavoro
- Statistiche demo

## 🤝 Contribuire

1. Fork del repository
2. Crea feature branch (`git checkout -b feature/nuova-funzionalita`)
3. Commit modifiche (`git commit -am 'Aggiungi nuova funzionalità'`)
4. Push branch (`git push origin feature/nuova-funzionalita`)
5. Crea Pull Request

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per dettagli.

## 🆘 Supporto

Per problemi o domande:
1. Controlla la documentazione
2. Cerca negli issues esistenti
3. Crea un nuovo issue con dettagli

---

**Sviluppato per Carrozzeria Motta** 🚗✨
