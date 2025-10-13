'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Clock, AlertCircle, CheckCircle, Play, Pause, Check, FileText, Phone, Calendar } from 'lucide-react';

interface OrdineLavoro {
  id: string;
  numeroOrdine: string;
  cliente: {
    nome: string;
    cognome: string;
    telefono?: string;
  };
  veicolo: {
    marca: string;
    modello: string;
    targa: string;
  };
  descrizione: string;
  stato: 'in_attesa' | 'in_corso' | 'completato';
  priorita: 'bassa' | 'media' | 'alta';
  dataInizio: string;
  dataScadenza: string | null;
  tempoLavorato?: number;
  timerAttivo?: boolean;
  timerInizio?: number;
}

export default function EmployeeDashboard() {
  const [ordini, setOrdini] = useState<OrdineLavoro[]>([]);
  const [loading, setLoading] = useState(true);

  // Carica TUTTI gli ordini (i dipendenti vedono tutti i lavori da eseguire)
  useEffect(() => {
    fetchOrdini();
  }, []);

  const fetchOrdini = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ordini');
      if (!res.ok) {
        throw new Error('Errore nel caricamento degli ordini');
      }
      const data = await res.json();

      // Mostra TUTTI gli ordini (nessun filtro per dipendente)
      setOrdini(data.map((ordine: any) => ({
        id: ordine.id,
        numeroOrdine: ordine.numeroOrdine,
        cliente: ordine.cliente,
        veicolo: ordine.veicolo,
        descrizione: ordine.descrizione,
        stato: ordine.stato,
        priorita: ordine.priorita,
        dataInizio: ordine.dataInizio,
        dataScadenza: ordine.dataFine,
        tempoLavorato: ordine.tempoLavorato || 0,
        timerAttivo: false
      })));
    } catch (error: any) {
      console.error('Errore caricamento ordini:', error);
    } finally {
      setLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setOrdini(prevOrdini =>
        prevOrdini.map(ordine => {
          if (ordine.timerAttivo && ordine.timerInizio) {
            const tempoTrascorso = Math.floor((Date.now() - ordine.timerInizio) / 1000);
            return {
              ...ordine,
              tempoLavorato: (ordine.tempoLavorato || 0) + tempoTrascorso,
              timerInizio: Date.now()
            };
          }
          return ordine;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number = 0) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const avviaTimer = (ordineId: string) => {
    setOrdini(prevOrdini =>
      prevOrdini.map(ordine =>
        ordine.id === ordineId
          ? { ...ordine, timerAttivo: true, timerInizio: Date.now(), stato: 'in_corso' as const }
          : ordine
      )
    );
  };

  const pausaTimer = (ordineId: string) => {
    setOrdini(prevOrdini =>
      prevOrdini.map(ordine => {
        if (ordine.id === ordineId && ordine.timerAttivo && ordine.timerInizio) {
          const tempoTrascorso = Math.floor((Date.now() - ordine.timerInizio) / 1000);
          return {
            ...ordine,
            timerAttivo: false,
            tempoLavorato: (ordine.tempoLavorato || 0) + tempoTrascorso,
            timerInizio: undefined
          };
        }
        return ordine;
      })
    );
  };

  const completaOrdine = (ordineId: string) => {
    setOrdini(prevOrdini =>
      prevOrdini.map(ordine =>
        ordine.id === ordineId
          ? { ...ordine, stato: 'completato' as const, timerAttivo: false, timerInizio: undefined }
          : ordine
      )
    );
  };

  // Calcola statistiche
  const ordiniAttivi = ordini.filter(o => o.stato !== 'completato');
  const ordiniUrgenti = ordiniAttivi.filter(o => o.priorita === 'alta');
  const ordiniCompletatiOggi = ordini.filter(o => o.stato === 'completato').length;
  const tempoTotaleOggi = ordini.reduce((acc, o) => acc + (o.tempoLavorato || 0), 0);
  const ordineConTimerAttivo = ordini.find(o => o.timerAttivo);

  // Ordina ordini: urgenti prima, poi per scadenza
  const ordiniOrdinati = [...ordiniAttivi].sort((a, b) => {
    if (a.priorita === 'alta' && b.priorita !== 'alta') return -1;
    if (a.priorita !== 'alta' && b.priorita === 'alta') return 1;
    if (a.dataScadenza && b.dataScadenza) {
      return new Date(a.dataScadenza).getTime() - new Date(b.dataScadenza).getTime();
    }
    return 0;
  });

  return (
    <ProtectedRoute requiredRole="employee">
      <DashboardLayout title="Dashboard Dipendente">
        <div className="space-y-6">
          {/* Card Statistiche Migliorate */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Timer Attivo */}
            <div className={`bg-white overflow-hidden shadow rounded-lg ${ordineConTimerAttivo ? 'ring-2 ring-green-500' : ''}`}>
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${ordineConTimerAttivo ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}>
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {ordineConTimerAttivo ? 'Timer Attivo' : 'Nessun Timer'}
                      </dt>
                      <dd className={`text-2xl font-mono font-bold ${ordineConTimerAttivo ? 'text-green-600' : 'text-gray-900'}`}>
                        {ordineConTimerAttivo ? formatTime(ordineConTimerAttivo.tempoLavorato) : '00:00:00'}
                      </dd>
                      {ordineConTimerAttivo && (
                        <dd className="text-xs text-gray-500 mt-1">
                          #{ordineConTimerAttivo.numeroOrdine}
                        </dd>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Tempo Totale Oggi */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Tempo Oggi
                      </dt>
                      <dd className="text-2xl font-mono font-bold text-gray-900">
                        {formatTime(tempoTotaleOggi)}
                      </dd>
                      <dd className="text-xs text-gray-500 mt-1">
                        {ordiniCompletatiOggi} completati
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Ordini Urgenti */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${ordiniUrgenti.length > 0 ? 'bg-red-500' : 'bg-gray-400'}`}>
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Ordini Urgenti
                      </dt>
                      <dd className={`text-2xl font-bold ${ordiniUrgenti.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {ordiniUrgenti.length}
                      </dd>
                      <dd className="text-xs text-gray-500 mt-1">
                        Priorità alta
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Completati Oggi */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completati Oggi
                      </dt>
                      <dd className="text-2xl font-bold text-green-600">
                        {ordiniCompletatiOggi}
                      </dd>
                      <dd className="text-xs text-gray-500 mt-1">
                        Ottimo lavoro!
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ordini Urgenti */}
          {ordiniUrgenti.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg leading-6 font-medium text-red-900">
                    🔥 Ordini Urgenti ({ordiniUrgenti.length})
                  </h3>
                </div>

                <div className="space-y-3">
                  {ordiniUrgenti.map((ordine) => (
                    <div key={ordine.id} className="bg-white border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              🔴 ALTA PRIORITÀ
                            </span>
                            <h4 className="text-sm font-bold text-gray-900">
                              #{ordine.numeroOrdine}
                            </h4>
                            {ordine.timerAttivo && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 animate-pulse">
                                ⏱️ In corso
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-700 font-medium mb-1">
                            {ordine.descrizione}
                          </p>

                          <p className="text-xs text-gray-600">
                            {ordine.cliente.nome} {ordine.cliente.cognome} • {ordine.veicolo.marca} {ordine.veicolo.modello} • {ordine.veicolo.targa}
                          </p>

                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500">
                              ⏱️ {formatTime(ordine.tempoLavorato)}
                            </span>
                            {ordine.dataScadenza && (
                              <span className="text-xs text-red-600 font-semibold">
                                📅 Scadenza: {new Date(ordine.dataScadenza).toLocaleDateString('it-IT')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-col gap-2">
                          {ordine.stato !== 'completato' && (
                            <>
                              {!ordine.timerAttivo ? (
                                <button
                                  onClick={() => avviaTimer(ordine.id)}
                                  className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium transition-colors"
                                >
                                  <Play className="w-4 h-4" />
                                  Inizia
                                </button>
                              ) : (
                                <button
                                  onClick={() => pausaTimer(ordine.id)}
                                  className="flex items-center gap-1 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-xs font-medium transition-colors"
                                >
                                  <Pause className="w-4 h-4" />
                                  Pausa
                                </button>
                              )}
                              <button
                                onClick={() => completaOrdine(ordine.id)}
                                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-colors"
                              >
                                <Check className="w-4 h-4" />
                                Completa
                              </button>
                            </>
                          )}
                          {ordine.cliente.telefono && (
                            <a
                              href={`tel:${ordine.cliente.telefono}`}
                              className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs font-medium transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                              Chiama
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Altri Ordini */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                📋 Altri Ordini ({ordiniOrdinati.filter(o => o.priorita !== 'alta').length})
              </h3>

              <div className="space-y-3">
                {ordiniOrdinati.filter(o => o.priorita !== 'alta').map((ordine) => (
                  <div key={ordine.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            ordine.stato === 'in_corso' ? 'bg-blue-100 text-blue-800' :
                            ordine.stato === 'in_attesa' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ordine.stato === 'in_corso' ? 'In Corso' :
                             ordine.stato === 'in_attesa' ? 'In Attesa' :
                             'Completato'}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900">
                            #{ordine.numeroOrdine}
                          </h4>
                          {ordine.timerAttivo && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 animate-pulse">
                              ⏱️ Timer attivo
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-700 mb-1">
                          {ordine.descrizione}
                        </p>

                        <p className="text-xs text-gray-600">
                          {ordine.cliente.nome} {ordine.cliente.cognome} • {ordine.veicolo.marca} {ordine.veicolo.modello} • {ordine.veicolo.targa}
                        </p>

                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-500">
                            ⏱️ {formatTime(ordine.tempoLavorato)}
                          </span>
                          {ordine.dataScadenza && (
                            <span className="text-xs text-gray-500">
                              📅 {new Date(ordine.dataScadenza).toLocaleDateString('it-IT')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-col gap-2">
                        {ordine.stato !== 'completato' && (
                          <>
                            {!ordine.timerAttivo ? (
                              <button
                                onClick={() => avviaTimer(ordine.id)}
                                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium transition-colors"
                              >
                                <Play className="w-4 h-4" />
                                Inizia
                              </button>
                            ) : (
                              <button
                                onClick={() => pausaTimer(ordine.id)}
                                className="flex items-center gap-1 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-xs font-medium transition-colors"
                              >
                                <Pause className="w-4 h-4" />
                                Pausa
                              </button>
                            )}
                            <button
                              onClick={() => completaOrdine(ordine.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              Completa
                            </button>
                          </>
                        )}
                        {ordine.cliente.telefono && (
                          <a
                            href={`tel:${ordine.cliente.telefono}`}
                            className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs font-medium transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            Chiama
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {ordiniOrdinati.filter(o => o.priorita !== 'alta').length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nessun altro ordine al momento.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
