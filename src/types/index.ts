// Tipi per l'autenticazione e ruoli utente
export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  ruolo: UserRole;
  created_at: string;
  updated_at: string;
}

// Tipi per i clienti
export interface Cliente {
  id: string;
  nome: string;
  cognome: string;
  telefono?: string;
  email?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

// Tipi per i veicoli
export interface Veicolo {
  id: string;
  cliente_id: string;
  marca: string;
  modello: string;
  anno?: number;
  targa: string;
  colore?: string;
  numero_telaio?: string;
  note?: string;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
}

// Tipi per gli ordini di lavoro
export type StatoOrdine = 'in_attesa' | 'in_lavorazione' | 'completato' | 'consegnato' | 'annullato';

export interface OrdineLavoro {
  id: string;
  numero_ordine: string;
  cliente_id: string;
  veicolo_id: string;
  dipendente_id?: string;
  titolo: string;
  descrizione: string;
  stato: StatoOrdine;
  data_inizio: string;
  data_fine_prevista?: string;
  data_fine_effettiva?: string;
  costo_stimato?: number;
  costo_finale?: number;
  note?: string;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
  veicolo?: Veicolo;
  dipendente?: User;
}

// Tipi per i preventivi
export type StatoPreventivo = 'bozza' | 'inviato' | 'accettato' | 'rifiutato' | 'scaduto';

export interface Preventivo {
  id: string;
  numero_preventivo: string;
  cliente_id: string;
  veicolo_id?: string;
  titolo: string;
  descrizione: string;
  stato: StatoPreventivo;
  importo_totale: number;
  data_scadenza: string;
  note?: string;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
  veicolo?: Veicolo;
  voci?: VocePreventivo[];
}

export interface VocePreventivo {
  id: string;
  preventivo_id: string;
  descrizione: string;
  quantita: number;
  prezzo_unitario: number;
  importo_totale: number;
}

// Tipi per le fatture
export type StatoFattura = 'bozza' | 'emessa' | 'pagata' | 'scaduta' | 'annullata';

export interface Fattura {
  id: string;
  numero_fattura: string;
  cliente_id: string;
  ordine_lavoro_id?: string;
  preventivo_id?: string;
  stato: StatoFattura;
  importo_totale: number;
  data_emissione: string;
  data_scadenza: string;
  data_pagamento?: string;
  note?: string;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
  ordine_lavoro?: OrdineLavoro;
  preventivo?: Preventivo;
  voci?: VoceFattura[];
}

export interface VoceFattura {
  id: string;
  fattura_id: string;
  descrizione: string;
  quantita: number;
  prezzo_unitario: number;
  importo_totale: number;
}

// Tipi per il calendario
export interface EventoCalendario {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: {
    tipo: 'ordine_lavoro' | 'appuntamento';
    id: string;
    cliente?: string;
    veicolo?: string;
  };
}

// Tipi per le statistiche dashboard
export interface StatisticheDashboard {
  ordini_attivi: number;
  ordini_completati_mese: number;
  fatturato_mese: number;
  clienti_totali: number;
  preventivi_in_attesa: number;
  fatture_scadute: number;
}
