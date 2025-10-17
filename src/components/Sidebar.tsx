'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import {
  Users,
  Car,
  Wrench,
  Calendar,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Home,
  UserCog,
  Archive
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect alla pagina di login dopo il logout
      router.push('/auth/login');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  const adminMenuItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: Home,
      description: 'Panoramica generale'
    },
    {
      name: 'Dashboard Live',
      href: '/admin/dashboard-live',
      icon: BarChart3,
      description: 'Monitoraggio in tempo reale'
    },
    {
      name: 'Clienti',
      href: '/admin/clienti',
      icon: Users,
      description: 'Gestione clienti'
    },
    {
      name: 'Ordini di Lavoro',
      href: '/admin/ordini-lavoro',
      icon: Wrench,
      description: 'Gestione ordini e riparazioni'
    },
    {
      name: 'Calendario',
      href: '/admin/calendario',
      icon: Calendar,
      description: 'Pianificazione appuntamenti'
    },
    {
      name: 'Preventivi',
      href: '/admin/preventivi',
      icon: FileText,
      description: 'Gestione preventivi'
    },
    {
      name: 'Fatture',
      href: '/admin/fatture',
      icon: Receipt,
      description: 'Gestione fatture'
    },
    {
      name: 'Dipendenti',
      href: '/admin/dipendenti',
      icon: UserCog,
      description: 'Gestione dipendenti'
    },
    {
      name: 'Archivio',
      href: '/admin/archivio',
      icon: Archive,
      description: 'Lavori archiviati'
    },
    {
      name: 'Statistiche',
      href: '/admin/statistiche',
      icon: BarChart3,
      description: 'Report e analisi'
    },
    {
      name: 'Impostazioni',
      href: '/admin/impostazioni',
      icon: Settings,
      description: 'Configurazione sistema'
    }
  ];

  const employeeMenuItems = [
    {
      name: 'Dashboard',
      href: '/employee',
      icon: Home,
      description: 'Panoramica generale'
    },
    {
      name: 'I Miei Ordini',
      href: '/employee/ordini',
      icon: Wrench,
      description: 'Ordini di lavoro assegnati'
    }
  ];

  const menuItems = isAdmin ? adminMenuItems : employeeMenuItems;

  return (
    <>
      {/* Overlay per mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">CM</span>
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900">
                Carrozzeria Motta
              </span>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">
                  {user?.nome?.charAt(0)}{user?.cognome?.charAt(0)}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.nome} {user?.cognome}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.ruolo === 'admin' ? 'Amministratore' : 'Dipendente'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => {
                    // Chiudi sidebar su mobile dopo il click
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  <div className="flex-1">
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-600">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
