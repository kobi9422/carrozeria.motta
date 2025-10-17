-- Migration: Aggiungi campo preventivo_id a ordini_lavoro
-- Data: 2025-01-17
-- Descrizione: Permette di collegare un ordine di lavoro a un preventivo esistente

-- Aggiungi colonna preventivo_id alla tabella ordini_lavoro
ALTER TABLE public.ordini_lavoro 
ADD COLUMN IF NOT EXISTS preventivo_id UUID REFERENCES public.preventivi(id) ON DELETE SET NULL;

-- Crea indice per performance
CREATE INDEX IF NOT EXISTS idx_ordini_lavoro_preventivo_id ON public.ordini_lavoro(preventivo_id);

-- Commento
COMMENT ON COLUMN public.ordini_lavoro.preventivo_id IS 'Riferimento al preventivo da cui deriva l''ordine (opzionale)';

