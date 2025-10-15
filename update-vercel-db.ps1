# Script per aggiornare DATABASE_URL su Vercel

$dbUrl = "postgresql://postgres:Kaddoclank1@db.jnyxmgiethfesfkyknga.supabase.co:5432/postgres"

# Rimuovi e ricrea per Production
vercel env rm DATABASE_URL production --yes
echo $dbUrl | vercel env add DATABASE_URL production

# Rimuovi e ricrea per Preview
vercel env rm DATABASE_URL preview --yes
echo $dbUrl | vercel env add DATABASE_URL preview

# Rimuovi e ricrea per Development
vercel env rm DATABASE_URL development --yes
echo $dbUrl | vercel env add DATABASE_URL development

Write-Host "✅ DATABASE_URL aggiornato su Vercel!"
Write-Host "Ora fai: vercel --prod"

