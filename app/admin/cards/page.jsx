// app/admin/cards/page.jsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import CardManager from '@/components/admin/CardManager';

export const metadata = {
    title: 'Administración de Tarjetas - Aprendizaje Bilingüe',
    description: 'Panel de administración para gestionar tarjetas educativas'
};

export default async function AdminCardsPage() {
    const session = await getServerSession(authOptions);

    // Verificar autenticación
    if (!session) {
        redirect('/login');
    }

    // Verificar permisos de administrador o profesor
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header de administración */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                            <p className="text-sm text-gray-600">Gestión de tarjetas educativas</p>
                        </div>
                        <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bienvenido, {session.user.name}
              </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {session.user.role === 'ADMIN' ? 'Administrador' : 'Profesor'}
              </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navegación de administración */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        <a
                            href="/admin/cards"
                            className="border-b-2 border-indigo-500 py-2 px-1 text-sm font-medium text-indigo-600"
                        >
                            Tarjetas
                        </a>
                        <a
                            href="/admin/courses"
                            className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Cursos
                        </a>
                        <a
                            href="/admin/students"
                            className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Estudiantes
                        </a>
                        <a
                            href="/admin/achievements"
                            className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Logros
                        </a>
                        <a
                            href="/dashboard"
                            className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Volver al Dashboard
                        </a>
                    </div>
                </div>
            </nav>

            {/* Contenido principal */}
            <main className="max-w-7xl mx-auto py-6">
                <CardManager />
            </main>
        </div>
    );
}