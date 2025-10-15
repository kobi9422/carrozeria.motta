'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Modal } from '@/components/Modal';
import { Toast } from '@/components/Toast';
import { Plus, Search, Edit, Trash2, Car } from 'lucide-react';

interface Veicolo {
  id: string;
  clienteId: string;
  cliente: {
    nome: string;
    cognome: string;
  };
  marca: string;
  modello: string;
  targa: string;
  anno: number;
  colore: string;
  numeroTelaio: string;
  cilindrata: string;
  alimentazione: string;
  note: string | null;
}

export default function VeicoliPage() {
  const [veicoli, setVeicoli] = useState<Veicolo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedVeicolo, setSelectedVeicolo] = useState<Veicolo | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [formData, setFormData] = useState({
    clienteId: '',
    marca: '',
    modello: '',
    targa: '',
    anno: new Date().getFullYear(),
    colore: '',
    numeroTelaio: '',
    cilindrata: '',
    alimentazione: 'Benzina',
    note: ''
  });

  useEffect(() => {
    fetchVeicoli();
  }, []);

  const fetchVeicoli = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/veicoli');

      if (!res.ok) {
        throw new Error('Errore nel caricamento dei veicoli');
      }

      const data = await res.json();
      setVeicoli(data);
    } catch (error: any) {
      console.error('Errore nel caricamento veicoli:', error);
      setToast({ message: error.message || 'Errore nel caricamento', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredVeicoli = veicoli.filter(veicolo =>
    veicolo.targa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${veicolo.marca} ${veicolo.modello}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${veicolo.cliente.nome} ${veicolo.cliente.cognome}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (veicolo?: Veicolo) => {
    if (veicolo) {
      setSelectedVeicolo(veicolo);
      setFormData({
        clienteId: veicolo.clienteId,
        marca: veicolo.marca,
        modello: veicolo.modello,
        targa: veicolo.targa,
        anno: veicolo.anno,
        colore: veicolo.colore,
        numeroTelaio: veicolo.numeroTelaio,
        cilindrata: veicolo.cilindrata,
        alimentazione: veicolo.alimentazione,
        note: veicolo.note || ''
      });
    } else {
      setSelectedVeicolo(null);
      setFormData({
        clienteId: '',
        marca: '',
        modello: '',
        targa: '',
        anno: new Date().getFullYear(),
        colore: '',
        numeroTelaio: '',
        cilindrata: '',
        alimentazione: 'Benzina',
        note: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (selectedVeicolo) {
        // Modifica veicolo esistente
        const res = await fetch(`/api/veicoli/${selectedVeicolo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Errore nella modifica del veicolo');
        }

        setToast({ message: 'Veicolo modificato con successo!', type: 'success' });
      } else {
        // Crea nuovo veicolo
        const res = await fetch('/api/veicoli', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Errore nella creazione del veicolo');
        }

        setToast({ message: 'Veicolo creato con successo!', type: 'success' });
      }

      // Ricarica lista veicoli
      await fetchVeicoli();
      setShowModal(false);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo veicolo?')) {
      try {
        setLoading(true);
        const res = await fetch(`/api/veicoli/${id}`, {
          method: 'DELETE'
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Errore nell\'eliminazione del veicolo');
        }

        await fetchVeicoli();
        setToast({ message: 'Veicolo eliminato con successo!', type: 'success' });
      } catch (error: any) {
        setToast({ message: error.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestione Veicoli</h1>
            <p className="text-gray-600 mt-1">Gestisci il parco veicoli dei clienti</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Nuovo Veicolo
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totale Veicoli</p>
                <p className="text-2xl font-bold text-gray-900">{veicoli.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Benzina</p>
                <p className="text-2xl font-bold text-gray-900">
                  {veicoli.filter(v => v.alimentazione === 'Benzina').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Diesel</p>
                <p className="text-2xl font-bold text-gray-900">
                  {veicoli.filter(v => v.alimentazione === 'Diesel').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca per targa, marca/modello o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veicolo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Targa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Anno</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alimentazione</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVeicoli.map((veicolo) => (
                  <tr key={veicolo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Car className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {veicolo.marca} {veicolo.modello}
                          </div>
                          <div className="text-sm text-gray-500">{veicolo.colore}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {veicolo.targa}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {veicolo.cliente.nome} {veicolo.cliente.cognome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {veicolo.anno}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {veicolo.alimentazione}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(veicolo)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(veicolo.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedVeicolo ? 'Modifica Veicolo' : 'Nuovo Veicolo'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
                <input
                  type="text"
                  required
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modello *</label>
                <input
                  type="text"
                  required
                  value={formData.modello}
                  onChange={(e) => setFormData({ ...formData, modello: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Targa *</label>
                <input
                  type="text"
                  required
                  value={formData.targa}
                  onChange={(e) => setFormData({ ...formData, targa: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anno *</label>
                <input
                  type="number"
                  required
                  value={formData.anno}
                  onChange={(e) => setFormData({ ...formData, anno: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colore</label>
                <input
                  type="text"
                  value={formData.colore}
                  onChange={(e) => setFormData({ ...formData, colore: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alimentazione *</label>
                <select
                  value={formData.alimentazione}
                  onChange={(e) => setFormData({ ...formData, alimentazione: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Benzina">Benzina</option>
                  <option value="Diesel">Diesel</option>
                  <option value="GPL">GPL</option>
                  <option value="Metano">Metano</option>
                  <option value="Elettrico">Elettrico</option>
                  <option value="Ibrido">Ibrido</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Numero Telaio</label>
                <input
                  type="text"
                  value={formData.numeroTelaio}
                  onChange={(e) => setFormData({ ...formData, numeroTelaio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  rows={3}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedVeicolo ? 'Salva Modifiche' : 'Crea Veicolo'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
