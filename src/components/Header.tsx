'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Search, X, User, Wrench, Car } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

interface SearchResult {
  type: 'cliente' | 'ordine' | 'veicolo';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

interface Notifica {
  id: string;
  tipo: string;
  priorita: 'alta' | 'media' | 'bassa';
  titolo: string;
  messaggio: string;
  url: string;
  data: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifiche
  const [notifiche, setNotifiche] = useState<Notifica[]>([]);
  const [showNotifiche, setShowNotifiche] = useState(false);
  const [notificheCritiche, setNotificheCritiche] = useState(0);
  const notificheRef = useRef<HTMLDivElement>(null);

  // Carica notifiche (solo per admin)
  useEffect(() => {
    if (isAdmin) {
      fetchNotifiche();
      const interval = setInterval(fetchNotifiche, 60000); // Aggiorna ogni minuto
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const fetchNotifiche = async () => {
    try {
      const res = await fetch('/api/notifiche');
      if (res.ok) {
        const data = await res.json();
        setNotifiche(data.notifiche || []);
        setNotificheCritiche(data.critiche || 0);
      }
    } catch (error) {
      console.error('Errore nel caricamento notifiche:', error);
    }
  };

  // Chiudi risultati quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (notificheRef.current && !notificheRef.current.contains(event.target as Node)) {
        setShowNotifiche(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ricerca in tempo reale
  useEffect(() => {
    const searchData = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      try {
        const [clientiRes, ordiniRes, veicoliRes] = await Promise.all([
          fetch('/api/clienti'),
          fetch('/api/ordini'),
          fetch('/api/veicoli')
        ]);

        const clienti = clientiRes.ok ? await clientiRes.json() : [];
        const ordini = ordiniRes.ok ? await ordiniRes.json() : [];
        const veicoli = veicoliRes.ok ? await veicoliRes.json() : [];

        const results: SearchResult[] = [];

        // Cerca nei clienti
        clienti
          .filter((c: any) =>
            c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.cognome.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.telefono?.includes(searchQuery)
          )
          .slice(0, 5)
          .forEach((c: any) => {
            results.push({
              type: 'cliente',
              id: c.id,
              title: `${c.nome} ${c.cognome}`,
              subtitle: c.email || c.telefono || '',
              url: '/admin/clienti'
            });
          });

        // Cerca negli ordini
        ordini
          .filter((o: any) =>
            o.numeroOrdine.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.descrizione.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.cliente?.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.cliente?.cognome.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 5)
          .forEach((o: any) => {
            results.push({
              type: 'ordine',
              id: o.id,
              title: o.numeroOrdine,
              subtitle: `${o.cliente?.nome} ${o.cliente?.cognome} - ${o.descrizione.substring(0, 40)}...`,
              url: '/admin/ordini-lavoro'
            });
          });

        // Cerca nei veicoli
        veicoli
          .filter((v: any) =>
            v.targa.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.marca.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.modello.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 5)
          .forEach((v: any) => {
            results.push({
              type: 'veicolo',
              id: v.id,
              title: `${v.marca} ${v.modello}`,
              subtitle: v.targa,
              url: '/admin/clienti'
            });
          });

        setSearchResults(results);
        setShowResults(results.length > 0);
      } catch (error) {
        console.error('Errore nella ricerca:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchData, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleResultClick = (url: string) => {
    router.push(url);
    setSearchQuery('');
    setShowResults(false);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'cliente': return <User className="w-4 h-4 text-blue-600" />;
      case 'ordine': return <Wrench className="w-4 h-4 text-green-600" />;
      case 'veicolo': return <Car className="w-4 h-4 text-purple-600" />;
      default: return null;
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <Menu className="h-6 w-6" />
          </button>

          {title && (
            <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-gray-900">
              {title}
            </h1>
          )}
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-lg mx-8" ref={searchRef}>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Cerca clienti, ordini, veicoli..."
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowResults(false);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}

            {/* Risultati Ricerca */}
            {showResults && (
              <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>Ricerca in corso...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}-${index}`}
                        onClick={() => handleResultClick(result.url)}
                        className="w-full px-4 py-3 hover:bg-gray-50 flex items-start gap-3 text-left transition-colors"
                      >
                        <div className="mt-1">{getResultIcon(result.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {result.subtitle}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 capitalize mt-1">
                          {result.type}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <p>Nessun risultato trovato</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications (solo admin) */}
          {isAdmin && (
            <div className="relative" ref={notificheRef}>
              <button
                onClick={() => setShowNotifiche(!showNotifiche)}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md relative"
              >
                <Bell className="h-6 w-6" />
                {/* Notification badge */}
                {notificheCritiche > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {notificheCritiche > 9 ? '9+' : notificheCritiche}
                  </span>
                )}
              </button>

              {/* Dropdown Notifiche */}
              {showNotifiche && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifiche</h3>
                    <p className="text-xs text-gray-500">{notifiche.length} notifich{notifiche.length === 1 ? 'a' : 'e'}</p>
                  </div>
                  {notifiche.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {notifiche.map((notifica) => (
                        <button
                          key={notifica.id}
                          onClick={() => {
                            router.push(notifica.url);
                            setShowNotifiche(false);
                          }}
                          className={`w-full p-4 hover:bg-gray-50 text-left transition-colors ${
                            notifica.priorita === 'alta' ? 'bg-red-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 w-2 h-2 rounded-full ${
                              notifica.priorita === 'alta' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {notifica.titolo}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {notifica.messaggio}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Nessuna notifica</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User info */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.nome} {user?.cognome}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.ruolo === 'admin' ? 'Amministratore' : 'Dipendente'}
              </p>
            </div>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">
                {user?.nome?.charAt(0)}{user?.cognome?.charAt(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
