// app/page.jsx
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Aún cargando

    if (session) {
      // Si está autenticado, ir al dashboard
      router.push('/dashboard');
    } else {
      // Si no está autenticado, ir al login
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
              <span className="text-2xl">🎓</span>
            </div>
            <h1 className="text-2xl font-bold text-indigo-800 mb-2">Aprendizaje Bilingüe</h1>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
    );
  }

  return null; // Se redirigirá automáticamente
}