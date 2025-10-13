import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key';

// Client per il browser (con controllo per placeholder)
export const supabase = supabaseUrl.includes('placeholder')
  ? null
  : createBrowserClient(supabaseUrl, supabaseAnonKey);

// Client per il server (con service role key)
export const supabaseAdmin = supabaseUrl.includes('placeholder')
  ? null
  : createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_role_key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

// Funzione per creare client Supabase per Server Components
export function createServerClient() {
  if (supabaseUrl.includes('placeholder')) {
    return null;
  }
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
          nome: string;
          cognome: string;
          ruolo: Database['public']['Enums']['user_role'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nome: string;
          cognome: string;
          ruolo?: Database['public']['Enums']['user_role'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nome?: string;
          cognome?: string;
          ruolo?: Database['public']['Enums']['user_role'];
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
