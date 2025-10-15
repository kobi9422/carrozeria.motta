'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Modal } from '@/components/Modal';
import { Toast } from '@/components/Toast';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Mail, Phone, Key, Shield } from 'lucide-react';

interface Dipendente {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  telefono?: string;
  ruolo: 'admin' | 'employee';
  attivo: boolean;
  costoOrario?: number;
  ordiniAssegnati?: number;
  createdAt: string;
}

export default function DipendentiPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingDipendente, setEditingDipendente] = useState<Dipendente | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [dipendenti, setDipendenti] = useState<Dipendente[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRuolo, setFiltroRuolo] = useState('tutti');
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    password: '',
    ruolo: 'employee' as 'admin' | 'employee',
    costoOrario: ''
  });

  // Carica dipendenti dall'API
  useEffect(() => {
    fetchDipendenti();
  }, []);

  const fetchDipendenti = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dipendenti');
      if (!res.ok) {
        throw new Error('Errore nel caricamento dipendenti');
      }
      const data = await res.json();
      setDipendenti(data);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (dipendente?: Dipendente) => {
    if (dipendente) {
      setEditingDipendente(dipendente);
      setFormData({
        nome: dipendente.nome,
        cognome: dipendente.cognome,
        email: dipendente.email,
        telefono: dipendente.telefono || '',
        password: '',
        ruolo: dipendente.ruolo,
        costoOrario: dipendente.costoOrario?.toString() || ''
      });
    } else {
      setEditingDipendente(null);
      setFormData({
        nome: '',
        cognome: '',
        email: '',
        telefono: '',
        password: '',
        ruolo: 'employee',
        costoOrario: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (editingDipendente) {
        // Modifica dipendente esistente
        const res = await fetch(`/api/dipendenti/${editingDipendente.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: formData.nome,
            cognome: formData.cognome,
            email: formData.email,
            telefono: formData.telefono || null,
            ruolo: formData.ruolo,
            costoOrario: formData.costoOrario ? parseFloat(formData.costoOrario) : 0,
            ...(formData.password && { password: formData.password })
          })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Errore nella modifica del dipendente');
        }

        setToast({ message: 'Dipendente modificato con successo!', type: 'success' });
      } else {
        // Crea nuovo dipendente
        if (!formData.password) {
          setToast({ message: 'La password è obbligatoria per nuovi dipendenti', type: 'error' });
          return;
        }

        const res = await fetch('/api/dipendenti', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: formData.nome,
            cognome: formData.cognome,
            email: formData.email,
            telefono: formData.telefono || null,
            password: formData.password,
            ruolo: formData.ruolo,
            costoOrario: formData.costoOrario ? parseFloat(formData.costoOrario) : 0
          })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Errore nella creazione del dipendente');
        }

        setToast({ message: 'Dipendente creato con successo!', type: 'success' });
      }

      // Ricarica lista dipendenti
      await fetchDipendenti();
      setShowModal(false);
      setEditingDipendente(null);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const dipendente = dipendenti.find(d => d.id === id);
    if (dipendente && (dipendente.ordiniAssegnati || 0) > 0) {
      setToast({
        message: `Impossibile eliminare: ${dipendente.nome} ha ${dipendente.ordiniAssegnati} ordini assegnati`,
        type: 'error'
      });
      return;
    }

    if (confirm('Sei sicuro di voler eliminare questo dipendente?')) {
      try {
        setLoading(true);
        const res = await fetch(`/api/dipendenti/${id}`, {
          method: 'DELETE'
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Errore nell\'eliminazione del dipendente');
        }

        await fetchDipendenti();
        setToast({ message: 'Dipendente eliminato con successo!', type: 'success' });
      } catch (error: any) {
        setToast({ message: error.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleAttivo = async (id: string) => {
    const dipendente = dipendenti.find(d => d.id === id);
    if (!dipendente) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/dipendenti/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attivo: !dipendente.attivo
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore nell\'aggiornamento dello stato');
      }

      await fetchDipendenti();
      setToast({
        message: `Dipendente ${dipendente.attivo ? 'disattivato' : 'attivato'} con successo!`,
        type: 'success'
      });
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredDipendenti = dipendenti.filter(dip => {
    const matchSearch = 
      `${dip.nome} ${dip.cognome}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dip.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchRuolo = filtroRuolo === 'tutti' || dip.ruolo === filtroRuolo;
    
    return matchSearch && matchRuolo;
  });

  const stats = {
    totali: dipendenti.length,
    attivi: dipendenti.filter(d => d.attivo).length,
    admin: dipendenti.filter(d => d.ruolo === 'admin').length,
    dipendenti: dipendenti.filter(d => d.ruolo === 'employee').length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestione Dipendenti</h1>
            <p className="text-gray-600 mt-1">Gestisci gli utenti del sistema</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Nuovo Dipendente
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totale Utenti</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totali}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attivi</p>
                <p className="text-2xl font-bold text-green-600">{stats.attivi}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Amministratori</p>
                <p className="text-2xl font-bold text-purple-600">{stats.admin}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dipendenti</p>
                <p className="text-2xl font-bold text-blue-600">{stats.dipendenti}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca per nome o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filtroRuolo}
              onChange={(e) => setFiltroRuolo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="tutti">Tutti i ruoli</option>
              <option value="admin">Amministratori</option>
              <option value="employee">Dipendenti</option>
            </select>
          </div>
        </div>

        {/* Dipendenti List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruolo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo/h</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDipendenti.map((dipendente) => (
                  <tr key={dipendente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {dipendente.nome[0]}{dipendente.cognome[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {dipendente.nome} {dipendente.cognome}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{dipendente.email}</span>
                        </div>
                        {dipendente.telefono && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{dipendente.telefono}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        dipendente.ruolo === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {dipendente.ruolo === 'admin' ? 'Amministratore' : 'Dipendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dipendente.costoOrario ? `€${dipendente.costoOrario.toFixed(2)}/h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        dipendente.attivo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {dipendente.attivo ? 'Attivo' : 'Disattivato'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleAttivo(dipendente.id)}
                          className={`${dipendente.attivo ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                          title={dipendente.attivo ? 'Disattiva' : 'Attiva'}
                        >
                          {dipendente.attivo ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleOpenModal(dipendente)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifica"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(dipendente.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Elimina"
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

        {/* Modal Dipendente */}
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditingDipendente(null); }}
          title={editingDipendente ? 'Modifica Dipendente' : 'Nuovo Dipendente'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Mario"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cognome *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cognome}
                    onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Rossi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="mario.rossi@carrozzeriamotta.it"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+39 123 456 7890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Key className="w-4 h-4 inline mr-1" />
                  Password {editingDipendente ? '(lascia vuoto per non modificare)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingDipendente}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Shield className="w-4 h-4 inline mr-1" />
                    Ruolo *
                  </label>
                  <select
                    value={formData.ruolo}
                    onChange={(e) => setFormData({ ...formData, ruolo: e.target.value as 'admin' | 'employee' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="employee">Dipendente</option>
                    <option value="admin">Amministratore</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.ruolo === 'admin'
                      ? '⚠️ Accesso completo'
                      : 'Solo ordini assegnati'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    💰 Costo Orario (€/h)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costoOrario}
                    onChange={(e) => setFormData({ ...formData, costoOrario: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="25.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Per calcolo costi lavoro
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => { setShowModal(false); setEditingDipendente(null); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={loading}
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Salvataggio...' : (editingDipendente ? 'Salva Modifiche' : 'Crea Dipendente')}
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
