'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Modal } from '@/components/Modal';
import { Toast } from '@/components/Toast';
import { useAuth } from '@/components/AuthProvider';
import { Plus, Search, Edit, Eye, Clock, CheckCircle, AlertCircle, Users, UserPlus, X, Calendar, Euro, Phone, Car, Wrench, Filter } from 'lucide-react';

interface Dipendente {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  attivo: boolean;
}

interface OrdineLavoro {
  id: string;
  numeroOrdine: string;
  cliente: {
    nome: string;
    cognome: string;
  };
  veicolo: {
    marca: string;
    modello: string;
    targa: string;
  };
  descrizione: string;
  stato: 'in_attesa' | 'in_corso' | 'completato' | 'consegnato';
  priorita: 'bassa' | 'media' | 'alta';
  dataInizio: string;
  dataFine: string | null;
  costoStimato: number;
  dipendentiAssegnati: string[]; // Array di ID dipendenti
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

export default function OrdiniLavoroPage() {
  const { isAdmin } = useAuth();
  const [ordini, setOrdini] = useState<OrdineLavoro[]>([]);
  const [dipendenti, setDipendenti] = useState<Dipendente[]>([]);
  const [clienti, setClienti] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStato, setFiltroStato] = useState<string>('tutti');
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrdine, setSelectedOrdine] = useState<OrdineLavoro | null>(null);
  const [selectedDipendenti, setSelectedDipendenti] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form nuovo ordine
  const [clienteMode, setClienteMode] = useState<'select' | 'new'>('select');
  const [formData, setFormData] = useState({
    clienteId: '',
    nuovoCliente: { nome: '', cognome: '', email: '', telefono: '' },
    descrizione: '',
    priorita: 'media',
    dataInizio: new Date().toISOString().split('T')[0],
    dataFine: '',
    costoStimato: ''
  });

  useEffect(() => {
    fetchOrdini();
    fetchDipendenti();
    fetchClienti();
  }, []);

  const fetchClienti = async () => {
    try {
      const res = await fetch('/api/clienti');
      if (res.ok) {
        const data = await res.json();
        setClienti(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento clienti:', error);
    }
  };

  const fetchDipendenti = async () => {
    try {
      const res = await fetch('/api/dipendenti?attivi=true');
      if (res.ok) {
        const data = await res.json();
        setDipendenti(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento dipendenti:', error);
    }
  };

  const fetchOrdini = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ordini');
      if (res.ok) {
        const data = await res.json();
        setOrdini(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento ordini:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignModal = (ordine: OrdineLavoro) => {
    setSelectedOrdine(ordine);
    setSelectedDipendenti(ordine.dipendentiAssegnati);
    setShowAssignModal(true);
  };

  const handleAssignDipendenti = () => {
    if (!selectedOrdine) return;

    setOrdini(prev => prev.map(ordine =>
      ordine.id === selectedOrdine.id
        ? { ...ordine, dipendentiAssegnati: selectedDipendenti }
        : ordine
    ));

    const numDipendenti = selectedDipendenti.length;
    const dipendentiNomi = selectedDipendenti
      .map(id => {
        const dip = dipendenti.find(d => d.id === id);
        return dip ? `${dip.nome} ${dip.cognome}` : '';
      })
      .filter(Boolean)
      .join(', ');

    if (numDipendenti === 0) {
      setToast({
        message: `Dipendenti rimossi dall'ordine ${selectedOrdine.numeroOrdine}`,
        type: 'success'
      });
    } else {
      setToast({
        message: `${numDipendenti} dipendente${numDipendenti > 1 ? 'i' : ''} assegnato${numDipendenti > 1 ? 'i' : ''} all'ordine ${selectedOrdine.numeroOrdine}`,
        type: 'success'
      });
    }

    setShowAssignModal(false);
    setSelectedOrdine(null);
  };

  const toggleDipendente = (dipendenteId: string) => {
    setSelectedDipendenti(prev => {
      if (prev.includes(dipendenteId)) {
        return prev.filter(id => id !== dipendenteId);
      } else {
        return [...prev, dipendenteId];
      }
    });
  };

  const handleSalvaCliente = async () => {
    if (!formData.nuovoCliente.nome || !formData.nuovoCliente.cognome) {
      setToast({ message: 'Nome e cognome del cliente sono obbligatori', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const resCliente = await fetch('/api/clienti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData.nuovoCliente)
      });

      if (!resCliente.ok) {
        const data = await resCliente.json();
        throw new Error(data.error || 'Errore nella creazione del cliente');
      }

      const nuovoCliente = await resCliente.json();

      // Aggiungi cliente alla lista
      setClienti([...clienti, nuovoCliente]);

      // Passa a modalità "Seleziona Esistente" e pre-seleziona il nuovo cliente
      setClienteMode('select');
      setFormData({
        ...formData,
        clienteId: nuovoCliente.id,
        nuovoCliente: { nome: '', cognome: '', email: '', telefono: '' }
      });

      setToast({ message: `Cliente ${nuovoCliente.nome} ${nuovoCliente.cognome} creato con successo!`, type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreaOrdine = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validazione: deve esserci un cliente selezionato
    if (!formData.clienteId) {
      setToast({ message: 'Seleziona un cliente prima di creare l\'ordine', type: 'error' });
      return;
    }

    if (!formData.descrizione) {
      setToast({ message: 'La descrizione del lavoro è obbligatoria', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // Crea l'ordine
      const resOrdine = await fetch('/api/ordini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: formData.clienteId,
          veicoloId: null, // Nessun veicolo
          descrizione: formData.descrizione,
          priorita: formData.priorita,
          dataInizio: formData.dataInizio,
          dataFine: formData.dataFine || null,
          costoStimato: formData.costoStimato || 0,
          dipendentiIds: []
        })
      });

      if (!resOrdine.ok) {
        const data = await resOrdine.json();
        throw new Error(data.error || 'Errore nella creazione dell\'ordine');
      }

      setToast({ message: 'Ordine creato con successo!', type: 'success' });
      setShowModal(false);

      // Reset form
      setFormData({
        clienteId: '',
        nuovoCliente: { nome: '', cognome: '', email: '', telefono: '' },
        descrizione: '',
        priorita: 'media',
        dataInizio: new Date().toISOString().split('T')[0],
        dataFine: '',
        costoStimato: ''
      });
      setClienteMode('select');

      // Ricarica ordini
      fetchOrdini();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getDipendentiNomi = (dipendentiIds: string[]) => {
    return dipendentiIds
      .map(id => {
        const dip = dipendenti.find(d => d.id === id);
        return dip ? `${dip.nome} ${dip.cognome}` : null;
      })
      .filter(Boolean);
  };

  const filteredOrdini = ordini.filter(ordine => {
    const matchSearch =
      ordine.numeroOrdine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${ordine.cliente.nome} ${ordine.cliente.cognome}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ordine.veicolo && ordine.veicolo.targa.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchStato;
    if (filtroStato === 'tutti') {
      matchStato = true;
    } else if (filtroStato === 'archivio') {
      matchStato = ordine.stato === 'completato' || ordine.stato === 'consegnato';
    } else {
      matchStato = ordine.stato === filtroStato;
    }

    return matchSearch && matchStato;
  });

  const stats = {
    totali: ordini.length,
    inAttesa: ordini.filter(o => o.stato === 'in_attesa').length,
    inCorso: ordini.filter(o => o.stato === 'in_corso').length,
    completati: ordini.filter(o => o.stato === 'completato').length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ordini di Lavoro</h1>
            <p className="text-gray-600 mt-1">Gestisci tutti gli ordini di riparazione</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Nuovo Ordine
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totale Ordini</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totali}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Attesa</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inAttesa}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Corso</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inCorso}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completati</p>
                <p className="text-2xl font-bold text-green-600">{stats.completati}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca per numero ordine, cliente o targa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filtroStato}
                onChange={(e) => setFiltroStato(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-w-[180px]"
              >
                <option value="tutti">📋 Tutti gli stati</option>
                <option value="in_attesa">⏳ In Attesa</option>
                <option value="in_corso">🔧 In Corso</option>
                <option value="completato">✅ Completato</option>
                <option value="consegnato">📦 Consegnato</option>
                <option value="archivio">🗄️ Archivio (Completati + Consegnati)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-6 text-lg text-gray-600">Caricamento ordini...</p>
          </div>
        ) : filteredOrdini.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Nessun ordine trovato</p>
            <p className="text-sm text-gray-400 mt-2">Prova a modificare i filtri di ricerca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOrdini.map((ordine) => (
              <div
                key={ordine.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-blue-200"
              >
                {/* Card Header */}
                <div className={`p-6 ${ordine.priorita === 'alta' ? 'bg-gradient-to-r from-red-50 to-orange-50' : ordine.priorita === 'media' ? 'bg-gradient-to-r from-yellow-50 to-amber-50' : 'bg-gradient-to-r from-gray-50 to-slate-50'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{ordine.numeroOrdine}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{ordine.dataInizio}</span>
                        {ordine.dataFine && (
                          <>
                            <span>→</span>
                            <span>{ordine.dataFine}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`px-3 py-1.5 text-sm font-bold rounded-full ${statoColors[ordine.stato]}`}>
                        {statoLabels[ordine.stato]}
                      </span>
                      <span className={`px-3 py-1.5 text-sm font-bold rounded-full ${prioritaColors[ordine.priorita]}`}>
                        {ordine.priorita.charAt(0).toUpperCase() + ordine.priorita.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Cliente e Veicolo */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <Users className="w-5 h-5" />
                        <span className="text-xs font-semibold uppercase">Cliente</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-base">
                        {ordine.cliente.nome} {ordine.cliente.cognome}
                      </p>
                    </div>
                    {ordine.veicolo && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-purple-600 mb-2">
                          <Car className="w-5 h-5" />
                          <span className="text-xs font-semibold uppercase">Veicolo</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {ordine.veicolo.marca} {ordine.veicolo.modello}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{ordine.veicolo.targa}</p>
                      </div>
                    )}
                  </div>

                  {/* Descrizione */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Wrench className="w-5 h-5" />
                      <span className="text-xs font-semibold uppercase">Descrizione Lavoro</span>
                    </div>
                    <p className="text-gray-900 text-sm leading-relaxed">{ordine.descrizione}</p>
                  </div>

                  {/* Dipendenti Assegnati */}
                  <div className="bg-teal-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-teal-600 mb-3">
                      <Users className="w-5 h-5" />
                      <span className="text-xs font-semibold uppercase">Dipendenti Assegnati</span>
                    </div>
                    {ordine.dipendentiAssegnati.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {getDipendentiNomi(ordine.dipendentiAssegnati).map((nome, idx) => (
                          <span key={idx} className="inline-flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium">
                            <Users className="w-4 h-4" />
                            {nome}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Nessun dipendente assegnato</p>
                    )}
                  </div>

                  {/* Costo */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <Euro className="w-5 h-5" />
                      <span className="text-xs font-semibold uppercase">Costo Stimato</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      €{ordine.costoStimato.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-100">
                  <div className="flex gap-3">
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenAssignModal(ordine)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        <UserPlus className="w-5 h-5" />
                        Assegna Dipendenti
                      </button>
                    )}
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      <Eye className="w-5 h-5" />
                      Visualizza Dettagli
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Nuovo Ordine */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Nuovo Ordine di Lavoro"
          size="lg"
        >
          <form onSubmit={handleCreaOrdine} className="space-y-6">
            {/* Toggle Cliente */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Cliente *</label>
              <div className="flex gap-3 bg-gray-100 p-1 rounded-lg mb-4">
                <button
                  type="button"
                  onClick={() => setClienteMode('select')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    clienteMode === 'select'
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Seleziona Esistente
                </button>
                <button
                  type="button"
                  onClick={() => setClienteMode('new')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    clienteMode === 'new'
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Crea Nuovo
                </button>
              </div>

              {clienteMode === 'select' ? (
                <select
                  value={formData.clienteId}
                  onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={clienteMode === 'select'}
                >
                  <option value="">-- Seleziona un cliente --</option>
                  {clienti.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome} {cliente.cognome} {cliente.email ? `(${cliente.email})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                      <input
                        type="text"
                        value={formData.nuovoCliente.nome}
                        onChange={(e) => setFormData({ ...formData, nuovoCliente: { ...formData.nuovoCliente, nome: e.target.value } })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Mario"
                        required={clienteMode === 'new'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
                      <input
                        type="text"
                        value={formData.nuovoCliente.cognome}
                        onChange={(e) => setFormData({ ...formData, nuovoCliente: { ...formData.nuovoCliente, cognome: e.target.value } })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Rossi"
                        required={clienteMode === 'new'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.nuovoCliente.email}
                        onChange={(e) => setFormData({ ...formData, nuovoCliente: { ...formData.nuovoCliente, email: e.target.value } })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="mario.rossi@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                      <input
                        type="tel"
                        value={formData.nuovoCliente.telefono}
                        onChange={(e) => setFormData({ ...formData, nuovoCliente: { ...formData.nuovoCliente, telefono: e.target.value } })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="333 1234567"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleSalvaCliente}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      disabled={loading || !formData.nuovoCliente.nome || !formData.nuovoCliente.cognome}
                    >
                      <Plus className="w-5 h-5" />
                      Salva Cliente e Continua
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Il cliente verrà salvato e potrai selezionarlo per creare l'ordine
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Descrizione Lavoro */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descrizione Lavoro *</label>
              <textarea
                value={formData.descrizione}
                onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Descrivi il lavoro da eseguire..."
                required
              />
            </div>

            {/* Priorità e Costo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Priorità</label>
                <select
                  value={formData.priorita}
                  onChange={(e) => setFormData({ ...formData, priorita: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bassa">🟢 Bassa</option>
                  <option value="media">🟡 Media</option>
                  <option value="alta">🔴 Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Costo Stimato (€)</label>
                <input
                  type="number"
                  value={formData.costoStimato}
                  onChange={(e) => setFormData({ ...formData, costoStimato: e.target.value })}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Data Inizio *</label>
                <input
                  type="date"
                  value={formData.dataInizio}
                  onChange={(e) => setFormData({ ...formData, dataInizio: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Data Fine Prevista</label>
                <input
                  type="date"
                  value={formData.dataFine}
                  onChange={(e) => setFormData({ ...formData, dataFine: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                disabled={loading}
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !formData.clienteId || !formData.descrizione}
                title={!formData.clienteId ? 'Seleziona o crea un cliente prima' : !formData.descrizione ? 'Inserisci la descrizione del lavoro' : ''}
              >
                {loading ? 'Creazione...' : 'Crea Ordine'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Assegna Dipendenti */}
        <Modal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedOrdine(null);
          }}
          title={`Assegna Dipendenti - ${selectedOrdine?.numeroOrdine || ''}`}
          size="md"
        >
          <div className="space-y-4">
            {/* Info Ordine */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Cliente:</span>
                  <p className="font-medium text-gray-900">
                    {selectedOrdine?.cliente.nome} {selectedOrdine?.cliente.cognome}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Veicolo:</span>
                  <p className="font-medium text-gray-900">
                    {selectedOrdine?.veicolo.marca} {selectedOrdine?.veicolo.modello}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista Dipendenti */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Users className="w-4 h-4 inline mr-1" />
                Seleziona Dipendenti (puoi selezionarne più di uno)
              </label>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {dipendenti.filter(d => d.attivo).length === 0 ? (
                  <p className="text-sm text-gray-500 italic p-4 text-center">
                    Nessun dipendente attivo disponibile
                  </p>
                ) : (
                  dipendenti
                    .filter(d => d.attivo)
                    .map(dipendente => (
                      <div
                        key={dipendente.id}
                        onClick={() => toggleDipendente(dipendente.id)}
                        className={`
                          flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all
                          ${selectedDipendenti.includes(dipendente.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                            ${selectedDipendenti.includes(dipendente.id)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700'
                            }
                          `}>
                            {dipendente.nome.charAt(0)}{dipendente.cognome.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {dipendente.nome} {dipendente.cognome}
                            </p>
                            <p className="text-xs text-gray-500">{dipendente.email}</p>
                          </div>
                        </div>

                        {selectedDipendenti.includes(dipendente.id) && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Riepilogo Selezione */}
            {selectedDipendenti.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>{selectedDipendenti.length}</strong> dipendente{selectedDipendenti.length > 1 ? 'i' : ''} selezionato{selectedDipendenti.length > 1 ? 'i' : ''}
                </p>
              </div>
            )}

            {/* Bottoni */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedOrdine(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleAssignDipendenti}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {selectedDipendenti.length === 0 ? 'Rimuovi Assegnazioni' : 'Assegna Dipendenti'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Toast Notification */}
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
