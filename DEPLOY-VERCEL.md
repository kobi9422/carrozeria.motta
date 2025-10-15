# 🚀 DEPLOY SU VERCEL - ISTRUZIONI FINALI

## ⚠️ PROBLEMA ATTUALE
Il webhook GitHub → Vercel non sta funzionando, quindi i deploy automatici non partono.

## ✅ SOLUZIONE: Deploy Manuale

### **Opzione 1: Vercel Dashboard (Consigliato)**

1. **Vai su**: https://vercel.com/kobi9422s-projects/carrozzeria-motta

2. **Configura Environment Variables** (SE NON L'HAI GIÀ FATTO):
   - Vai su: https://vercel.com/kobi9422s-projects/carrozzeria-motta/settings/environment-variables
   - Aggiungi queste 3 variabili (minimo):
     ```
     DATABASE_URL=postgresql://postgres:Kaddoclank1@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     DIRECT_URL=postgresql://postgres:Kaddoclank1@db.jnyxmgiethfesfkyknga.supabase.co:5432/postgres
     JWT_SECRET=carrozzeria_motta_jwt_secret_key_2025_production_secure
     ```
   - Seleziona: ✅ Production, ✅ Preview, ✅ Development

3. **Triggera Redeploy**:
   - Clicca sul deployment più recente
   - Clicca "..." → "Redeploy"
   - Conferma

4. **Aspetta il build** (2-3 minuti)

5. **Testa**: https://carrozzeria-motta.vercel.app

---

### **Opzione 2: Vercel CLI**

```powershell
# Installa Vercel CLI (se non l'hai già)
npm install -g vercel

# Login
vercel login

# Deploy in produzione
vercel --prod
```

---

## 🎯 VERIFICA FINALE

Dopo il deploy, vai su: **https://carrozzeria-motta.vercel.app**

Login con:
- **Email**: `admin@carrozzeriamotta.it`
- **Password**: `admin123`

Prova a creare un preventivo. Dovrebbe funzionare! ✅

---

## 🔧 DEBUG

Se ancora non funziona, verifica i log:

1. Vai su: https://vercel.com/kobi9422s-projects/carrozzeria-motta
2. Clicca sull'ultimo deployment
3. Vai su "Build Logs"
4. Cerca errori

---

## 📋 CHECKLIST

- [ ] Environment variables configurate su Vercel
- [ ] Redeploy manuale triggerato
- [ ] Build completato con successo
- [ ] App accessibile su https://carrozzeria-motta.vercel.app
- [ ] Login funzionante
- [ ] Creazione preventivo funzionante

---

## 🆘 SE HAI PROBLEMI

Copia i log del deployment e mandameli!

