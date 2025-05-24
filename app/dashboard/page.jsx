// app/dashboard/page.jsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import StudentDashboard from '@/components/dashboard/StudentDashboard';

export const metadata = {
    title: 'Dashboard - Aprendizaje Bilingüe',
    description: 'Panel principal para estudiantes y padres'
};

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    // Verificar autenticación
    if (!session) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-100">
            {/* Header principal */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-indigo-800">
                                🎓 Aprendizaje Bilingüe
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Navegación */}
                            <nav className="hidden md:flex space-x-4">
                                <a
                                    href="/dashboard"
                                    className="text-indigo-600 hover:text-indigo-800 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Dashboard
                                </a>
                                {(session.user.role === 'ADMIN' || session.user.role === 'TEACHER') && (
                                    <a
                                        href="/admin/cards"
                                        className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Administrar
                                    </a>
                                )}
                            </nav>

                            {/* Usuario info */}
                            <div className="flex items-center space-x-2">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                                    <p className="text-xs text-gray-500">{session.user.email}</p>
                                </div>

                                {/* Dropdown menú (simplificado) */}
                                <div className="relative">
                                    <button className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900">
                                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            {session.user.name?.charAt(0).toUpperCase()}
                                        </div>
                                    </button>
                                    {/* Aquí puedes añadir un dropdown menu más adelante */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Contenido principal */}
            <main>
                <StudentDashboard />
            </main>

            {/* Footer opcional */}
            <footer className="bg-white border-t mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <p>&copy; 2025 Aprendizaje Bilingüe. Hecho con ❤️ para tu familia.</p>
                        <div className="flex space-x-4">
                            <a href="#" className="hover:text-gray-700">Ayuda</a>
                            <a href="#" className="hover:text-gray-700">Contacto</a>
                            <a href="/api/auth/signout" className="hover:text-gray-700">Cerrar Sesión</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}