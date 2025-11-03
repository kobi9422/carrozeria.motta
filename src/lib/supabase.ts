import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Verifica che le variabili siano definite
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERRORE: Variabili Supabase non definite!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'DEFINITA' : 'NON DEFINITA');
  throw new Error('Configurazione Supabase mancante. Verifica le variabili d\'ambiente.');
}

// Client per il browser
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Client per il server (API routes) - usa anon key per Row Level Security
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Funzione per creare client Supabase per Server Components
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Database types - Schema completo per Carrozzeria Motta
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password: string;
          nome: string;
          cognome: string;
          telefono?: string;
          ruolo: Database['public']['Enums']['user_role'];
          attivo: boolean;
          costo_orario: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password: string;
          nome: string;
          cognome: string;
          telefono?: string;
          ruolo?: Database['public']['Enums']['user_role'];
          attivo?: boolean;
          costo_orario?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password?: string;
          nome?: string;
          cognome?: string;
          telefono?: string;
          ruolo?: Database['public']['Enums']['user_role'];
          attivo?: boolean;
          costo_orario?: number;
          updated_at?: string;
        };
      };
      clienti: {
        Row: {
          id: string;
          nome: string;
          cognome: string;
          telefono: string | null;
          email: string | null;
          indirizzo: string | null;
          citta: string | null;
          cap: string | null;
          provincia: string | null;
          codice_fiscale: string | null;
          partita_iva: string | null;
          tipo_cliente: string;
          sdi: string | null;
          codice_univoco: string | null;
          foto_url: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cognome: string;
          telefono?: string | null;
          email?: string | null;
          indirizzo?: string | null;
          citta?: string | null;
          cap?: string | null;
          provincia?: string | null;
          codice_fiscale?: string | null;
          partita_iva?: string | null;
          tipo_cliente?: string;
          sdi?: string | null;
          codice_univoco?: string | null;
          foto_url?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          cognome?: string;
          telefono?: string | null;
          email?: string | null;
          indirizzo?: string | null;
          citta?: string | null;
          cap?: string | null;
          provincia?: string | null;
          codice_fiscale?: string | null;
          partita_iva?: string | null;
          tipo_cliente?: string;
          sdi?: string | null;
          codice_univoco?: string | null;
          foto_url?: string | null;
          note?: string | null;
          updated_at?: string;
        };
      };
      veicoli: {
        Row: {
          id: string;
          cliente_id: string;
          marca: string;
          modello: string;
          anno: number | null;
          targa: string;
          colore: string | null;
          numero_telaio: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          marca: string;
          modello: string;
          anno?: number | null;
          targa: string;
          colore?: string | null;
          numero_telaio?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cliente_id?: string;
          marca?: string;
          modello?: string;
          anno?: number | null;
          targa?: string;
          colore?: string | null;
          numero_telaio?: string | null;
          note?: string | null;
          updated_at?: string;
        };
      };
      ordini_lavoro: {
        Row: {
          id: string;
          numero_ordine: string;
          cliente_id: string;
          veicolo_id: string;
          dipendente_id: string | null;
          titolo: string;
          descrizione: string;
          stato: Database['public']['Enums']['stato_ordine'];
          data_inizio: string;
          data_fine_prevista: string | null;
          data_fine_effettiva: string | null;
          costo_stimato: number | null;
          costo_finale: number | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          numero_ordine: string;
          cliente_id: string;
          veicolo_id: string;
          dipendente_id?: string | null;
          titolo: string;
          descrizione: string;
          stato?: Database['public']['Enums']['stato_ordine'];
          data_inizio: string;
          data_fine_prevista?: string | null;
          data_fine_effettiva?: string | null;
          costo_stimato?: number | null;
          costo_finale?: number | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          numero_ordine?: string;
          cliente_id?: string;
          veicolo_id?: string;
          dipendente_id?: string | null;
          titolo?: string;
          descrizione?: string;
          stato?: Database['public']['Enums']['stato_ordine'];
          data_inizio?: string;
          data_fine_prevista?: string | null;
          data_fine_effettiva?: string | null;
          costo_stimato?: number | null;
          costo_finale?: number | null;
          note?: string | null;
          updated_at?: string;
        };
      };
      preventivi: {
        Row: {
          id: string;
          numero_preventivo: string;
          cliente_id: string;
          veicolo_id: string | null;
          ordine_lavoro_id: string | null;
          titolo: string;
          descrizione: string;
          stato: Database['public']['Enums']['stato_preventivo'];
          importo_totale: number;
          data_scadenza: string;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          numero_preventivo: string;
          cliente_id: string;
          veicolo_id?: string | null;
          ordine_lavoro_id?: string | null;
          titolo: string;
          descrizione: string;
          stato?: Database['public']['Enums']['stato_preventivo'];
          importo_totale?: number;
          data_scadenza: string;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          numero_preventivo?: string;
          cliente_id?: string;
          veicolo_id?: string | null;
          ordine_lavoro_id?: string | null;
          titolo?: string;
          descrizione?: string;
          stato?: Database['public']['Enums']['stato_preventivo'];
          importo_totale?: number;
          data_scadenza?: string;
          note?: string | null;
          updated_at?: string;
        };
      };
      voci_preventivo: {
        Row: {
          id: string;
          preventivo_id: string;
          descrizione: string;
          quantita: number;
          prezzo_unitario: number;
          importo_totale: number;
          iva: number;
          importo_iva: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          preventivo_id: string;
          descrizione: string;
          quantita?: number;
          prezzo_unitario: number;
          iva?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          preventivo_id?: string;
          descrizione?: string;
          quantita?: number;
          prezzo_unitario?: number;
          iva?: number;
        };
      };
      fatture: {
        Row: {
          id: string;
          numero_fattura: string;
          cliente_id: string;
          ordine_lavoro_id: string | null;
          preventivo_id: string | null;
          stato: Database['public']['Enums']['stato_fattura'];
          importo_totale: number;
          data_emissione: string;
          data_scadenza: string;
          data_pagamento: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          numero_fattura: string;
          cliente_id: string;
          ordine_lavoro_id?: string | null;
          preventivo_id?: string | null;
          stato?: Database['public']['Enums']['stato_fattura'];
          importo_totale?: number;
          data_emissione: string;
          data_scadenza: string;
          data_pagamento?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          numero_fattura?: string;
          cliente_id?: string;
          ordine_lavoro_id?: string | null;
          preventivo_id?: string | null;
          stato?: Database['public']['Enums']['stato_fattura'];
          importo_totale?: number;
          data_emissione?: string;
          data_scadenza?: string;
          data_pagamento?: string | null;
          note?: string | null;
          updated_at?: string;
        };
      };
      voci_fattura: {
        Row: {
          id: string;
          fattura_id: string;
          descrizione: string;
          quantita: number;
          prezzo_unitario: number;
          importo_totale: number;
          iva: number;
          importo_iva: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          fattura_id: string;
          descrizione: string;
          quantita?: number;
          prezzo_unitario: number;
          iva?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          fattura_id?: string;
          descrizione?: string;
          quantita?: number;
          prezzo_unitario?: number;
          iva?: number;
        };
      };
      impostazioni: {
        Row: {
          id: string;
          nome_azienda: string;
          indirizzo: string | null;
          citta: string | null;
          cap: string | null;
          provincia: string | null;
          telefono: string | null;
          email: string | null;
          partita_iva: string | null;
          codice_fiscale: string | null;
          iban: string | null;
          banca: string | null;
          condizioni_pagamento: string | null;
          note_legali_fattura: string | null;
          validita_preventivi: number;
          note_standard_preventivo: string | null;
          firma_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome_azienda?: string;
          indirizzo?: string | null;
          citta?: string | null;
          cap?: string | null;
          provincia?: string | null;
          telefono?: string | null;
          email?: string | null;
          partita_iva?: string | null;
          codice_fiscale?: string | null;
          iban?: string | null;
          banca?: string | null;
          condizioni_pagamento?: string | null;
          note_legali_fattura?: string | null;
          validita_preventivi?: number;
          note_standard_preventivo?: string | null;
          firma_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome_azienda?: string;
          indirizzo?: string | null;
          citta?: string | null;
          cap?: string | null;
          provincia?: string | null;
          telefono?: string | null;
          email?: string | null;
          partita_iva?: string | null;
          codice_fiscale?: string | null;
          iban?: string | null;
          banca?: string | null;
          condizioni_pagamento?: string | null;
          note_legali_fattura?: string | null;
          validita_preventivi?: number;
          note_standard_preventivo?: string | null;
          firma_url?: string | null;
          updated_at?: string;
        };
      };
      ordini_lavoro_sessioni: {
        Row: {
          id: string;
          ordine_lavoro_id: string;
          user_id: string;
          start_time: string;
          end_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ordine_lavoro_id: string;
          user_id: string;
          start_time: string;
          end_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ordine_lavoro_id?: string;
          user_id?: string;
          start_time?: string;
          end_time?: string | null;
          updated_at?: string;
        };
      };
      eventi: {
        Row: {
          id: string;
          titolo: string;
          descrizione: string | null;
          tipo: string;
          data_inizio: string;
          data_fine: string | null;
          ora_inizio: string | null;
          ora_fine: string | null;
          tutto_il_giorno: boolean;
          cliente_id: string | null;
          veicolo_id: string | null;
          ordine_lavoro_id: string | null;
          note: string | null;
          colore: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          titolo: string;
          descrizione?: string | null;
          tipo: string;
          data_inizio: string;
          data_fine?: string | null;
          ora_inizio?: string | null;
          ora_fine?: string | null;
          tutto_il_giorno?: boolean;
          cliente_id?: string | null;
          veicolo_id?: string | null;
          ordine_lavoro_id?: string | null;
          note?: string | null;
          colore?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          titolo?: string;
          descrizione?: string | null;
          tipo?: string;
          data_inizio?: string;
          data_fine?: string | null;
          ora_inizio?: string | null;
          ora_fine?: string | null;
          tutto_il_giorno?: boolean;
          cliente_id?: string | null;
          veicolo_id?: string | null;
          ordine_lavoro_id?: string | null;
          note?: string | null;
          colore?: string;
          created_by?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_numero_ordine: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      generate_numero_preventivo: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      generate_numero_fattura: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: 'admin' | 'employee';
      stato_ordine: 'in_attesa' | 'in_lavorazione' | 'completato' | 'consegnato' | 'annullato';
      stato_preventivo: 'bozza' | 'inviato' | 'accettato' | 'rifiutato' | 'scaduto';
      stato_fattura: 'bozza' | 'emessa' | 'pagata' | 'scaduta' | 'annullata';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
