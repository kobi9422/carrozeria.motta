'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, X, Trash2, Send, Check, XCircle, Euro, User, Printer, Download, Archive } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PrintPreventivo } from '@/components/PrintPreventivo';
import { generatePreventivoPDF } from '@/lib/pdfGenerator';

export default function PreventiviPage() {
  const [preventivi, setPreventivi] = useState<any[]>([]);
  const [clienti, setClienti] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filtroStato, setFiltroStato] = useState('tutti');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [preventivoStampa, setPreventivoStampa] = useState<any | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    clienteId: '',
    titolo: '',
    descrizione: '',
    dataScadenza: '',
    note: '',
    aliquotaIva: 22, // IVA globale: 22% o 0%
    voci: [{ descrizione: '', quantita: 1, prezzoUnitario: 0 }]
  });

  useEffect(() => {
    fetchPreventivi();
    fetchClienti();
  }, [filtroStato]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchPreventivi = async () => {
    try {
      const url = filtroStato === 'tutti' ? '/api/preventivi' : `/api/preventivi?stato=${filtroStato}`;
      const res = await fetch(url);
      const data = await res.json();
      setPreventivi(data);
    } catch (error) {
      console.error('Errore caricamento preventivi:', error);
    }
  };

  const fetchClienti = async () => {
    try {
      const res = await fetch('/api/clienti');
      const data = await res.json();
      setClienti(data);
    } catch (error) {
      console.error('Errore caricamento clienti:', error);
    }
  };

  const handleCreaPreventivo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/preventivi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore nella creazione del preventivo');
      }

      setToast({ message: 'Preventivo creato con successo!', type: 'success' });
      setShowModal(false);
      resetForm();
      fetchPreventivi();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCambiaStato = async (id: string, nuovoStato: string) => {
    try {
      const res = await fetch(`/api/preventivi/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: nuovoStato })
      });

      if (!res.ok) throw new Error('Errore aggiornamento stato');

      setToast({ message: 'Stato aggiornato con successo!', type: 'success' });
      fetchPreventivi();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleElimina = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo preventivo?')) return;

    try {
      const res = await fetch(`/api/preventivi/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Errore eliminazione');

      setToast({ message: 'Preventivo eliminato con successo!', type: 'success' });
      fetchPreventivi();
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleArchivia = async (preventivoId: string) => {
    if (!confirm('Vuoi archiviare questo preventivo? Potrà essere ripristinato dall\'archivio.')) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/preventivi/${preventivoId}/archivia`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivia: true })
      });

      if (!res.ok) throw new Error('Errore nell\'archiviazione');

      setToast({ message: 'Preventivo archiviato con successo!', type: 'success' });
      await fetchPreventivi(); // Ricarica lista
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const aggiungiVoce = () => {
    setFormData({
      ...formData,
      voci: [...formData.voci, { descrizione: '', quantita: 1, prezzoUnitario: 0 }]
    });
  };

  const rimuoviVoce = (index: number) => {
    const nuoveVoci = formData.voci.filter((_, i) => i !== index);
    setFormData({ ...formData, voci: nuoveVoci });
  };

  const aggiornaVoce = (index: number, campo: string, valore: any) => {
    const nuoveVoci = [...formData.voci];
    nuoveVoci[index] = { ...nuoveVoci[index], [campo]: valore };
    setFormData({ ...formData, voci: nuoveVoci });
  };

  const calcolaTotale = () => {
    return formData.voci.reduce((sum, voce) => {
      const subtotale = voce.quantita * voce.prezzoUnitario;
      const totaleConIva = subtotale * (1 + formData.aliquotaIva / 100);
      return sum + totaleConIva;
    }, 0);
  };

  const resetForm = () => {
    setFormData({
      clienteId: '',
      titolo: '',
      descrizione: '',
      dataScadenza: '',
      note: '',
      aliquotaIva: 22,
      voci: [{ descrizione: '', quantita: 1, prezzoUnitario: 0 }]
    });
  };

  const handleStampa = async (preventivo: any) => {
    try {
      // Carica le impostazioni
      const res = await fetch('/api/impostazioni');
      if (!res.ok) throw new Error('Errore nel caricamento delle impostazioni');
      const impostazioni = await res.json();

      // Genera PDF con firma
      await generatePreventivoPDF(preventivo, impostazioni);
      setToast({ message: 'PDF generato! Usa il download per stampare.', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleExportPDF = async (preventivo: any) => {
    try {
      // Carica le impostazioni
      const res = await fetch('/api/impostazioni');
      if (!res.ok) throw new Error('Errore nel caricamento delle impostazioni');
      const impostazioni = await res.json();

      // Genera PDF
      await generatePreventivoPDF(preventivo, impostazioni);
      setToast({ message: 'PDF generato con successo!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const getStatoBadge = (stato: string) => {
    const badges: any = {
      bozza: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Bozza' },
      inviato: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Inviato' },
      accettato: { bg: 'bg-green-100', text: 'text-green-800', label: 'Accettato' },
      rifiutato: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rifiutato' },
      scaduto: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Scaduto' }
    };
    const badge = badges[stato] || badges.bozza;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const stats = {
    totale: preventivi.length,
    bozza: preventivi.filter(p => p.stato === 'bozza').length,
    inviati: preventivi.filter(p => p.stato === 'inviato').length,
    accettati: preventivi.filter(p => p.stato === 'accettato').length
  };

  return (
    <DashboardLayout title="Preventivi">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestisci i preventivi per i clienti</h2>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Nuovo Preventivo
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Totale</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totale}</p>
              </div>
              <FileText className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Bozze</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.bozza}</p>
              </div>
              <FileText className="w-12 h-12 text-gray-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Inviati</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.inviati}</p>
              </div>
              <Send className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Accettati</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.accettati}</p>
              </div>
              <Check className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filtri */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <select
            value={filtroStato}
            onChange={(e) => setFiltroStato(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="tutti">📋 Tutti gli stati</option>
            <option value="bozza">📝 Bozze</option>
            <option value="inviato">📤 Inviati</option>
            <option value="accettato">✅ Accettati</option>
            <option value="rifiutato">❌ Rifiutati</option>
            <option value="scaduto">⏰ Scaduti</option>
          </select>
        </div>

        {/* Lista Preventivi */}
        <div className="grid grid-cols-1 gap-6">
          {preventivi.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nessun preventivo trovato</p>
            </div>
          ) : (
            preventivi.map((preventivo) => (
              <div key={preventivo.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{preventivo.numeroPreventivo}</h3>
                    <p className="text-gray-600 mt-1">{preventivo.titolo}</p>
                  </div>
                  {getStatoBadge(preventivo.stato)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">{preventivo.cliente.nome} {preventivo.cliente.cognome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Euro className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700 font-semibold">€{preventivo.importoTotale.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {preventivo.stato === 'bozza' && (
                    <button
                      onClick={() => handleCambiaStato(preventivo.id, 'inviato')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Invia
                    </button>
                  )}
                  {preventivo.stato === 'inviato' && (
                    <>
                      <button
                        onClick={() => handleCambiaStato(preventivo.id, 'accettato')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Accetta
                      </button>
                      <button
                        onClick={() => handleCambiaStato(preventivo.id, 'rifiutato')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Rifiuta
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleStampa(preventivo)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Stampa
                  </button>
                  <button
                    onClick={() => handleExportPDF(preventivo)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Esporta PDF
                  </button>
                  <button
                    onClick={() => handleElimina(preventivo.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Elimina
                  </button>
                  {(preventivo.stato === 'accettato' || preventivo.stato === 'rifiutato' || preventivo.stato === 'scaduto') && (
                    <button
                      onClick={() => handleArchivia(preventivo.id)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      Archivia
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Nuovo Preventivo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">Nuovo Preventivo</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreaPreventivo} className="p-8 space-y-6">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <select
                  value={formData.clienteId}
                  onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Seleziona un cliente --</option>
                  {clienti.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome} {cliente.cognome} ({cliente.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Titolo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo *</label>
                <input
                  type="text"
                  value={formData.titolo}
                  onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Es: Riparazione carrozzeria"
                  required
                />
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea
                  value={formData.descrizione}
                  onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descrizione dettagliata del lavoro..."
                />
              </div>

              {/* Data Scadenza */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Scadenza</label>
                <input
                  type="date"
                  value={formData.dataScadenza}
                  onChange={(e) => setFormData({ ...formData, dataScadenza: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Aliquota IVA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">💰 Aliquota IVA *</label>
                <select
                  value={formData.aliquotaIva}
                  onChange={(e) => setFormData({ ...formData, aliquotaIva: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={22}>22% - IVA Ordinaria</option>
                  <option value={0}>0% - Esente IVA</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  L'IVA verrà applicata a tutte le voci del preventivo
                </p>
              </div>

              {/* Voci */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">Voci *</label>
                  <button
                    type="button"
                    onClick={aggiungiVoce}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Aggiungi Voce
                  </button>
                </div>

                {formData.voci.map((voce, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 mb-3">
                    <input
                      type="text"
                      value={voce.descrizione}
                      onChange={(e) => aggiornaVoce(index, 'descrizione', e.target.value)}
                      className="col-span-6 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Descrizione"
                      required
                    />
                    <input
                      type="number"
                      value={voce.quantita}
                      onChange={(e) => aggiornaVoce(index, 'quantita', parseFloat(e.target.value))}
                      className="col-span-2 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Qtà"
                      min="0.01"
                      step="0.01"
                      required
                    />
                    <input
                      type="number"
                      value={voce.prezzoUnitario}
                      onChange={(e) => aggiornaVoce(index, 'prezzoUnitario', parseFloat(e.target.value))}
                      className="col-span-3 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Prezzo €"
                      min="0"
                      step="0.01"
                      required
                    />
                    {formData.voci.length > 1 && (
                      <button
                        type="button"
                        onClick={() => rimuoviVoce(index)}
                        className="col-span-1 px-2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">
                    Totale: €{calcolaTotale().toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Note aggiuntive..."
                />
              </div>

              {/* Bottoni */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {loading ? 'Creazione...' : 'Crea Preventivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Componente Stampa (nascosto) */}
      {preventivoStampa && (
        <div ref={printRef} className="hidden print:block">
          <PrintPreventivo preventivo={preventivoStampa} />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white flex items-center gap-3 animate-slide-up z-50`}>
          {toast.type === 'success' ? <Check className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <p className="font-medium">{toast.message}</p>
          <button onClick={() => setToast(null)}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}

