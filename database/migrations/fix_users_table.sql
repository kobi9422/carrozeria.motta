-- Migration: Aggiungere colonne mancanti alla tabella users
-- Questo script aggiunge le colonne necessarie per il login e la gestione dei dipendenti

-- Aggiungi colonna password se non esiste
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';

-- Aggiungi colonna attivo se non esiste
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS attivo BOOLEAN DEFAULT true;

-- Aggiungi colonna telefono se non esiste
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS telefono TEXT;

-- Aggiungi colonna costo_orario se non esiste
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS costo_orario DECIMAL(10, 2) DEFAULT 0;

-- Rimuovi il vincolo di foreign key da auth.users se esiste
-- (Supabase gestisce gli utenti separatamente)
-- Questo è già stato fatto nello schema principale

-- Crea indice su email per velocizzare le ricerche di login
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Crea indice su attivo per velocizzare le ricerche di utenti attivi
CREATE INDEX IF NOT EXISTS idx_users_attivo ON public.users(attivo);

-- Aggiorna il trigger per updated_at se non esiste
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at_trigger ON public.users;
CREATE TRIGGER update_users_updated_at_trigger
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

