# 🚨 ANALISI DATABASE - PROBLEMI TROVATI

## **TABELLE MANCANTI**

### 1. ❌ Tabella `impostazioni` - MANCANTE
**Usata in:** `src/app/api/impostazioni/route.ts`

**Colonne necessarie:**
- id (UUID)
- nome_azienda (TEXT)
- indirizzo (TEXT)
- citta (TEXT)
- cap (TEXT)
- provincia (TEXT)
- telefono (TEXT)
- email (TEXT)
- partita_iva (TEXT)
- codice_fiscale (TEXT)
- iban (TEXT)
- banca (TEXT)
- condizioni_pagamento (TEXT)
- note_legali_fattura (TEXT)
- validita_preventivi (INTEGER)
- note_standard_preventivo (TEXT)
- firma_url (TEXT) - Per la firma digitale
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

---

### 2. ❌ Tabella `ordini_lavoro_sessioni` - MANCANTE
**Usata in:** 
- `src/app/api/timer/attivi/route.ts`
- `src/app/api/ordini/[id]/timer/route.ts`

**Colonne necessarie:**
- id (UUID)
- ordine_lavoro_id (UUID) - FK a ordini_lavoro
- user_id (UUID) - FK a users
- start_time (TIMESTAMP)
- end_time (TIMESTAMP, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

---

### 3. ❌ Tabella `eventi` - PARZIALMENTE DEFINITA
**Usata in:**
- `src/app/api/eventi/route.ts`
- `src/app/api/eventi/[id]/route.ts`

**Stato:** Esiste in `database/migrations/create_eventi_table.sql` ma NON in `database/schema.sql`

**Colonne necessarie:**
- id (UUID)
- titolo (TEXT)
- descrizione (TEXT)
- tipo (TEXT) - 'ordine', 'appuntamento', 'scadenza', 'altro'
- data_inizio (TIMESTAMP)
- data_fine (TIMESTAMP, nullable)
- ora_inizio (TIME, nullable)
- ora_fine (TIME, nullable)
- tutto_il_giorno (BOOLEAN)
- cliente_id (UUID) - FK a clienti
- veicolo_id (UUID) - FK a veicoli
- ordine_lavoro_id (UUID) - FK a ordini_lavoro
- note (TEXT)
- colore (TEXT)
- created_by (UUID) - FK a users
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

---

## **COLONNE MANCANTI NELLA TABELLA `clienti`**

**Usate in:** `src/app/api/clienti/route.ts` (linea 76-82)

**Colonne mancanti:**
- ❌ provincia (TEXT)
- ❌ codice_fiscale (TEXT)
- ❌ partita_iva (TEXT)
- ❌ tipo_cliente (TEXT) - 'privato' o 'azienda'
- ❌ sdi (TEXT) - Sistema di Interscambio
- ❌ codice_univoco (TEXT)
- ❌ foto_url (TEXT)

---

## **COLONNE MANCANTI NELLA TABELLA `voci_preventivo`**

**Usate in:** PDF generation e preventivi

**Colonne mancanti:**
- ❌ iva (DECIMAL) - Percentuale IVA (0 o 22)
- ❌ importo_iva (DECIMAL) - Importo IVA calcolato

---

## **COLONNE MANCANTI NELLA TABELLA `voci_fattura`**

**Usate in:** PDF generation e fatture

**Colonne mancanti:**
- ❌ iva (DECIMAL) - Percentuale IVA (0 o 22)
- ❌ importo_iva (DECIMAL) - Importo IVA calcolato

---

## **COLONNE MANCANTI NELLA TABELLA `preventivi`**

**Colonne mancanti:**
- ❌ ordine_lavoro_id (UUID) - FK a ordini_lavoro (per collegare preventivi a ordini)

---

## **COLONNE MANCANTI NELLA TABELLA `impostazioni`**

**Colonne mancanti:**
- ❌ firma_url (TEXT) - Per la firma digitale nei PDF

---

## **RIEPILOGO PROBLEMI**

| Problema | Tipo | Gravità | Impatto |
|----------|------|---------|---------|
| Tabella `impostazioni` mancante | Tabella | 🔴 CRITICO | Impostazioni aziendali non salvate |
| Tabella `ordini_lavoro_sessioni` mancante | Tabella | 🔴 CRITICO | Timer non funziona |
| Tabella `eventi` non in schema.sql | Tabella | 🟠 ALTO | Calendario non funziona |
| Colonne mancanti in `clienti` | Colonne | 🟠 ALTO | Dati clienti incompleti |
| Colonne IVA in voci | Colonne | 🟠 ALTO | IVA non calcolata correttamente |
| Colonna firma_url in impostazioni | Colonna | 🟡 MEDIO | Firma non salvata |

---

## **AZIONI NECESSARIE**

1. ✅ Aggiungere tabella `impostazioni`
2. ✅ Aggiungere tabella `ordini_lavoro_sessioni`
3. ✅ Aggiungere tabella `eventi` a schema.sql
4. ✅ Aggiungere colonne mancanti a `clienti`
5. ✅ Aggiungere colonne IVA a `voci_preventivo` e `voci_fattura`
6. ✅ Aggiungere colonna `firma_url` a `impostazioni`
7. ✅ Aggiungere colonna `ordine_lavoro_id` a `preventivi`

