'use client';

import { useState, useEffect } from 'react';
import { Clock, User, Wrench, Car, DollarSign, RefreshCw } from 'lucide-react';

interface TimerAttivo {
  id: string;
  startTime: string;
  user: {
    id: string;
    nome: string;
    cognome: string;
    costoOrario: number;
  };
  ordine: {
    id: string;
    numeroOrdine: string;
    descrizione: string;
    stato: string;
    clienti: {
      nome: string;
      cognome: string;
    } | null;
    veicoli: {
      marca: string;
      modello: string;
      targa: string;
    } | null;
  };
  riepilogo: {
    durationMinutes: number;
    durationHours: number;
    costoOrario: number;
    costoAttuale: number;
  };
}

export function TimerAttivi() {
  const [timers, setTimers] = useState<TimerAttivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchTimers = async () => {
    try {
      const res = await fetch('/api/timer/attivi');
      if (!res.ok) throw new Error('Errore caricamento timer');
      const data = await res.json();
      setTimers(data);
    } catch (error) {
      console.error('Errore caricamento timer:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimers();
  }, []);

  // Auto-refresh ogni 5 secondi
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTimers();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-500">Caricamento timer...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Timer Attivi in Tempo Reale
            </h2>
            <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
              {timers.length} {timers.length === 1 ? 'attivo' : 'attivi'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                autoRefresh
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            <button
              onClick={fetchTimers}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Aggiorna manualmente"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Lista Timer */}
      <div className="divide-y divide-gray-200">
        {timers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nessun timer attivo al momento</p>
          </div>
        ) : (
          timers.map((timer) => (
            <div key={timer.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                {/* Info Dipendente e Lavoro */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Dipendente */}
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="ml-2 font-semibold text-gray-900">
                        {timer.user.nome} {timer.user.cognome}
                      </span>
                    </div>

                    {/* Separatore */}
                    <span className="text-gray-300">•</span>

                    {/* Ordine */}
                    <div className="flex items-center">
                      <Wrench className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm font-medium text-gray-700">
                        {timer.ordine.numeroOrdine}
                      </span>
                    </div>
                  </div>

                  {/* Descrizione Lavoro */}
                  <p className="text-sm text-gray-600 mb-2">
                    {timer.ordine.descrizione}
                  </p>

                  {/* Cliente e Veicolo */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {timer.ordine.clienti && (
                      <span>
                        👤 {timer.ordine.clienti.nome} {timer.ordine.clienti.cognome}
                      </span>
                    )}
                    {timer.ordine.veicoli && (
                      <span className="flex items-center">
                        <Car className="w-3 h-3 mr-1" />
                        {timer.ordine.veicoli.marca} {timer.ordine.veicoli.modello} • {timer.ordine.veicoli.targa}
                      </span>
                    )}
                  </div>
                </div>

                {/* Statistiche Timer */}
                <div className="ml-6 flex flex-col items-end gap-2">
                  {/* Durata */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                    <Clock className="w-4 h-4 text-green-600 animate-pulse" />
                    <span className="text-lg font-mono font-bold text-green-700">
                      {formatDuration(timer.riepilogo.durationMinutes)}
                    </span>
                  </div>

                  {/* Costo Attuale */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700">
                      €{timer.riepilogo.costoAttuale.toFixed(2)}
                    </span>
                  </div>

                  {/* Ora Inizio */}
                  <span className="text-xs text-gray-500">
                    Iniziato alle {formatTime(timer.startTime)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer con Totali */}
      {timers.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Totale Costo in Corso
            </span>
            <span className="text-lg font-bold text-blue-600">
              €{timers.reduce((sum, t) => sum + t.riepilogo.costoAttuale, 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

