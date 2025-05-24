import { Suspense } from 'react';
import LoginForm from './LoginForm';

// Componente de loading
function LoginLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">🎓</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Aprendizaje Bilingüe
                    </h1>
                    <p className="text-gray-600">
                        Cargando...
                    </p>
                </div>
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-12 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-12 bg-gray-200 rounded"></div>
                        <div className="h-12 bg-indigo-200 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginLoading />}>
            <LoginForm />
        </Suspense>
    );
}