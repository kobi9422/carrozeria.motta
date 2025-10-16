-- Migration: Crea tabella eventi per il calendario
-- Data: 2025-01-16

-- Tabella eventi calendario
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

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_eventi_data_inizio ON public.eventi(data_inizio);
CREATE INDEX IF NOT EXISTS idx_eventi_data_fine ON public.eventi(data_fine);
CREATE INDEX IF NOT EXISTS idx_eventi_cliente_id ON public.eventi(cliente_id);
CREATE INDEX IF NOT EXISTS idx_eventi_tipo ON public.eventi(tipo);
CREATE INDEX IF NOT EXISTS idx_eventi_created_by ON public.eventi(created_by);

-- Commenti
COMMENT ON TABLE public.eventi IS 'Eventi del calendario per appuntamenti e scadenze';
COMMENT ON COLUMN public.eventi.tipo IS 'Tipo di evento: ordine, appuntamento, scadenza, altro';
COMMENT ON COLUMN public.eventi.tutto_il_giorno IS 'Se true, l''evento dura tutto il giorno';
COMMENT ON COLUMN public.eventi.colore IS 'Colore esadecimale per visualizzazione calendario';

