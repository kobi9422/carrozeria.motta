# 🚀 Deployment Guide - Carrozzeria Motta

## Opzioni di Deployment

### 1. 🏠 Deployment Locale (Sviluppo)

Il sistema è già configurato per funzionare localmente:

```bash
# Installa dipendenze
npm install

# Avvia in modalità sviluppo
npm run dev

# Build per produzione locale
npm run build
npm start
```

**Database**: SQLite locale (`prisma/dev.db`)
**URL**: http://localhost:3000

### 2. ☁️ Vercel (Consigliato)

#### Setup Rapido
1. **Push su GitHub**:
   ```bash
   git add .
   git commit -m "Deploy setup"
   git push origin main
   ```

2. **Connetti a Vercel**:
   - Vai su [vercel.com](https://vercel.com)
   - Importa il repository GitHub
   - Configura le variabili d'ambiente

3. **Variabili d'Ambiente**:
   ```env
   # Database (usa PostgreSQL per produzione)
   DATABASE_URL="postgresql://user:password@host:port/database"
   
   # JWT Secret (genera una chiave sicura)
   JWT_SECRET="your-super-secure-jwt-secret-key-here"
   
   # Node Environment
   NODE_ENV="production"
   ```

4. **Database Setup**:
   ```bash
   # Migra a PostgreSQL
   npm install @prisma/client prisma
   npx prisma db push
   npx prisma db seed
   ```

#### Configurazione Avanzata

**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 3. 🐳 Docker

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./
COPY prisma ./prisma/

# Installa dipendenze
RUN npm ci --only=production

# Copia codice sorgente
COPY . .

# Genera Prisma client
RUN npx prisma generate

# Build applicazione
RUN npm run build

EXPOSE 3000

# Avvia applicazione
CMD ["npm", "start"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/carrozzeria
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=carrozzeria
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 4. 🚂 Railway

1. **Connetti Repository**:
   - Vai su [railway.app](https://railway.app)
   - Connetti GitHub repository

2. **Aggiungi Database**:
   - Aggiungi PostgreSQL service
   - Copia DATABASE_URL

3. **Variabili d'Ambiente**:
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-jwt-secret
   NODE_ENV=production
   ```

4. **Deploy**:
   - Railway deploya automaticamente ad ogni push

### 5. 🌐 VPS/Server Dedicato

#### Setup con PM2

1. **Installa Node.js e PM2**:
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   npm install -g pm2
   ```

2. **Clone e Setup**:
   ```bash
   git clone <repository-url>
   cd carrozzeria-motta
   npm install
   npm run build
   ```

3. **Configurazione PM2**:
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'carrozzeria-motta',
       script: 'npm',
       args: 'start',
       env: {
         NODE_ENV: 'production',
         PORT: 3000,
         DATABASE_URL: 'your-database-url',
         JWT_SECRET: 'your-jwt-secret'
       }
     }]
   }
   ```

4. **Avvia con PM2**:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

#### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Migration

### Da SQLite a PostgreSQL

1. **Backup dati SQLite**:
   ```bash
   npx prisma db seed
   ```

2. **Aggiorna schema per PostgreSQL**:
   ```prisma
   // prisma/schema.prisma
   generator client {
     provider = "prisma-client-js"
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Migra database**:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

## Variabili d'Ambiente

### Produzione
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Autenticazione
JWT_SECRET="your-super-secure-jwt-secret-minimum-32-characters"

# Ambiente
NODE_ENV="production"
PORT=3000

# Optional: Logging
LOG_LEVEL="info"
```

### Sicurezza

- **JWT_SECRET**: Usa una chiave di almeno 32 caratteri
- **DATABASE_URL**: Non esporre mai in pubblico
- **HTTPS**: Usa sempre HTTPS in produzione
- **CORS**: Configura domini autorizzati

## Monitoraggio

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
}
```

### Logging

```bash
# PM2 logs
pm2 logs carrozzeria-motta

# Docker logs
docker logs container-name

# Vercel logs
vercel logs
```

## Backup

### Database Backup

```bash
# PostgreSQL
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### File Backup

```bash
# Backup uploads (se presenti)
tar -czf uploads-backup.tar.gz uploads/

# Backup configurazione
tar -czf config-backup.tar.gz .env* prisma/
```

## Troubleshooting

### Problemi Comuni

1. **Database Connection Error**:
   - Verifica DATABASE_URL
   - Controlla firewall/security groups
   - Testa connessione database

2. **JWT Errors**:
   - Verifica JWT_SECRET
   - Controlla scadenza token
   - Valida formato cookie

3. **Build Errors**:
   - Pulisci cache: `npm run clean`
   - Reinstalla: `rm -rf node_modules && npm install`
   - Verifica versioni Node.js

4. **Performance Issues**:
   - Abilita caching
   - Ottimizza query database
   - Usa CDN per assets statici

---

**Per supporto deployment**: Consulta la documentazione specifica della piattaforma scelta.
