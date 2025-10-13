// Servizio API centralizzato per Carrozzeria Motta

import { Cliente, Veicolo, OrdineLavoro, StatisticheDashboard } from '@/types';

const API_BASE_URL = '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const result: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new ApiError(result.error || `HTTP error! status: ${response.status}`, response.status);
  }

  return result.data || result as T;
}

// API per Clienti
export const clientiApi = {
  // Ottieni tutti i clienti con paginazione e ricerca
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Cliente>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<Cliente>>(`/clienti${query ? `?${query}` : ''}`);
  },

  // Ottieni un cliente specifico
  getById: async (id: string): Promise<Cliente> => {
    return apiRequest<Cliente>(`/clienti/${id}`);
  },

  // Crea un nuovo cliente
  create: async (cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>): Promise<Cliente> => {
    return apiRequest<Cliente>('/clienti', {
      method: 'POST',
      body: JSON.stringify(cliente),
    });
  },

  // Aggiorna un cliente
  update: async (id: string, cliente: Partial<Cliente>): Promise<Cliente> => {
    return apiRequest<Cliente>(`/clienti/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cliente),
    });
  },

  // Elimina un cliente
  delete: async (id: string): Promise<void> => {
    return apiRequest<void>(`/clienti/${id}`, {
      method: 'DELETE',
    });
  },
};

// API per Veicoli
export const veicoliApi = {
  // Ottieni tutti i veicoli
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    cliente_id?: string;
  }): Promise<PaginatedResponse<Veicolo>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.cliente_id) searchParams.set('cliente_id', params.cliente_id);

    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<Veicolo>>(`/veicoli${query ? `?${query}` : ''}`);
  },

  // Crea un nuovo veicolo
  create: async (veicolo: Omit<Veicolo, 'id' | 'created_at' | 'updated_at'>): Promise<Veicolo> => {
    return apiRequest<Veicolo>('/veicoli', {
      method: 'POST',
      body: JSON.stringify(veicolo),
    });
  },
};

// API per Ordini di Lavoro
export const ordiniLavoroApi = {
  // Ottieni tutti gli ordini di lavoro
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    stato?: string;
    dipendente_id?: string;
  }): Promise<PaginatedResponse<OrdineLavoro>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.stato) searchParams.set('stato', params.stato);
    if (params?.dipendente_id) searchParams.set('dipendente_id', params.dipendente_id);

    const query = searchParams.toString();
    return apiRequest<PaginatedResponse<OrdineLavoro>>(`/ordini-lavoro${query ? `?${query}` : ''}`);
  },

  // Crea un nuovo ordine di lavoro
  create: async (ordine: Omit<OrdineLavoro, 'id' | 'numero_ordine' | 'created_at' | 'updated_at'>): Promise<OrdineLavoro> => {
    return apiRequest<OrdineLavoro>('/ordini-lavoro', {
      method: 'POST',
      body: JSON.stringify(ordine),
    });
  },
};

// API per Dashboard
export const dashboardApi = {
  // Ottieni statistiche per la dashboard
  getStats: async (): Promise<StatisticheDashboard> => {
    return apiRequest<StatisticheDashboard>('/dashboard/stats');
  },
};

// Esporta tutto
export const api = {
  clienti: clientiApi,
  veicoli: veicoliApi,
  ordiniLavoro: ordiniLavoroApi,
  dashboard: dashboardApi,
};
