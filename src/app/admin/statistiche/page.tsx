'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { BarChart3, TrendingUp, Users, Euro, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function StatistichePage() {
  return (
    <ProtectedRoute requireAdmin>
      <StatisticheContent />
    </ProtectedRoute>
  );
}

function StatisticheContent() {
  const [ordini, setOrdini] = useState<any[]>([]);
  const [clienti, setClienti] = useState<any[]>([]);
  const [fatture, setFatture] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordiniRes, clientiRes, fattureRes] = await Promise.all([
        fetch('/api/ordini'),
        fetch('/api/clienti'),
        fetch('/api/fatture')
      ]);

      const ordiniData = await ordiniRes.json();
      const clientiData = await clientiRes.json();
      const fattureData = await fattureRes.json();

      setOrdini(ordiniData);
      setClienti(clientiData);
      setFatture(fattureData);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcoli statistiche
  const totaleOrdini = ordini.length;
  const ordiniInCorso = ordini.filter(o => o.stato === 'in_corso').length;
  const ordiniCompletati = ordini.filter(o => o.stato === 'completato' || o.stato === 'consegnato').length;
  const ordiniInAttesa = ordini.filter(o => o.stato === 'in_attesa').length;

  const totaleClienti = clienti.length;
  
  const fattureTotali = fatture.reduce((sum, f) => sum + (f.importoTotale || 0), 0);
  const fatturePagate = fatture.filter(f => f.stato === 'pagata').length;
  const fattureInSospeso = fatture.filter(f => f.stato === 'emessa' || f.stato === 'bozza').length;

  const costoMedioOrdine = ordini.length > 0 
    ? ordini.reduce((sum, o) => sum + (o.costoStimato || 0), 0) / ordini.length 
    : 0;

  const tempoMedioLavoro = ordini.length > 0
    ? ordini.reduce((sum, o) => sum + (o.tempoLavorato || 0), 0) / ordini.length
    : 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Caricamento statistiche...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Statistiche e Report
          </h1>
          <p className="text-gray-600 mt-1">Analisi delle performance aziendali</p>
        </div>

        {/* Stats Principali */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Totale Ordini</p>
                <p className="text-4xl font-bold mt-2">{totaleOrdini}</p>
                <p className="text-blue-100 text-xs mt-2">
                  {ordiniCompletati} completati
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Fatturato Totale</p>
                <p className="text-4xl font-bold mt-2">€{fattureTotali.toFixed(0)}</p>
                <p className="text-green-100 text-xs mt-2">
                  {fatturePagate} fatture pagate
                </p>
              </div>
              <Euro className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Clienti Totali</p>
                <p className="text-4xl font-bold mt-2">{totaleClienti}</p>
                <p className="text-purple-100 text-xs mt-2">
                  Database clienti
                </p>
              </div>
              <Users className="w-12 h-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">In Lavorazione</p>
                <p className="text-4xl font-bold mt-2">{ordiniInCorso}</p>
                <p className="text-orange-100 text-xs mt-2">
                  {ordiniInAttesa} in attesa
                </p>
              </div>
              <Clock className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Statistiche Dettagliate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Ordini */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Performance Ordini
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Costo Medio Ordine</span>
                <span className="text-xl font-bold text-gray-900">€{costoMedioOrdine.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tempo Medio Lavoro</span>
                <span className="text-xl font-bold text-gray-900">{formatTime(tempoMedioLavoro)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tasso Completamento</span>
                <span className="text-xl font-bold text-green-600">
                  {totaleOrdini > 0 ? ((ordiniCompletati / totaleOrdini) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Distribuzione Stati */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Distribuzione Stati Ordini
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">In Attesa</span>
                  <span className="text-sm font-semibold text-gray-900">{ordiniInAttesa}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${totaleOrdini > 0 ? (ordiniInAttesa / totaleOrdini) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">In Corso</span>
                  <span className="text-sm font-semibold text-gray-900">{ordiniInCorso}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${totaleOrdini > 0 ? (ordiniInCorso / totaleOrdini) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Completati</span>
                  <span className="text-sm font-semibold text-gray-900">{ordiniCompletati}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${totaleOrdini > 0 ? (ordiniCompletati / totaleOrdini) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fatture */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Euro className="w-5 h-5 text-green-600" />
            Riepilogo Fatture
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 mb-1">Fatture Pagate</p>
              <p className="text-3xl font-bold text-green-700">{fatturePagate}</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-600 mb-1">In Sospeso</p>
              <p className="text-3xl font-bold text-yellow-700">{fattureInSospeso}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Totale Fatture</p>
              <p className="text-3xl font-bold text-blue-700">{fatture.length}</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 font-semibold">Statistiche in Tempo Reale</p>
              <p className="text-sm text-blue-700 mt-1">
                I dati vengono aggiornati automaticamente dal database. Ricarica la pagina per vedere le ultime modifiche.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

