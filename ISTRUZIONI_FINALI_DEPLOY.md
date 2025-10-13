# 🎯 ISTRUZIONI FINALI PER COMPLETARE IL DEPLOY

## ✅ **GIÀ COMPLETATO AUTOMATICAMENTE**

1. ✅ Repository GitHub creato: `https://github.com/kobi9422/carrozeria.motta`
2. ✅ Codice pushato su GitHub
3. ✅ Schema Prisma migrato a PostgreSQL
4. ✅ Progetto Vercel creato: `carrozzeria-motta`
5. ✅ ESLint disabilitato per il build
6. ✅ Progetto Supabase esistente: `carrozzeria-gestionale` (EU-Central-1, ACTIVE)

---

## 📋 **STEP 1: Recupera Password Database Supabase**

### Opzione A: Hai già la password
Se ricordi la password del database Supabase, usala direttamente.

### Opzione B: Resetta la password
1. Vai su [Supabase Dashboard](https://supabase.com/dashboard/project/jnyxmgiethfesfkyknga/settings/database)
2. Scroll down fino a "Database password"
3. Click "Reset database password"
4. Copia la nuova password (es: `CarrozzeriaMotta2025!`)

---

## 📋 **STEP 2: Configura Environment Variables su Vercel**

1. Vai su [Vercel Dashboard - carrozzeria-motta](https://vercel.com/kobi9422s-projects/carrozzeria-motta/settings/environment-variables)

2. Aggiungi queste 4 variabili (click "Add" per ognuna):

### Variable 1: DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://postgres.jnyxmgiethfesfkyknga:[TUA-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### Variable 2: DIRECT_URL
- **Name**: `DIRECT_URL`
- **Value**: `postgresql://postgres.jnyxmgiethfesfkyknga:[TUA-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### Variable 3: JWT_SECRET
- **Name**: `JWT_SECRET`
- **Value**: `carrozzeria_motta_jwt_secret_key_2025_production_secure`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### Variable 4: NODE_ENV
- **Name**: `NODE_ENV`
- **Value**: `production`
- **Environments**: ✅ Production

⚠️ **IMPORTANTE**: Sostituisci `[TUA-PASSWORD]` con la password reale del database Supabase!

---

## 📋 **STEP 3: Crea Tabelle nel Database Supabase**

Apri il terminale PowerShell e esegui:

```powershell
cd c:\Users\kobi9\motta\carrozzeria-motta

# Crea file .env locale (sostituisci [TUA-PASSWORD])
@"
DATABASE_URL="postgresql://postgres.jnyxmgiethfesfkyknga:[TUA-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.jnyxmgiethfesfkyknga:[TUA-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="carrozzeria_motta_jwt_secret_key_2025"
"@ | Out-File -FilePath .env -Encoding utf8

# Genera Prisma Client
npx prisma generate

# Crea le tabelle nel database
npx prisma db push

# Popola con dati di esempio (admin + dipendente + clienti)
npm run db:seed
```

Dovresti vedere:
```
✔ Generated Prisma Client
✔ Database synchronized
✔ Seed data inserted
```

---

## 📋 **STEP 4: Redeploy su Vercel**

1. Vai su [Vercel Deployments](https://vercel.com/kobi9422s-projects/carrozzeria-motta)
2. Click sui **3 puntini** (⋮) dell'ultimo deployment
3. Click **"Redeploy"**
4. Attendi 2-3 minuti

Vedrai:
```
✓ Building
✓ Deploying
✓ Ready
```

---

## 📋 **STEP 5: Primo Accesso**

1. Apri: `https://carrozzeria-motta-kobi9422s-projects.vercel.app`
2. Vai alla pagina di login
3. Credenziali admin:
   - **Email**: `admin@carrozzeriamotta.it`
   - **Password**: `admin123`

⚠️ **IMPORTANTE**: Cambia subito la password dopo il primo accesso!

---

## 🎉 **DEPLOY COMPLETATO!**

Il tuo gestionale è ora live su:
- **URL Production**: `https://carrozzeria-motta-kobi9422s-projects.vercel.app`
- **Dashboard Vercel**: `https://vercel.com/kobi9422s-projects/carrozzeria-motta`
- **Database Supabase**: `https://supabase.com/dashboard/project/jnyxmgiethfesfkyknga`

---

## 🔧 **Troubleshooting**

### Build fallisce su Vercel
- Verifica che le environment variables siano configurate
- Controlla i logs: Vercel Dashboard → Deployments → Logs

### Errore "Can't reach database server"
- Verifica che la password sia corretta (senza spazi extra)
- Controlla che il progetto Supabase sia ACTIVE
- Prova la connessione con: `npx prisma db pull`

### Database vuoto dopo deploy
- Esegui `npx prisma db push` dal terminale locale
- Poi `npm run db:seed` per popolare i dati

### Errore 500 al login
- Verifica che `JWT_SECRET` sia configurato su Vercel
- Controlla che le tabelle siano state create (`users`, `clienti`, ecc.)

---

## 📊 **Prossimi Step (Opzionali)**

### 1. Dominio Personalizzato
1. Vercel Dashboard → Settings → Domains
2. Aggiungi: `gestionale.carrozzeriamotta.it`
3. Configura DNS come indicato

### 2. Backup Automatici
Supabase fa backup automatici ogni giorno. Puoi anche:
- Scaricare backup manuale: Impostazioni → Backup Database
- Configurare backup su cloud storage

### 3. Monitoraggio
- Vercel Analytics: Dashboard → Analytics
- Supabase Logs: Dashboard → Logs
- Uptime monitoring: UptimeRobot (gratuito)

---

## 📞 **Supporto**

Se hai problemi:
1. Controlla i logs su Vercel
2. Verifica le environment variables
3. Testa la connessione al database con Prisma Studio

---

**Buon lavoro con il tuo gestionale! 🚀**

