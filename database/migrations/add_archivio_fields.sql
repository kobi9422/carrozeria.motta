-- Migration: Aggiungi campi per archiviazione
-- Data: 2025-01-15
-- Descrizione: Aggiunge campi archiviato e data_archiviazione alle tabelle ordini_lavoro, preventivi, fatture

-- Aggiungi campi a ordini_lavoro
ALTER TABLE public.ordini_lavoro
ADD COLUMN IF NOT EXISTS archiviato BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_archiviazione TIMESTAMP WITH TIME ZONE;

-- Aggiungi campi a preventivi
ALTER TABLE public.preventivi
ADD COLUMN IF NOT EXISTS archiviato BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_archiviazione TIMESTAMP WITH TIME ZONE;

-- Aggiungi campi a fatture
ALTER TABLE public.fatture
ADD COLUMN IF NOT EXISTS archiviato BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS data_archiviazione TIMESTAMP WITH TIME ZONE;

-- Crea indici per migliorare le performance delle query sull'archivio
CREATE INDEX IF NOT EXISTS idx_ordini_lavoro_archiviato ON public.ordini_lavoro(archiviato);
CREATE INDEX IF NOT EXISTS idx_preventivi_archiviato ON public.preventivi(archiviato);
CREATE INDEX IF NOT EXISTS idx_fatture_archiviato ON public.fatture(archiviato);

-- Commenti per documentazione
COMMENT ON COLUMN public.ordini_lavoro.archiviato IS 'Indica se l''ordine è stato archiviato';
COMMENT ON COLUMN public.ordini_lavoro.data_archiviazione IS 'Data e ora di archiviazione dell''ordine';
COMMENT ON COLUMN public.preventivi.archiviato IS 'Indica se il preventivo è stato archiviato';
COMMENT ON COLUMN public.preventivi.data_archiviazione IS 'Data e ora di archiviazione del preventivo';
COMMENT ON COLUMN public.fatture.archiviato IS 'Indica se la fattura è stata archiviata';
COMMENT ON COLUMN public.fatture.data_archiviazione IS 'Data e ora di archiviazione della fattura';

