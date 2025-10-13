-- Schema del database per Carrozzeria Motta
-- Questo file contiene tutte le tabelle, enum, funzioni e policy RLS

-- Abilita l'estensione UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum per i ruoli utente
CREATE TYPE user_role AS ENUM ('admin', 'employee');

-- Enum per gli stati degli ordini di lavoro
CREATE TYPE stato_ordine AS ENUM ('in_attesa', 'in_lavorazione', 'completato', 'consegnato', 'annullato');

-- Enum per gli stati dei preventivi
CREATE TYPE stato_preventivo AS ENUM ('bozza', 'inviato', 'accettato', 'rifiutato', 'scaduto');

-- Enum per gli stati delle fatture
CREATE TYPE stato_fattura AS ENUM ('bozza', 'emessa', 'pagata', 'scaduta', 'annullata');

-- Tabella utenti (estende auth.users di Supabase)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    ruolo user_role DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella clienti
CREATE TABLE public.clienti (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    indirizzo TEXT,
    citta TEXT,
    cap TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella veicoli
CREATE TABLE public.veicoli (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clienti(id) ON DELETE CASCADE,
    marca TEXT NOT NULL,
    modello TEXT NOT NULL,
    anno INTEGER,
    targa TEXT NOT NULL UNIQUE,
    colore TEXT,
    numero_telaio TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella ordini di lavoro
CREATE TABLE public.ordini_lavoro (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero_ordine TEXT UNIQUE NOT NULL,
    cliente_id UUID REFERENCES public.clienti(id) ON DELETE CASCADE,
    veicolo_id UUID REFERENCES public.veicoli(id) ON DELETE CASCADE,
    dipendente_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    titolo TEXT NOT NULL,
    descrizione TEXT NOT NULL,
    stato stato_ordine DEFAULT 'in_attesa',
    data_inizio DATE NOT NULL,
    data_fine_prevista DATE,
    data_fine_effettiva DATE,
    costo_stimato DECIMAL(10,2),
    costo_finale DECIMAL(10,2),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella preventivi
CREATE TABLE public.preventivi (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero_preventivo TEXT UNIQUE NOT NULL,
    cliente_id UUID REFERENCES public.clienti(id) ON DELETE CASCADE,
    veicolo_id UUID REFERENCES public.veicoli(id) ON DELETE SET NULL,
    titolo TEXT NOT NULL,
    descrizione TEXT NOT NULL,
    stato stato_preventivo DEFAULT 'bozza',
    importo_totale DECIMAL(10,2) NOT NULL DEFAULT 0,
    data_scadenza DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella voci preventivo
CREATE TABLE public.voci_preventivo (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    preventivo_id UUID REFERENCES public.preventivi(id) ON DELETE CASCADE,
    descrizione TEXT NOT NULL,
    quantita INTEGER NOT NULL DEFAULT 1,
    prezzo_unitario DECIMAL(10,2) NOT NULL,
    importo_totale DECIMAL(10,2) GENERATED ALWAYS AS (quantita * prezzo_unitario) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella fatture
CREATE TABLE public.fatture (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero_fattura TEXT UNIQUE NOT NULL,
    cliente_id UUID REFERENCES public.clienti(id) ON DELETE CASCADE,
    ordine_lavoro_id UUID REFERENCES public.ordini_lavoro(id) ON DELETE SET NULL,
    preventivo_id UUID REFERENCES public.preventivi(id) ON DELETE SET NULL,
    stato stato_fattura DEFAULT 'bozza',
    importo_totale DECIMAL(10,2) NOT NULL DEFAULT 0,
    data_emissione DATE NOT NULL,
    data_scadenza DATE NOT NULL,
    data_pagamento DATE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella voci fattura
CREATE TABLE public.voci_fattura (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fattura_id UUID REFERENCES public.fatture(id) ON DELETE CASCADE,
    descrizione TEXT NOT NULL,
    quantita INTEGER NOT NULL DEFAULT 1,
    prezzo_unitario DECIMAL(10,2) NOT NULL,
    importo_totale DECIMAL(10,2) GENERATED ALWAYS AS (quantita * prezzo_unitario) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per migliorare le performance
CREATE INDEX idx_clienti_nome_cognome ON public.clienti(nome, cognome);
CREATE INDEX idx_veicoli_cliente_id ON public.veicoli(cliente_id);
CREATE INDEX idx_veicoli_targa ON public.veicoli(targa);
CREATE INDEX idx_ordini_lavoro_cliente_id ON public.ordini_lavoro(cliente_id);
CREATE INDEX idx_ordini_lavoro_dipendente_id ON public.ordini_lavoro(dipendente_id);
CREATE INDEX idx_ordini_lavoro_stato ON public.ordini_lavoro(stato);
CREATE INDEX idx_preventivi_cliente_id ON public.preventivi(cliente_id);
CREATE INDEX idx_preventivi_stato ON public.preventivi(stato);
CREATE INDEX idx_fatture_cliente_id ON public.fatture(cliente_id);
CREATE INDEX idx_fatture_stato ON public.fatture(stato);

-- Funzione per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clienti_updated_at BEFORE UPDATE ON public.clienti FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_veicoli_updated_at BEFORE UPDATE ON public.veicoli FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ordini_lavoro_updated_at BEFORE UPDATE ON public.ordini_lavoro FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preventivi_updated_at BEFORE UPDATE ON public.preventivi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fatture_updated_at BEFORE UPDATE ON public.fatture FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funzione per aggiornare automaticamente l'importo totale dei preventivi
CREATE OR REPLACE FUNCTION update_preventivo_totale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.preventivi
    SET importo_totale = (
        SELECT COALESCE(SUM(importo_totale), 0)
        FROM public.voci_preventivo
        WHERE preventivo_id = COALESCE(NEW.preventivo_id, OLD.preventivo_id)
    )
    WHERE id = COALESCE(NEW.preventivo_id, OLD.preventivo_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger per aggiornare totale preventivo
CREATE TRIGGER update_preventivo_totale_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.voci_preventivo
    FOR EACH ROW EXECUTE FUNCTION update_preventivo_totale();

-- Funzione per aggiornare automaticamente l'importo totale delle fatture
CREATE OR REPLACE FUNCTION update_fattura_totale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.fatture
    SET importo_totale = (
        SELECT COALESCE(SUM(importo_totale), 0)
        FROM public.voci_fattura
        WHERE fattura_id = COALESCE(NEW.fattura_id, OLD.fattura_id)
    )
    WHERE id = COALESCE(NEW.fattura_id, OLD.fattura_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger per aggiornare totale fattura
CREATE TRIGGER update_fattura_totale_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.voci_fattura
    FOR EACH ROW EXECUTE FUNCTION update_fattura_totale();

-- Abilita RLS su tutte le tabelle
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veicoli ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordini_lavoro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preventivi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voci_preventivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fatture ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voci_fattura ENABLE ROW LEVEL SECURITY;

-- Policy per users: solo admin può gestire utenti
CREATE POLICY "Admin can manage users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND ruolo = 'admin'
        )
    );

-- Policy per users: utenti possono vedere il proprio profilo
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Policy per clienti: tutti gli utenti autenticati possono vedere e gestire
CREATE POLICY "Authenticated users can manage clienti" ON public.clienti
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policy per veicoli: tutti gli utenti autenticati possono vedere e gestire
CREATE POLICY "Authenticated users can manage veicoli" ON public.veicoli
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policy per ordini di lavoro: admin può tutto, dipendenti solo i propri assegnati
CREATE POLICY "Admin can manage all ordini_lavoro" ON public.ordini_lavoro
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND ruolo = 'admin'
        )
    );

CREATE POLICY "Employees can view assigned ordini_lavoro" ON public.ordini_lavoro
    FOR SELECT USING (
        dipendente_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND ruolo = 'admin'
        )
    );

-- Policy per preventivi: tutti gli utenti autenticati possono gestire
CREATE POLICY "Authenticated users can manage preventivi" ON public.preventivi
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policy per voci preventivo: tutti gli utenti autenticati possono gestire
CREATE POLICY "Authenticated users can manage voci_preventivo" ON public.voci_preventivo
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policy per fatture: tutti gli utenti autenticati possono gestire
CREATE POLICY "Authenticated users can manage fatture" ON public.fatture
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policy per voci fattura: tutti gli utenti autenticati possono gestire
CREATE POLICY "Authenticated users can manage voci_fattura" ON public.voci_fattura
    FOR ALL USING (auth.uid() IS NOT NULL);
