-- Migrazione: Aggiunta tabelle e colonne mancanti
-- Data: 2025-11-03
-- Descrizione: Aggiunge tutte le tabelle e colonne necessarie per il progetto

-- 1. Aggiungere colonne mancanti a clienti
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS provincia TEXT;
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS codice_fiscale TEXT;
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS partita_iva TEXT;
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS tipo_cliente TEXT DEFAULT 'privato';
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS sdi TEXT;
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS codice_univoco TEXT;
ALTER TABLE public.clienti ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 2. Aggiungere colonne IVA a voci_preventivo
ALTER TABLE public.voci_preventivo ADD COLUMN IF NOT EXISTS iva DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.voci_preventivo ADD COLUMN IF NOT EXISTS importo_iva DECIMAL(10,2) GENERATED ALWAYS AS (importo_totale * iva / 100) STORED;

-- 3. Aggiungere colonne IVA a voci_fattura
ALTER TABLE public.voci_fattura ADD COLUMN IF NOT EXISTS iva DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.voci_fattura ADD COLUMN IF NOT EXISTS importo_iva DECIMAL(10,2) GENERATED ALWAYS AS (importo_totale * iva / 100) STORED;

-- 4. Aggiungere colonna ordine_lavoro_id a preventivi
ALTER TABLE public.preventivi ADD COLUMN IF NOT EXISTS ordine_lavoro_id UUID REFERENCES public.ordini_lavoro(id) ON DELETE SET NULL;

-- 5. Creare tabella impostazioni
CREATE TABLE IF NOT EXISTS public.impostazioni (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome_azienda TEXT NOT NULL DEFAULT 'Carrozzeria Motta',
    indirizzo TEXT,
    citta TEXT,
    cap TEXT,
    provincia TEXT,
    telefono TEXT,
    email TEXT,
    partita_iva TEXT,
    codice_fiscale TEXT,
    iban TEXT,
    banca TEXT,
    condizioni_pagamento TEXT,
    note_legali_fattura TEXT,
    validita_preventivi INTEGER DEFAULT 30,
    note_standard_preventivo TEXT,
    firma_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Creare tabella ordini_lavoro_sessioni
CREATE TABLE IF NOT EXISTS public.ordini_lavoro_sessioni (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ordine_lavoro_id UUID REFERENCES public.ordini_lavoro(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Creare tabella eventi
CREATE TABLE IF NOT EXISTS public.eventi (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titolo TEXT NOT NULL,
    descrizione TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('ordine', 'appuntamento', 'scadenza', 'altro')),
    data_inizio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fine TIMESTAMP WITH TIME ZONE,
    ora_inizio TIME,
    ora_fine TIME,
    tutto_il_giorno BOOLEAN DEFAULT FALSE,
    cliente_id UUID REFERENCES public.clienti(id) ON DELETE SET NULL,
    veicolo_id UUID REFERENCES public.veicoli(id) ON DELETE SET NULL,
    ordine_lavoro_id UUID REFERENCES public.ordini_lavoro(id) ON DELETE CASCADE,
    note TEXT,
    colore TEXT DEFAULT '#3B82F6',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Creare indici per le nuove tabelle
CREATE INDEX IF NOT EXISTS idx_ordini_lavoro_sessioni_ordine_id ON public.ordini_lavoro_sessioni(ordine_lavoro_id);
CREATE INDEX IF NOT EXISTS idx_ordini_lavoro_sessioni_user_id ON public.ordini_lavoro_sessioni(user_id);
CREATE INDEX IF NOT EXISTS idx_ordini_lavoro_sessioni_end_time ON public.ordini_lavoro_sessioni(end_time);
CREATE INDEX IF NOT EXISTS idx_eventi_data_inizio ON public.eventi(data_inizio);
CREATE INDEX IF NOT EXISTS idx_eventi_cliente_id ON public.eventi(cliente_id);
CREATE INDEX IF NOT EXISTS idx_eventi_ordine_id ON public.eventi(ordine_lavoro_id);

-- 9. Abilitare RLS sulle nuove tabelle
ALTER TABLE public.impostazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordini_lavoro_sessioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventi ENABLE ROW LEVEL SECURITY;

-- 10. Creare policy RLS per impostazioni (solo admin)
DROP POLICY IF EXISTS "Admin can manage impostazioni" ON public.impostazioni;
CREATE POLICY "Admin can manage impostazioni" ON public.impostazioni
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND ruolo = 'admin'
        )
    );

-- 11. Creare policy RLS per ordini_lavoro_sessioni
DROP POLICY IF EXISTS "Users can view own sessions" ON public.ordini_lavoro_sessioni;
CREATE POLICY "Users can view own sessions" ON public.ordini_lavoro_sessioni
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND ruolo = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can manage own sessions" ON public.ordini_lavoro_sessioni;
CREATE POLICY "Users can manage own sessions" ON public.ordini_lavoro_sessioni
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND ruolo = 'admin'
        )
    );

-- 12. Creare policy RLS per eventi
DROP POLICY IF EXISTS "Authenticated users can manage eventi" ON public.eventi;
CREATE POLICY "Authenticated users can manage eventi" ON public.eventi
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 13. Creare trigger per updated_at sulle nuove tabelle
DROP TRIGGER IF EXISTS update_impostazioni_updated_at ON public.impostazioni;
CREATE TRIGGER update_impostazioni_updated_at BEFORE UPDATE ON public.impostazioni FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ordini_lavoro_sessioni_updated_at ON public.ordini_lavoro_sessioni;
CREATE TRIGGER update_ordini_lavoro_sessioni_updated_at BEFORE UPDATE ON public.ordini_lavoro_sessioni FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eventi_updated_at ON public.eventi;
CREATE TRIGGER update_eventi_updated_at BEFORE UPDATE ON public.eventi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

