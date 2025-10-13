# 🚀 Deploy su Vercel - Guida Completa

## ✅ Preparazione Completata

- ✅ Repository GitHub creato: `https://github.com/kobi9422/carrozeria.motta`
- ✅ Codice pushato su GitHub
- ✅ Schema Prisma migrato a PostgreSQL
- ✅ Progetto Supabase esistente: `carrozzeria-gestionale` (EU-Central-1)

---

## 📋 STEP 1: Ottieni Credenziali Supabase

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard/project/jnyxmgiethfesfkyknga/settings/database)
2. Nella sezione "Database Settings" → "Connection string"
3. Seleziona "URI" e copia la connection string
4. Sostituisci `[YOUR-PASSWORD]` con la password del database

La connection string sarà simile a:
```
postgresql://postgres.jnyxmgiethfesfkyknga:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

---

## 📋 STEP 2: Crea Tabelle nel Database Supabase

Esegui questi comandi nel terminale:

```bash
cd c:\Users\kobi9\motta\carrozzeria-motta

# Crea file .env con le credenziali Supabase
# Sostituisci [YOUR-PASSWORD] con la password reale
echo DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.jnyxmgiethfesfkyknga.supabase.co:6543/postgres?pgbouncer=true" > .env
echo DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.jnyxmgiethfesfkyknga.supabase.co:5432/postgres" >> .env
echo JWT_SECRET="carrozzeria_motta_jwt_secret_key_2025" >> .env

# Genera Prisma Client
npx prisma generate

# Crea le tabelle nel database
npx prisma db push

# (Opzionale) Popola con dati di esempio
npm run db:seed
```

---

## 📋 STEP 3: Deploy su Vercel

### Opzione A: Deploy Automatico (Consigliato)

Esegui nel terminale:

```bash
# Installa Vercel CLI (se non l'hai già)
npm i -g vercel

# Deploy
vercel

# Segui le istruzioni:
# - Set up and deploy? Yes
# - Which scope? kobi9422's projects
# - Link to existing project? No
# - Project name? carrozzeria-motta
# - Directory? ./
# - Override settings? No
```

### Opzione B: Deploy da Dashboard Vercel

1. Vai su [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Seleziona `kobi9422/carrozeria.motta`
4. Click "Import"
5. Configura:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: (lascia default)
   - **Output Directory**: (lascia default)

---

## 📋 STEP 4: Configura Environment Variables su Vercel

Nel dashboard Vercel, vai su:
**Settings** → **Environment Variables**

Aggiungi queste variabili:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.jnyxmgiethfesfkyknga.supabase.co:6543/postgres?pgbouncer=true` | Production, Preview, Development |
| `DIRECT_URL` | `postgresql://postgres:[PASSWORD]@db.jnyxmgiethfesfkyknga.supabase.co:5432/postgres` | Production, Preview, Development |
| `JWT_SECRET` | `carrozzeria_motta_jwt_secret_key_2025` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

⚠️ **IMPORTANTE**: Sostituisci `[PASSWORD]` con la password reale del database Supabase!

---

## 📋 STEP 5: Redeploy

Dopo aver aggiunto le environment variables:

1. Vai su **Deployments**
2. Click sui 3 puntini dell'ultimo deployment
3. Click "Redeploy"
4. Attendi il completamento (2-3 minuti)

---

## 🎉 STEP 6: Primo Accesso

1. Apri l'URL del tuo sito (es: `https://carrozzeria-motta.vercel.app`)
2. Vai alla pagina di login
3. Credenziali admin:
   - **Email**: `admin@carrozzeriamotta.it`
   - **Password**: `admin123`

⚠️ **IMPORTANTE**: Cambia subito la password dopo il primo accesso!

---

## 🔧 Troubleshooting

### Build fallisce con errore Prisma

```bash
# Assicurati che postinstall sia in package.json
"postinstall": "prisma generate"
```

### Errore "Can't reach database server"

- Verifica che le environment variables siano corrette
- Controlla che la password non contenga caratteri speciali non escaped
- Verifica che il progetto Supabase sia ACTIVE

### Database vuoto

```bash
# Esegui seed dal terminale locale (con .env configurato)
npm run db:seed
```

---

## 📊 Vantaggi Vercel + Supabase

- ✅ Deploy automatico da GitHub
- ✅ SSL gratuito
- ✅ CDN globale
- ✅ Database PostgreSQL scalabile
- ✅ Backup automatici (Supabase)
- ✅ Zero configurazione server
- ✅ Preview deployments per ogni PR

---

## 💰 Costi

- **Vercel**: Gratuito (Hobby plan)
  - 100GB bandwidth/mese
  - Deploy illimitati
  - Preview deployments

- **Supabase**: Gratuito (Free tier)
  - 500MB database
  - 1GB file storage
  - 50,000 monthly active users

---

## 🆘 Supporto

Se hai problemi:
1. Controlla i logs su Vercel Dashboard → Deployments → Logs
2. Verifica le environment variables
3. Testa la connessione al database con Prisma Studio locale

---

**Buon deploy! 🚀**

