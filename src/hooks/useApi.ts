'use client';

import { useState, useCallback } from 'react';

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

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (url: string, options?: RequestInit) => Promise<T | null>;
  get: (url: string, params?: Record<string, string>) => Promise<T | null>;
  post: (url: string, body?: any) => Promise<T | null>;
  put: (url: string, body?: any) => Promise<T | null>;
  delete: (url: string) => Promise<T | null>;
}

export function useApi<T = any>(): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (url: string, options: RequestInit = {}): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const result: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      setData(result.data || result as T);
      return result.data || result as T;

    } catch (err: any) {
      const errorMessage = err.message || 'Errore durante la richiesta API';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback(async (url: string, params?: Record<string, string>): Promise<T | null> => {
    let fullUrl = url;
    if (params) {
      const searchParams = new URLSearchParams(params);
      fullUrl += `?${searchParams.toString()}`;
    }
    return execute(fullUrl, { method: 'GET' });
  }, [execute]);

  const post = useCallback(async (url: string, body?: any): Promise<T | null> => {
    return execute(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }, [execute]);

  const put = useCallback(async (url: string, body?: any): Promise<T | null> => {
    return execute(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }, [execute]);

  const deleteMethod = useCallback(async (url: string): Promise<T | null> => {
    return execute(url, { method: 'DELETE' });
  }, [execute]);

  return {
    data,
    loading,
    error,
    execute,
    get,
    post,
    put,
    delete: deleteMethod,
  };
}

// Hook specifici per le entità
export function useClienti() {
  return useApi<any>();
}

export function useVeicoli() {
  return useApi<any>();
}

export function useOrdiniLavoro() {
  return useApi<any>();
}

export function useDashboardStats() {
  return useApi<any>();
}
