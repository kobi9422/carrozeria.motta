'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Se l'utente è autenticato, reindirizza alla dashboard appropriata
        if (user.ruolo === 'admin') {
          router.push('/admin');
        } else {
          router.push('/employee');
        }
      } else {
        // Se non è autenticato, reindirizza al login
        router.push('/auth/login');
      }
    }
  }, [user, loading, router]);

  // Mostra loading durante la verifica dell'autenticazione
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Non mostrare nulla durante il redirect
  return null;
}
