# 🚀 Guida Deploy - Carrozzeria Motta

## ✅ Preparazione Completata

- ✅ Repository GitHub creato e configurato
- ✅ Schema Prisma migrato a PostgreSQL
- ✅ Progetto Vercel configurato
- ✅ ESLint disabilitato per il build

---

## 📋 Deploy su Vercel + Supabase

### STEP 1: Recupera Credenziali Database

1. Accedi al tuo progetto Supabase
2. Vai su Settings → Database
3. Copia la connection string PostgreSQL
4. Salva la password in un posto sicuro

### STEP 2: Configura Environment Variables su Vercel

Nel dashboard Vercel, vai su Settings → Environment Variables e aggiungi:

| Variable | Descrizione |
|----------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL con pgbouncer (porta 6543) |
| `DIRECT_URL` | Connection string PostgreSQL diretta (porta 5432) |
| `JWT_SECRET` | Chiave segreta per JWT (genera una stringa casuale sicura) |
| `NODE_ENV` | `production` |

⚠️ **IMPORTANTE**: Non committare mai le credenziali nel repository!

### STEP 3: Crea Tabelle nel Database

Nel terminale locale:

```bash
# Configura .env locale con le tue credenziali
# (vedi .env.example per il formato)

# Genera Prisma Client
npx prisma generate

# Crea le tabelle
npx prisma db push

# Popola con dati iniziali
npm run db:seed
```

### STEP 4: Deploy

1. Vai su Vercel Dashboard → Deployments
2. Click "Redeploy" sull'ultimo deployment
3. Attendi il completamento (2-3 minuti)

---

## 🎉 Primo Accesso

Dopo il deploy, accedi con:
- **Email**: `admin@carrozzeriamotta.it`
- **Password**: `admin123`

⚠️ **Cambia subito la password dopo il primo accesso!**

---

## 🔧 Troubleshooting

### Build fallisce
- Verifica le environment variables su Vercel
- Controlla i logs nel dashboard

### Errore connessione database
- Verifica la connection string
- Controlla che il database sia attivo
- Testa con `npx prisma db pull`

### Database vuoto
- Esegui `npx prisma db push` localmente
- Poi `npm run db:seed`

---

## 📊 Vantaggi

- ✅ Deploy automatico da GitHub
- ✅ SSL gratuito
- ✅ CDN globale
- ✅ Database PostgreSQL scalabile
- ✅ Backup automatici
- ✅ Preview deployments

---

**Per supporto, consulta la documentazione ufficiale di Vercel e Supabase.**

