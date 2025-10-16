'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Modal } from '@/components/Modal';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Event {
  id: string;
  title: string;
  date: Date;
  type: 'ordine' | 'preventivo' | 'fattura';
  cliente?: string;
  url?: string;
}

export default function CalendarioPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [clienti, setClienti] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    titolo: '',
    tipo: 'appuntamento',
    data: '',
    ora: '',
    clienteId: '',
    note: ''
  });

  // Carica eventi e clienti dal database
  useEffect(() => {
    fetchEvents();
    fetchClienti();
  }, []);

  const fetchClienti = async () => {
    try {
      const res = await fetch('/api/clienti', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setClienti(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento clienti:', error);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const [ordiniRes, preventiviRes, fattureRes, eventiRes] = await Promise.all([
        fetch('/api/ordini', { credentials: 'include' }),
        fetch('/api/preventivi', { credentials: 'include' }),
        fetch('/api/fatture', { credentials: 'include' }),
        fetch('/api/eventi', { credentials: 'include' })
      ]);

      const ordini = ordiniRes.ok ? await ordiniRes.json() : [];
      const preventivi = preventiviRes.ok ? await preventiviRes.json() : [];
      const fatture = fattureRes.ok ? await fattureRes.json() : [];
      const eventiCustom = eventiRes.ok ? await eventiRes.json() : [];

      const allEvents: Event[] = [];

      // Eventi da ordini (data fine)
      ordini.forEach((ordine: any) => {
        if (ordine.dataFine) {
          allEvents.push({
            id: `ordine-${ordine.id}`,
            title: `${ordine.numeroOrdine} - ${ordine.cliente?.nome} ${ordine.cliente?.cognome}`,
            date: new Date(ordine.dataFine),
            type: 'ordine',
            cliente: `${ordine.cliente?.nome} ${ordine.cliente?.cognome}`,
            url: '/admin/ordini-lavoro'
          });
        }
      });

      // Eventi da preventivi (data scadenza)
      preventivi.forEach((preventivo: any) => {
        if (preventivo.dataScadenza) {
          allEvents.push({
            id: `preventivo-${preventivo.id}`,
            title: `Preventivo ${preventivo.numeroPreventivo} - ${preventivo.cliente?.nome} ${preventivo.cliente?.cognome}`,
            date: new Date(preventivo.dataScadenza),
            type: 'preventivo',
            cliente: `${preventivo.cliente?.nome} ${preventivo.cliente?.cognome}`,
            url: '/admin/preventivi'
          });
        }
      });

      // Eventi da fatture (data scadenza)
      fatture.forEach((fattura: any) => {
        if (fattura.dataScadenza) {
          allEvents.push({
            id: `fattura-${fattura.id}`,
            title: `Fattura ${fattura.numeroFattura} - ${fattura.cliente?.nome} ${fattura.cliente?.cognome}`,
            date: new Date(fattura.dataScadenza),
            type: 'fattura',
            cliente: `${fattura.cliente?.nome} ${fattura.cliente?.cognome}`,
            url: '/admin/fatture'
          });
        }
      });

      // Eventi personalizzati
      eventiCustom.forEach((evento: any) => {
        if (evento.dataInizio) {
          allEvents.push({
            id: `evento-${evento.id}`,
            title: evento.titolo,
            date: new Date(evento.dataInizio),
            type: evento.tipo,
            cliente: evento.cliente ? `${evento.cliente.nome} ${evento.cliente.cognome}` : undefined,
            url: undefined
          });
        }
      });

      setEvents(allEvents);
    } catch (error) {
      console.error('Errore nel caricamento eventi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/eventi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          titolo: formData.titolo,
          tipo: formData.tipo,
          dataInizio: formData.data + (formData.ora ? `T${formData.ora}:00` : 'T00:00:00'),
          clienteId: formData.clienteId || null,
          note: formData.note || null,
          tuttoIlGiorno: !formData.ora
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Errore nella creazione dell\'evento');
      }

      // Reset form
      setFormData({
        titolo: '',
        tipo: 'appuntamento',
        data: '',
        ora: '',
        clienteId: '',
        note: ''
      });

      setShowModal(false);
      fetchEvents(); // Ricarica eventi

      // Mostra messaggio di successo (opzionale)
      alert('Evento creato con successo!');
    } catch (error: any) {
      console.error('Errore nella creazione evento:', error);
      alert(error.message || 'Errore nella creazione dell\'evento');
    }
  };

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getEventsForDate = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const eventTypeColors: Record<string, string> = {
    ordine: 'bg-blue-500',
    preventivo: 'bg-orange-500',
    fattura: 'bg-green-500',
    appuntamento: 'bg-purple-500',
    scadenza: 'bg-red-500',
    altro: 'bg-gray-500'
  };

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
            <p className="text-gray-600 mt-1">Pianifica e gestisci gli appuntamenti</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Nuovo Evento
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Eventi Oggi</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Questa Settimana</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Questo Mese</p>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {/* Day Names */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const dayEvents = getEventsForDate(day);
                const isToday = 
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={day}
                    className={`aspect-square border rounded-lg p-2 cursor-pointer hover:bg-gray-50 ${
                      isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                  >
                    <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs text-white px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${eventTypeColors[event.type]}`}
                          title={event.title}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (event.url) router.push(event.url);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayEvents.length - 2} altri
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Legenda</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Ordini di Lavoro</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-600">Preventivi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Fatture</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm text-gray-600">Appuntamenti</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Scadenze</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm text-gray-600">Altri Eventi</span>
            </div>
          </div>
        </div>

        {/* Modal Nuovo Evento */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setFormData({
              titolo: '',
              tipo: 'appuntamento',
              data: '',
              ora: '',
              clienteId: '',
              note: ''
            });
          }}
          title="Nuovo Evento"
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titolo Evento *
              </label>
              <input
                type="text"
                required
                value={formData.titolo}
                onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Es: Riparazione Fiat Punto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Evento *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="appuntamento">Appuntamento</option>
                <option value="scadenza">Scadenza</option>
                <option value="altro">Altro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ora (opzionale)
              </label>
              <input
                type="time"
                value={formData.ora}
                onChange={(e) => setFormData({ ...formData, ora: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente (opzionale)
              </label>
              <select
                value={formData.clienteId}
                onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleziona cliente...</option>
                {clienti.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome} {cliente.cognome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note (opzionali)
              </label>
              <textarea
                rows={3}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Note aggiuntive..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    titolo: '',
                    tipo: 'appuntamento',
                    data: '',
                    ora: '',
                    clienteId: '',
                    note: ''
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Crea Evento
              </button>
            </div>
          </form>
        </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
