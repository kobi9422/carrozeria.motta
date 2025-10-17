'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { TimerAttivi } from '@/components/TimerAttivi';
import Link from 'next/link';
import {
  Wrench,
  Euro,
  FileText,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  CheckCircle,
  Calendar,
  ArrowRight,
  DollarSign,
  Package,
  UserCheck
} from 'lucide-react';

interface Statistica {
  ordiniAttivi: number;
  ordiniInScadenza: number;
  ordiniCompletatiMese: number;
  fatturatoMese: number;
  fatturatoMeseScorso: number;
  preventiviInAttesa: number;
  preventiviApprovati: number;
  clientiTotali: number;
  nuoviClientiMese: number;
  fattureNonPagate: number;
}

interface OrdineRecente {
  id: string;
  numero: string;
  cliente: string;
  veicolo: string;
  stato: 'in_attesa' | 'in_corso' | 'completato';
  priorita: 'bassa' | 'media' | 'alta';
  dataScadenza: string | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Statistica>({
    ordiniAttivi: 0,
    ordiniInScadenza: 0,
    ordiniCompletatiMese: 0,
    fatturatoMese: 0,
    fatturatoMeseScorso: 0,
    preventiviInAttesa: 0,
    preventiviApprovati: 0,
    clientiTotali: 0,
    nuoviClientiMese: 0,
    fattureNonPagate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchOrdiniRecenti();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats({
          ordiniAttivi: data.ordiniAttivi || 0,
          ordiniInScadenza: 0, // TODO: aggiungere all'API
          ordiniCompletatiMese: data.ordiniCompletatiMese || 0,
          fatturatoMese: data.fatturatoMese || 0,
          fatturatoMeseScorso: 0, // TODO: aggiungere all'API
          preventiviInAttesa: data.preventiviInAttesa || 0,
          preventiviApprovati: 0, // TODO: aggiungere all'API
          clientiTotali: data.clientiTotali || 0,
          nuoviClientiMese: 0, // TODO: aggiungere all'API
          fattureNonPagate: data.fattureScadute || 0
        });
      }
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdiniRecenti = async () => {
    try {
      const res = await fetch('/api/ordini?limit=5');
      if (res.ok) {
        const data = await res.json();
        const ordini = data.ordini || data;
        setOrdiniRecenti(ordini.slice(0, 5).map((ordine: any) => ({
          id: ordine.id,
          numero: ordine.numeroOrdine,
          cliente: `${ordine.cliente?.nome || ''} ${ordine.cliente?.cognome || ''}`.trim(),
          veicolo: `${ordine.veicolo?.marca || ''} ${ordine.veicolo?.modello || ''}`.trim(),
          stato: ordine.stato === 'in_lavorazione' ? 'in_corso' : ordine.stato,
          priorita: ordine.priorita,
          dataScadenza: ordine.dataFine
        })));
      }
    } catch (error) {
      console.error('Errore caricamento ordini recenti:', error);
    }
  };

  const [ordiniRecenti, setOrdiniRecenti] = useState<OrdineRecente[]>([]);

  // Calcola variazione fatturato
  const variazionePercentuale = ((stats.fatturatoMese - stats.fatturatoMeseScorso) / stats.fatturatoMeseScorso * 100).toFixed(1);
  const inCrescita = stats.fatturatoMese > stats.fatturatoMeseScorso;

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout title="Dashboard Admin">
        <div className="space-y-6">
          {/* Timer Attivi in Tempo Reale */}
          <TimerAttivi />

          {/* Card Statistiche Principali */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Ordini Attivi */}
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Wrench className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-5">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Ordini Attivi
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">{stats.ordiniAttivi}</dd>
                      <dd className="text-xs text-gray-500 mt-1">
                        {stats.ordiniInScadenza} in scadenza
                      </dd>
                    </div>
                  </div>
                  {stats.ordiniInScadenza > 0 && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {stats.ordiniInScadenza}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fatturato Mese */}
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${inCrescita ? 'bg-green-500' : 'bg-red-500'}`}>
                      <Euro className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Fatturato Mese
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      €{stats.fatturatoMese.toLocaleString('it-IT')}
                    </dd>
                    <dd className={`text-xs font-semibold mt-1 flex items-center ${inCrescita ? 'text-green-600' : 'text-red-600'}`}>
                      {inCrescita ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {inCrescita ? '+' : ''}{variazionePercentuale}% vs mese scorso
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Preventivi */}
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Preventivi
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.preventiviInAttesa}</dd>
                    <dd className="text-xs text-gray-500 mt-1">
                      {stats.preventiviApprovati} approvati questo mese
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Clienti */}
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Clienti Totali
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.clientiTotali}</dd>
                    <dd className="text-xs text-green-600 font-semibold mt-1">
                      +{stats.nuoviClientiMese} nuovi questo mese
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiche Secondarie */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ordini Completati */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Ordini Completati</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{stats.ordiniCompletatiMese}</p>
                  <p className="text-xs text-green-700 mt-1">Questo mese</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-600 opacity-50" />
              </div>
            </div>

            {/* Fatture Non Pagate */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Fatture Non Pagate</p>
                  <p className="text-3xl font-bold text-red-900 mt-1">{stats.fattureNonPagate}</p>
                  <p className="text-xs text-red-700 mt-1">Richiedono attenzione</p>
                </div>
                <AlertCircle className="w-12 h-12 text-red-600 opacity-50" />
              </div>
            </div>

            {/* Tasso di Conversione */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Tasso Conversione</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">
                    {((stats.preventiviApprovati / (stats.preventiviApprovati + stats.preventiviInAttesa)) * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-blue-700 mt-1">Preventivi → Ordini</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-600 opacity-50" />
              </div>
            </div>
          </div>

          {/* Ordini Recenti e Alert */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ordini in Scadenza */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    Ordini in Scadenza
                  </h3>
                  <Link href="/admin/ordini-lavoro" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    Vedi tutti →
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {ordiniRecenti.filter(o => o.priorita === 'alta').map((ordine) => (
                    <div key={ordine.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{ordine.numero}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            URGENTE
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{ordine.cliente} • {ordine.veicolo}</p>
                        <p className="text-xs text-orange-600 font-medium mt-1">
                          📅 Scadenza: {new Date(ordine.dataScadenza!).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <Link
                        href="/admin/ordini-lavoro"
                        className="ml-4 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors"
                      >
                        Gestisci
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">⚡ Azioni Rapide</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/admin/ordini-lavoro"
                    className="flex flex-col items-center justify-center p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors group"
                  >
                    <Wrench className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold text-blue-900">Nuovo Ordine</span>
                  </Link>

                  <Link
                    href="/admin/preventivi"
                    className="flex flex-col items-center justify-center p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors group"
                  >
                    <FileText className="w-8 h-8 text-yellow-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold text-yellow-900">Nuovo Preventivo</span>
                  </Link>

                  <Link
                    href="/admin/clienti"
                    className="flex flex-col items-center justify-center p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-colors group"
                  >
                    <UserCheck className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold text-purple-900">Nuovo Cliente</span>
                  </Link>

                  <Link
                    href="/admin/fatture"
                    className="flex flex-col items-center justify-center p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors group"
                  >
                    <DollarSign className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold text-green-900">Nuova Fattura</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Principale */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">📂 Gestione Completa</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/admin/clienti" className="group p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <Users className="w-8 h-8 text-purple-600" />
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Gestione Clienti
                  </h3>
                  <p className="text-sm text-gray-500">
                    Aggiungi, modifica e visualizza i clienti
                  </p>
                </Link>

                <Link href="/admin/ordini-lavoro" className="group p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <Wrench className="w-8 h-8 text-blue-600" />
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Ordini di Lavoro
                  </h3>
                  <p className="text-sm text-gray-500">
                    Gestisci tutti gli ordini di lavoro e riparazioni
                  </p>
                </Link>

                <Link href="/admin/calendario" className="group p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <Calendar className="w-8 h-8 text-indigo-600" />
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Calendario
                  </h3>
                  <p className="text-sm text-gray-500">
                    Pianifica appuntamenti e visualizza la programmazione
                  </p>
                </Link>

                <Link href="/admin/preventivi" className="group p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <FileText className="w-8 h-8 text-yellow-600" />
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Preventivi
                  </h3>
                  <p className="text-sm text-gray-500">
                    Crea e gestisci preventivi per i clienti
                  </p>
                </Link>

                <Link href="/admin/fatture" className="group p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <Euro className="w-8 h-8 text-green-600" />
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Fatture
                  </h3>
                  <p className="text-sm text-gray-500">
                    Genera e gestisci fatture e pagamenti
                  </p>
                </Link>

                <Link href="/admin/dipendenti" className="group p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <UserCheck className="w-8 h-8 text-teal-600" />
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Dipendenti
                  </h3>
                  <p className="text-sm text-gray-500">
                    Gestisci dipendenti e assegna ordini
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
