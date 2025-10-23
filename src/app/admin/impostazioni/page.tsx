'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Settings, Building2, CreditCard, FileText, Save, AlertCircle, Download, Database, Signature, Upload, X } from 'lucide-react';

export default function ImpostazioniPage() {
  return (
    <ProtectedRoute requireAdmin>
      <ImpostazioniContent />
    </ProtectedRoute>
  );
}

function ImpostazioniContent() {
  const [impostazioni, setImpostazioni] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchImpostazioni();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchImpostazioni = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/impostazioni');
      if (!res.ok) throw new Error('Errore nel caricamento delle impostazioni');
      const data = await res.json();
      setImpostazioni(data);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/impostazioni', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(impostazioni)
      });

      if (!res.ok) throw new Error('Errore nel salvataggio delle impostazioni');
      
      setToast({ message: 'Impostazioni salvate con successo!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setImpostazioni({ ...impostazioni, [field]: value });
  };

  const handleBackup = async () => {
    try {
      setBackingUp(true);
      const res = await fetch('/api/backup');
      if (!res.ok) throw new Error('Errore nel backup del database');

      // Scarica il file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carrozzeria-motta-backup-${new Date().toISOString().slice(0, 10)}.db`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setToast({ message: 'Backup completato con successo!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setBackingUp(false);
    }
  };

  const handleUploadFirma = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload-firma', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Errore nel caricamento della firma');
      const data = await res.json();

      setImpostazioni({ ...impostazioni, firmaUrl: data.firmaUrl });
      setToast({ message: 'Firma caricata con successo!', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  const handleRemoveFirma = () => {
    setImpostazioni({ ...impostazioni, firmaUrl: null });
    setToast({ message: 'Firma rimossa', type: 'success' });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Caricamento impostazioni...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="w-8 h-8 text-purple-600" />
              Impostazioni
            </h1>
            <p className="text-gray-600 mt-1">Configura i dati aziendali e le preferenze del sistema</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </div>

        {/* Dati Azienda */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Dati Azienda
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Azienda *</label>
              <input
                type="text"
                value={impostazioni?.nomeAzienda || ''}
                onChange={(e) => handleChange('nomeAzienda', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Carrozzeria Motta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA</label>
              <input
                type="text"
                value={impostazioni?.partitaIva || ''}
                onChange={(e) => handleChange('partitaIva', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="IT12345678901"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale</label>
              <input
                type="text"
                value={impostazioni?.codiceFiscale || ''}
                onChange={(e) => handleChange('codiceFiscale', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="MTTGNN80A01H501Z"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input
                type="tel"
                value={impostazioni?.telefono || ''}
                onChange={(e) => handleChange('telefono', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+39 123 456 7890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={impostazioni?.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="info@carrozzeriamotta.it"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
              <input
                type="text"
                value={impostazioni?.indirizzo || ''}
                onChange={(e) => handleChange('indirizzo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Via Roma 123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
              <input
                type="text"
                value={impostazioni?.citta || ''}
                onChange={(e) => handleChange('citta', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Milano"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
              <input
                type="text"
                value={impostazioni?.cap || ''}
                onChange={(e) => handleChange('cap', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="20100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <input
                type="text"
                value={impostazioni?.provincia || ''}
                onChange={(e) => handleChange('provincia', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="MI"
                maxLength={2}
              />
            </div>
          </div>
        </div>

        {/* Configurazione Fatture */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            Configurazione Fatture
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
              <input
                type="text"
                value={impostazioni?.iban || ''}
                onChange={(e) => handleChange('iban', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="IT60 X054 2811 1010 0000 0123 456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banca</label>
              <input
                type="text"
                value={impostazioni?.banca || ''}
                onChange={(e) => handleChange('banca', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Banca Intesa Sanpaolo"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Condizioni di Pagamento</label>
              <input
                type="text"
                value={impostazioni?.condizioniPagamento || ''}
                onChange={(e) => handleChange('condizioniPagamento', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Pagamento a 30 giorni"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note Legali Fattura</label>
              <textarea
                value={impostazioni?.noteLegaliFattura || ''}
                onChange={(e) => handleChange('noteLegaliFattura', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Es: Operazione non soggetta a IVA ai sensi dell'art. 1..."
              />
            </div>
          </div>
        </div>

        {/* Configurazione Preventivi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Configurazione Preventivi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validità Preventivi (giorni)</label>
              <input
                type="number"
                value={impostazioni?.validitaPreventivi || 30}
                onChange={(e) => handleChange('validitaPreventivi', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="1"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note Standard Preventivo</label>
              <textarea
                value={impostazioni?.noteStandardPreventivo || ''}
                onChange={(e) => handleChange('noteStandardPreventivo', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Es: Il preventivo è valido per 30 giorni dalla data di emissione..."
              />
            </div>
          </div>
        </div>

        {/* Firma Digitale */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Signature className="w-5 h-5 text-indigo-600" />
            Firma Digitale
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Carica la tua firma digitale. Apparirà automaticamente in fondo a tutti i preventivi e le fatture.
            </p>

            {impostazioni?.firmaUrl ? (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-3">Firma Attuale:</p>
                  <img
                    src={impostazioni.firmaUrl}
                    alt="Firma"
                    className="max-h-20 max-w-xs"
                  />
                </div>
                <button
                  onClick={handleRemoveFirma}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Rimuovi Firma
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Clicca per caricare la firma</span>
                    <span className="text-xs text-gray-500">PNG, JPG (max 5MB)</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadFirma}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Backup Database */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-green-600" />
            Backup Database
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Scarica una copia di backup del database SQLite. Il backup include tutti i dati: clienti, ordini, preventivi, fatture, dipendenti e impostazioni.
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackup}
                disabled={backingUp}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                {backingUp ? 'Download in corso...' : 'Scarica Backup'}
              </button>
              <div className="text-sm text-gray-500">
                <p>Ultimo backup: Mai</p>
                <p className="text-xs mt-1">Si consiglia di effettuare backup regolari</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 font-semibold">Informazioni Importanti</p>
              <p className="text-sm text-blue-700 mt-1">
                Le impostazioni configurate qui verranno utilizzate automaticamente nella generazione di preventivi e fatture.
                Assicurati di inserire dati corretti e completi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {toast.message}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

