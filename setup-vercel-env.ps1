# Script PowerShell per configurare Environment Variables su Vercel
# Esegui questo script per configurare automaticamente tutte le variabili

Write-Host "🚀 Configurazione Environment Variables per Vercel" -ForegroundColor Cyan
Write-Host ""

# Verifica che Vercel CLI sia installato
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI non trovato!" -ForegroundColor Red
    Write-Host "Installalo con: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "📝 Configurazione variabili d'ambiente..." -ForegroundColor Green
Write-Host ""

# Array di variabili da configurare
$envVars = @(
    @{name="DATABASE_URL"; value="postgresql://postgres:Kaddoclank1@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"},
    @{name="DIRECT_URL"; value="postgresql://postgres:Kaddoclank1@db.jnyxmgiethfesfkyknga.supabase.co:5432/postgres"},
    @{name="JWT_SECRET"; value="carrozzeria_motta_jwt_secret_key_2025_production_secure"},
    @{name="NEXT_PUBLIC_SUPABASE_URL"; value="https://jnyxmgiethfesfkyknga.supabase.co"},
    @{name="NEXT_PUBLIC_SUPABASE_ANON_KEY"; value="sb_publishable_HUxfnpmp3DM8UsZLVywVVw_3d_9fptI"},
    @{name="NEXTAUTH_URL"; value="https://carrozzeria-motta.vercel.app"},
    @{name="NEXTAUTH_SECRET"; value="carrozzeria_motta_nextauth_secret_production_2025"},
    @{name="NEXT_PUBLIC_APP_NAME"; value="Carrozzeria Motta - Sistema di Gestione"},
    @{name="NEXT_PUBLIC_APP_VERSION"; value="1.0.0"},
    @{name="NODE_ENV"; value="production"}
)

# Configura ogni variabile per tutti gli ambienti
foreach ($env in $envVars) {
    Write-Host "⚙️  Configurazione $($env.name)..." -ForegroundColor Yellow
    
    # Production
    vercel env add $env.name production --force
    Write-Output $env.value | vercel env add $env.name production --force
    
    # Preview
    vercel env add $env.name preview --force
    Write-Output $env.value | vercel env add $env.name preview --force
    
    # Development
    vercel env add $env.name development --force
    Write-Output $env.value | vercel env add $env.name development --force
    
    Write-Host "✅ $($env.name) configurata" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Tutte le variabili sono state configurate!" -ForegroundColor Green
Write-Host "🚀 Ora puoi fare il deploy con: vercel --prod" -ForegroundColor Cyan

