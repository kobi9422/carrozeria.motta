'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Modal } from '@/components/Modal';
import { Toast } from '@/components/Toast';
import { Search, Eye, Clock, CheckCircle, AlertCircle, Play, Pause, StopCircle, Calendar, Euro, Phone, Car, Wrench, Users } from 'lucide-react';

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
  } | null;
  descrizione: string;
  stato: 'in_attesa' | 'in_corso' | 'completato' | 'consegnato';
  priorita: 'bassa' | 'media' | 'alta';
  dataInizio: string;
  dataFine: string | null;
  tempoLavorato?: number;
  timerAttivo?: boolean;
  timerInizio?: number;
}

const statoColors = {
  in_attesa: 'bg-yellow-100 text-yellow-800',
  in_corso: 'bg-blue-100 text-blue-800',
  completato: 'bg-green-100 text-green-800',
  consegnato: 'bg-gray-100 text-gray-800'
};

const statoLabels = {
  in_attesa: 'In Attesa',
  in_corso: 'In Corso',
  completato: 'Completato',
  consegnato: 'Consegnato'
};

const prioritaColors = {
  bassa: 'bg-gray-100 text-gray-800',
  media: 'bg-orange-100 text-orange-800',
  alta: 'bg-red-100 text-red-800'
};

export default function OrdiniDipendentePage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedOrdine, setSelectedOrdine] = useState<OrdineLavoro | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [ordini, setOrdini] = useState<OrdineLavoro[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStato, setFiltroStato] = useState('tutti');

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

      // Per ogni ordine, verifica se c'è un timer attivo
      const ordiniConTimer = await Promise.all(
        data.map(async (ordine: any) => {
          try {
            const timerRes = await fetch(`/api/ordini/${ordine.id}/timer`);
            const timerData = await timerRes.json();

            return {
              id: ordine.id,
              numeroOrdine: ordine.numeroOrdine,
              cliente: ordine.cliente,
              veicolo: ordine.veicolo,
              descrizione: ordine.descrizione,
              stato: ordine.stato,
              priorita: ordine.priorita,
              dataInizio: ordine.dataInizio,
              dataFine: ordine.dataFine,
              tempoLavorato: ordine.tempoLavorato || 0,
              timerAttivo: timerData.timerAttivo || false,
              timerInizio: timerData.timerAttivo ? new Date(timerData.sessione.startTime).getTime() : undefined
            };
          } catch {
            return {
              id: ordine.id,
              numeroOrdine: ordine.numeroOrdine,
              cliente: ordine.cliente,
              veicolo: ordine.veicolo,
              descrizione: ordine.descrizione,
              stato: ordine.stato,
              priorita: ordine.priorita,
              dataInizio: ordine.dataInizio,
              dataFine: ordine.dataFine,
              tempoLavorato: ordine.tempoLavorato || 0,
              timerAttivo: false
            };
          }
        })
      );

      setOrdini(ordiniConTimer);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Timer effect - aggiorna ogni secondo
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

  const avviaTimer = async (ordineId: string) => {
    try {
      const res = await fetch(`/api/ordini/${ordineId}/timer`, {
        method: 'POST'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Errore avvio timer');
      }

      const data = await res.json();

      setOrdini(prevOrdini =>
        prevOrdini.map(ordine =>
          ordine.id === ordineId
            ? { ...ordine, timerAttivo: true, timerInizio: Date.now(), stato: 'in_corso' as const }
            : ordine
        )
      );

      setToast({ message: 'Timer avviato!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const pausaTimer = async (ordineId: string) => {
    try {
      const res = await fetch(`/api/ordini/${ordineId}/timer`, {
        method: 'PATCH'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Errore stop timer');
      }

      const data = await res.json();

      setOrdini(prevOrdini =>
        prevOrdini.map(ordine =>
          ordine.id === ordineId
            ? { ...ordine, timerAttivo: false }
            : ordine
        )
      );

      setToast({
        message: `Timer fermato! ${data.riepilogo.durationHours}h - €${data.riepilogo.costoTotale.toFixed(2)}`,
        type: 'success'
      });
      setTimeout(() => setToast(null), 5000);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const completaOrdine = async (ordineId: string) => {
    try {
      // Prima ferma il timer se attivo
      const ordine = ordini.find(o => o.id === ordineId);
      if (ordine?.timerAttivo) {
        await pausaTimer(ordineId);
      }

      // Poi aggiorna lo stato dell'ordine
      const res = await fetch(`/api/ordini/${ordineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: 'completato' })
      });

      if (!res.ok) {
        throw new Error('Errore completamento ordine');
      }

      setOrdini(prevOrdini =>
        prevOrdini.map(o =>
          o.id === ordineId
            ? { ...o, stato: 'completato' as const, timerAttivo: false }
            : o
        )
      );

      setToast({ message: 'Ordine completato con successo!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const filteredOrdini = ordini.filter(ordine => {
    const matchSearch =
      ordine.numeroOrdine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${ordine.cliente.nome} ${ordine.cliente.cognome}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ordine.veicolo && ordine.veicolo.targa.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStato = filtroStato === 'tutti' || ordine.stato === filtroStato;

    return matchSearch && matchStato;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Caricamento ordini...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">I Miei Ordini</h1>
            <p className="text-gray-600 mt-1">Ordini di lavoro assegnati a te</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totale Ordini</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{ordini.length}</p>
              </div>
              <Wrench className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Attesa</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {ordini.filter(o => o.stato === 'in_attesa').length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Corso</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {ordini.filter(o => o.stato === 'in_corso').length}
                </p>
              </div>
              <Play className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completati</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {ordini.filter(o => o.stato === 'completato').length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filtri */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca per numero ordine, cliente o targa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filtroStato}
            onChange={(e) => setFiltroStato(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="tutti">📋 Tutti gli stati</option>
            <option value="in_attesa">⏳ In Attesa</option>
            <option value="in_corso">🔧 In Corso</option>
            <option value="completato">✅ Completato</option>
            <option value="consegnato">📦 Consegnato</option>
          </select>
        </div>

        {/* Lista Ordini */}
        {filteredOrdini.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nessun ordine trovato</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOrdini.map((ordine) => (
              <div key={ordine.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white">{ordine.numeroOrdine}</h3>
                      <p className="text-blue-100 text-sm mt-1">
                        {new Date(ordine.dataInizio).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statoColors[ordine.stato]}`}>
                        {statoLabels[ordine.stato]}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${prioritaColors[ordine.priorita]} capitalize`}>
                        {ordine.priorita}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body Card */}
                <div className="p-6 space-y-4">
                  {/* Cliente */}
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Cliente</p>
                      <p className="font-semibold text-gray-900">
                        {ordine.cliente.nome} {ordine.cliente.cognome}
                      </p>
                      {ordine.cliente.telefono && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Phone className="w-4 h-4" />
                          {ordine.cliente.telefono}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Veicolo */}
                  {ordine.veicolo && (
                    <div className="flex items-start gap-3">
                      <Car className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Veicolo</p>
                        <p className="font-semibold text-gray-900">
                          {ordine.veicolo.marca} {ordine.veicolo.modello}
                        </p>
                        <p className="text-sm text-gray-600">{ordine.veicolo.targa}</p>
                      </div>
                    </div>
                  )}

                  {/* Descrizione */}
                  <div className="flex items-start gap-3">
                    <Wrench className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Descrizione Lavoro</p>
                      <p className="text-gray-900">{ordine.descrizione}</p>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">Tempo Lavorato</span>
                      </div>
                      <span className={`text-2xl font-mono font-bold ${ordine.timerAttivo ? 'text-blue-600' : 'text-gray-900'}`}>
                        {formatTime(ordine.tempoLavorato)}
                      </span>
                    </div>

                    {/* Azioni Timer */}
                    <div className="flex gap-2">
                      {!ordine.timerAttivo && ordine.stato !== 'completato' && ordine.stato !== 'consegnato' && (
                        <button
                          onClick={() => avviaTimer(ordine.id)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Avvia
                        </button>
                      )}
                      {ordine.timerAttivo && (
                        <button
                          onClick={() => pausaTimer(ordine.id)}
                          className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center justify-center gap-2 transition-colors"
                        >
                          <Pause className="w-4 h-4" />
                          Pausa
                        </button>
                      )}
                      {ordine.stato !== 'completato' && ordine.stato !== 'consegnato' && (
                        <button
                          onClick={() => completaOrdine(ordine.id)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Completa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardLayout>
  );
}

