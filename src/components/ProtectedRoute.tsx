'use client';

import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Se l'utente non è autenticato, reindirizza al login
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // Se è richiesto un ruolo specifico e l'utente non lo ha
      if (requiredRole && user.ruolo !== requiredRole) {
        // Reindirizza alla dashboard appropriata
        if (user.ruolo === 'admin') {
          router.push('/admin');
        } else {
          router.push('/employee');
        }
        return;
      }
    }
  }, [user, loading, requiredRole, router, redirectTo]);

  // Mostra loading durante la verifica dell'autenticazione
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Se l'utente non è autenticato o non ha il ruolo richiesto, non mostrare nulla
  // (il redirect avverrà nell'useEffect)
  if (!user || (requiredRole && user.ruolo !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
