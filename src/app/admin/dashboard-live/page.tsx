'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Users, Clock, DollarSign, Wrench, Car, RefreshCw, Activity } from 'lucide-react';

interface Dipendente {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  costoOrario: number;
  stato: 'lavorando' | 'disponibile';
  sessioneAttiva: {
    id: string;
    ordineLavoroId: string;
    numeroOrdine: string;
    descrizione: string;
    veicolo: string | null;
    startTime: string;
    durationMinutes: number;
    durationHours: number;
    costoAttuale: number;
  } | null;
}

interface Statistiche {
  totaleDipendenti: number;
  dipendentiLavorando: number;
  dipendentiDisponibili: number;
  totaleOreInCorso: number;
  totaleCostoInCorso: number;
}

interface OrdineInCorso {
  id: string;
  numeroOrdine: string;
  descrizione: string;
  stato: string;
  veicolo: {
    marca: string;
    modello: string;
    targa: string;
  } | null;
  cliente: {
    nome: string;
    cognome: string;
  } | null;
  dipendentiAttivi: Array<{
    id: string;
    nome: string;
    cognome: string;
  }>;
}

export default function DashboardLivePage() {
  const [dipendenti, setDipendenti] = useState<Dipendente[]>([]);
  const [statistiche, setStatistiche] = useState<Statistiche | null>(null);
  const [ordiniInCorso, setOrdiniInCorso] = useState<OrdineInCorso[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard/live');
      const data = await res.json();
      
      setDipendenti(data.dipendenti || []);
      setStatistiche(data.statistiche || null);
      setOrdiniInCorso(data.ordiniInCorso || []);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Errore caricamento dashboard:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Auto-refresh ogni 10 secondi
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboard();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatoBadge = (stato: string) => {
    const colors: Record<string, string> = {
      lavorando: 'bg-green-100 text-green-800 border-green-300',
      disponibile: 'bg-gray-100 text-gray-800 border-gray-300'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[stato] || colors.disponibile}`}>
        {stato === 'lavorando' ? '🔧 Lavorando' : '✓ Disponibile'}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Live">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard Live">
      <div className="space-y-6">
        {/* Header con controlli */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Monitoraggio in tempo reale</h2>
            <p className="text-sm text-gray-500 mt-1">
              Ultimo aggiornamento: {lastUpdate.toLocaleTimeString('it-IT')}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                autoRefresh
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Activity className="w-4 h-4" />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            <button
              onClick={fetchDashboard}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Aggiorna
            </button>
          </div>
        </div>

        {/* Statistiche */}
        {statistiche && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Totale Dipendenti</p>
                  <p className="text-3xl font-bold text-gray-900">{statistiche.totaleDipendenti}</p>
                </div>
                <Users className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lavorando</p>
                  <p className="text-3xl font-bold text-green-600">{statistiche.dipendentiLavorando}</p>
                </div>
                <Wrench className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Disponibili</p>
                  <p className="text-3xl font-bold text-gray-600">{statistiche.dipendentiDisponibili}</p>
                </div>
                <Users className="w-10 h-10 text-gray-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ore in Corso</p>
                  <p className="text-3xl font-bold text-purple-600">{statistiche.totaleOreInCorso.toFixed(1)}h</p>
                </div>
                <Clock className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Costo in Corso</p>
                  <p className="text-3xl font-bold text-yellow-600">€{statistiche.totaleCostoInCorso.toFixed(2)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-yellow-500" />
              </div>
            </div>
          </div>
        )}

        {/* Lista Dipendenti */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Stato Dipendenti</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dipendente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ordine/Veicolo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durata
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo Attuale
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dipendenti.map((dip) => (
                  <tr key={dip.id} className={dip.stato === 'lavorando' ? 'bg-green-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {dip.nome[0]}{dip.cognome[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {dip.nome} {dip.cognome}
                          </div>
                          <div className="text-sm text-gray-500">{dip.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatoBadge(dip.stato)}
                    </td>
                    <td className="px-6 py-4">
                      {dip.sessioneAttiva ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {dip.sessioneAttiva.numeroOrdine}
                          </div>
                          <div className="text-sm text-gray-500">{dip.sessioneAttiva.descrizione}</div>
                          {dip.sessioneAttiva.veicolo && (
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <Car className="w-3 h-3" />
                              {dip.sessioneAttiva.veicolo}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {dip.sessioneAttiva ? (
                        <div className="text-sm text-gray-900">
                          {formatDuration(dip.sessioneAttiva.durationMinutes)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {dip.sessioneAttiva ? (
                        <div className="text-sm font-semibold text-green-600">
                          €{dip.sessioneAttiva.costoAttuale.toFixed(2)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

