'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { 
  ArchiveBoxIcon, 
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

type TabType = 'ordini' | 'preventivi' | 'fatture';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function ArchivioPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('ordini');
  const [loading, setLoading] = useState(true);
  const [archivio, setArchivio] = useState<any>({
    ordini: [],
    preventivi: [],
    fatture: []
  });
  const [filtri, setFiltri] = useState({
    dataInizio: '',
    dataFine: '',
    search: ''
  });
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    fetchArchivio();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchArchivio = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtri.dataInizio) params.append('dataInizio', filtri.dataInizio);
      if (filtri.dataFine) params.append('dataFine', filtri.dataFine);

      const res = await fetch(`/api/archivio?${params.toString()}`);
      if (!res.ok) throw new Error('Errore nel caricamento archivio');

      const data = await res.json();
      setArchivio(data);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRipristina = async (tipo: TabType, id: string) => {
    if (!confirm('Vuoi ripristinare questo elemento dall\'archivio?')) return;

    try {
      const endpoint = tipo === 'ordini' ? 'ordini-lavoro' : tipo;
      const res = await fetch(`/api/${endpoint}/${id}/archivia`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivia: false })
      });

      if (!res.ok) throw new Error('Errore nel ripristino');

      setToast({ message: 'Elemento ripristinato con successo!', type: 'success' });
      await fetchArchivio();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatoBadgeColor = (stato: string) => {
    const colors: Record<string, string> = {
      completato: 'bg-green-100 text-green-800',
      consegnato: 'bg-blue-100 text-blue-800',
      annullato: 'bg-red-100 text-red-800',
      accettato: 'bg-green-100 text-green-800',
      rifiutato: 'bg-red-100 text-red-800',
      scaduto: 'bg-gray-100 text-gray-800',
      pagata: 'bg-green-100 text-green-800',
      emessa: 'bg-blue-100 text-blue-800',
      scaduta: 'bg-red-100 text-red-800'
    };
    return colors[stato] || 'bg-gray-100 text-gray-800';
  };

  const filteredData = () => {
    const data = archivio[activeTab] || [];
    if (!filtri.search) return data;

    return data.filter((item: any) => {
      const searchLower = filtri.search.toLowerCase();
      const nomeCliente = item.cliente?.nome?.toLowerCase() || '';
      const cognomeCliente = item.cliente?.cognome?.toLowerCase() || '';
      const ragioneSociale = item.cliente?.ragioneSociale?.toLowerCase() || '';
      const numero = (item.numeroOrdine || item.numeroPreventivo || item.numeroFattura || '').toLowerCase();

      return (
        nomeCliente.includes(searchLower) ||
        cognomeCliente.includes(searchLower) ||
        ragioneSociale.includes(searchLower) ||
        numero.includes(searchLower)
      );
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ArchiveBoxIcon className="h-8 w-8 text-blue-600" />
              Archivio
            </h1>
            <p className="text-gray-600 mt-1">Visualizza e gestisci i lavori archiviati</p>
          </div>
        </div>

        {/* Filtri */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Filtri</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inizio
              </label>
              <input
                type="date"
                value={filtri.dataInizio}
                onChange={(e) => setFiltri({ ...filtri, dataInizio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fine
              </label>
              <input
                type="date"
                value={filtri.dataFine}
                onChange={(e) => setFiltri({ ...filtri, dataFine: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cerca
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cliente, numero..."
                  value={filtri.search}
                  onChange={(e) => setFiltri({ ...filtri, search: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={fetchArchivio}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Applica Filtri
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('ordini')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'ordini'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ClipboardDocumentListIcon className="h-5 w-5" />
                Ordini ({archivio.ordini?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('preventivi')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'preventivi'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DocumentTextIcon className="h-5 w-5" />
                Preventivi ({archivio.preventivi?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('fatture')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'fatture'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BanknotesIcon className="h-5 w-5" />
                Fatture ({archivio.fatture?.length || 0})
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Caricamento...</p>
              </div>
            ) : filteredData().length === 0 ? (
              <div className="text-center py-12">
                <ArchiveBoxIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nessun elemento archiviato</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Numero
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      {activeTab === 'ordini' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Veicolo
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Archiviazione
                      </th>
                      {(activeTab === 'preventivi' || activeTab === 'fatture') && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Importo
                        </th>
                      )}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData().map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.numeroOrdine || item.numeroPreventivo || item.numeroFattura}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.cliente?.tipoCliente === 'societa' 
                            ? item.cliente?.ragioneSociale 
                            : `${item.cliente?.nome} ${item.cliente?.cognome}`}
                        </td>
                        {activeTab === 'ordini' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.veicolo ? `${item.veicolo.marca} ${item.veicolo.modello} (${item.veicolo.targa})` : '-'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatoBadgeColor(item.stato)}`}>
                            {item.stato}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.dataArchiviazione)}
                        </td>
                        {(activeTab === 'preventivi' || activeTab === 'fatture') && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(item.importoTotale || 0)}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRipristina(activeTab, item.id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 ml-auto"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                            Ripristina
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}
    </AdminLayout>
  );
}

