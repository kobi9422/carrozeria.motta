-- Dati di esempio per Carrozzeria Motta
-- Questo file inserisce dati di test per sviluppo e demo

-- Inserimento clienti di esempio
INSERT INTO public.clienti (nome, cognome, telefono, email, indirizzo, citta, cap, note) VALUES
('Mario', 'Rossi', '+39 333 1234567', 'mario.rossi@email.com', 'Via Roma 123', 'Milano', '20100', 'Cliente abituale'),
('Giulia', 'Bianchi', '+39 347 9876543', 'giulia.bianchi@email.com', 'Corso Italia 45', 'Milano', '20121', 'Preferisce appuntamenti mattutini'),
('Luca', 'Verdi', '+39 320 5555555', 'luca.verdi@email.com', 'Piazza Duomo 7', 'Milano', '20122', NULL),
('Anna', 'Neri', '+39 338 7777777', 'anna.neri@email.com', 'Via Garibaldi 89', 'Monza', '20900', 'Auto aziendale'),
('Francesco', 'Gialli', '+39 349 1111111', 'francesco.gialli@email.com', 'Viale Europa 234', 'Bergamo', '24100', 'Cliente VIP');

-- Inserimento veicoli di esempio
INSERT INTO public.veicoli (cliente_id, marca, modello, anno, targa, colore, numero_telaio, note) VALUES
((SELECT id FROM public.clienti WHERE nome = 'Mario' AND cognome = 'Rossi'), 'Fiat', 'Panda', 2018, 'AB123CD', 'Bianco', 'ZFA31200000123456', 'Piccoli graffi sul paraurti'),
((SELECT id FROM public.clienti WHERE nome = 'Giulia' AND cognome = 'Bianchi'), 'Volkswagen', 'Golf', 2020, 'EF456GH', 'Grigio Metallizzato', 'WVWZZZ1KZAW123456', 'Perfette condizioni'),
((SELECT id FROM public.clienti WHERE nome = 'Luca' AND cognome = 'Verdi'), 'BMW', 'Serie 3', 2019, 'IJ789KL', 'Nero', 'WBA8E9G50KA123456', 'Ammaccatura portiera sinistra'),
((SELECT id FROM public.clienti WHERE nome = 'Anna' AND cognome = 'Neri'), 'Mercedes', 'Classe A', 2021, 'MN012OP', 'Blu Scuro', 'WDD1760321A123456', 'Auto aziendale - fatturazione separata'),
((SELECT id FROM public.clienti WHERE nome = 'Francesco' AND cognome = 'Gialli'), 'Audi', 'A4', 2022, 'QR345ST', 'Rosso', 'WAUZZZ8K0DA123456', 'Cliente premium');

-- Funzione per generare numero ordine progressivo
CREATE OR REPLACE FUNCTION generate_numero_ordine()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    anno TEXT;
BEGIN
    anno := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_ordine FROM 6) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.ordini_lavoro
    WHERE numero_ordine LIKE anno || '-%';
    
    RETURN anno || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Funzione per generare numero preventivo progressivo
CREATE OR REPLACE FUNCTION generate_numero_preventivo()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    anno TEXT;
BEGIN
    anno := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_preventivo FROM 6) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.preventivi
    WHERE numero_preventivo LIKE 'P' || anno || '-%';
    
    RETURN 'P' || anno || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Funzione per generare numero fattura progressivo
CREATE OR REPLACE FUNCTION generate_numero_fattura()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    anno TEXT;
BEGIN
    anno := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_fattura FROM 6) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.fatture
    WHERE numero_fattura LIKE 'F' || anno || '-%';
    
    RETURN 'F' || anno || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Inserimento ordini di lavoro di esempio
INSERT INTO public.ordini_lavoro (numero_ordine, cliente_id, veicolo_id, titolo, descrizione, stato, data_inizio, data_fine_prevista, costo_stimato, note) VALUES
(generate_numero_ordine(), 
 (SELECT id FROM public.clienti WHERE nome = 'Mario' AND cognome = 'Rossi'),
 (SELECT id FROM public.veicoli WHERE targa = 'AB123CD'),
 'Riparazione graffi paraurti',
 'Rimozione graffi superficiali dal paraurti anteriore e ritocco vernice',
 'in_lavorazione',
 CURRENT_DATE,
 CURRENT_DATE + INTERVAL '3 days',
 250.00,
 'Utilizzare vernice originale Fiat'),

(generate_numero_ordine(),
 (SELECT id FROM public.clienti WHERE nome = 'Luca' AND cognome = 'Verdi'),
 (SELECT id FROM public.veicoli WHERE targa = 'IJ789KL'),
 'Riparazione ammaccatura portiera',
 'Riparazione ammaccatura portiera sinistra posteriore con sostituzione pannello',
 'in_attesa',
 CURRENT_DATE + INTERVAL '1 week',
 CURRENT_DATE + INTERVAL '2 weeks',
 800.00,
 'Ordinare pannello originale BMW'),

(generate_numero_ordine(),
 (SELECT id FROM public.clienti WHERE nome = 'Anna' AND cognome = 'Neri'),
 (SELECT id FROM public.veicoli WHERE targa = 'MN012OP'),
 'Verniciatura completa',
 'Verniciatura completa della vettura dopo incidente stradale',
 'completato',
 CURRENT_DATE - INTERVAL '2 weeks',
 CURRENT_DATE - INTERVAL '1 week',
 1500.00,
 'Lavoro completato in anticipo');

-- Inserimento preventivi di esempio
INSERT INTO public.preventivi (numero_preventivo, cliente_id, veicolo_id, titolo, descrizione, stato, data_scadenza, note) VALUES
(generate_numero_preventivo(),
 (SELECT id FROM public.clienti WHERE nome = 'Giulia' AND cognome = 'Bianchi'),
 (SELECT id FROM public.veicoli WHERE targa = 'EF456GH'),
 'Sostituzione paraurti posteriore',
 'Sostituzione completa paraurti posteriore danneggiato',
 'inviato',
 CURRENT_DATE + INTERVAL '30 days',
 'Preventivo inviato via email'),

(generate_numero_preventivo(),
 (SELECT id FROM public.clienti WHERE nome = 'Francesco' AND cognome = 'Gialli'),
 (SELECT id FROM public.veicoli WHERE targa = 'QR345ST'),
 'Riparazione carrozzeria laterale',
 'Riparazione danni laterali dopo graffio in parcheggio',
 'bozza',
 CURRENT_DATE + INTERVAL '15 days',
 'In attesa di valutazione dettagliata');

-- Inserimento voci preventivo
INSERT INTO public.voci_preventivo (preventivo_id, descrizione, quantita, prezzo_unitario) VALUES
((SELECT id FROM public.preventivi WHERE numero_preventivo LIKE 'P%' ORDER BY created_at LIMIT 1),
 'Paraurti posteriore originale VW Golf', 1, 350.00),
((SELECT id FROM public.preventivi WHERE numero_preventivo LIKE 'P%' ORDER BY created_at LIMIT 1),
 'Manodopera sostituzione', 1, 150.00),
((SELECT id FROM public.preventivi WHERE numero_preventivo LIKE 'P%' ORDER BY created_at LIMIT 1),
 'Verniciatura paraurti', 1, 200.00);

-- Inserimento fatture di esempio
INSERT INTO public.fatture (numero_fattura, cliente_id, ordine_lavoro_id, stato, data_emissione, data_scadenza, importo_totale, note) VALUES
(generate_numero_fattura(),
 (SELECT id FROM public.clienti WHERE nome = 'Anna' AND cognome = 'Neri'),
 (SELECT id FROM public.ordini_lavoro WHERE stato = 'completato' LIMIT 1),
 'emessa',
 CURRENT_DATE - INTERVAL '1 week',
 CURRENT_DATE + INTERVAL '30 days',
 1500.00,
 'Fattura per verniciatura completa');

-- Inserimento voci fattura
INSERT INTO public.voci_fattura (fattura_id, descrizione, quantita, prezzo_unitario) VALUES
((SELECT id FROM public.fatture LIMIT 1), 'Verniciatura completa Mercedes Classe A', 1, 1200.00),
((SELECT id FROM public.fatture LIMIT 1), 'Materiali e vernici', 1, 200.00),
((SELECT id FROM public.fatture LIMIT 1), 'Lucidatura finale', 1, 100.00);
