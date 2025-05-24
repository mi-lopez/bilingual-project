// app/login/page.jsx

'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    // Verificar si ya está autenticado
    useEffect(() => {
        const checkSession = async () => {
            const session = await getSession();
            if (session) {
                router.push(callbackUrl);
            }
        };
        checkSession();
    }, [router, callbackUrl]);

    // Manejar inicio de sesión
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
            } else {
                router.push(callbackUrl);
            }
        } catch (error) {
            setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    // Manejar registro
    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            });

            if (response.ok) {
                // Registro exitoso, ahora iniciar sesión automáticamente
                const result = await signIn('credentials', {
                    email,
                    password,
                    redirect: false,
                });

                if (result?.error) {
                    setError('Cuenta creada, pero error al iniciar sesión. Por favor, inicia sesión manualmente.');
                } else {
                    router.push(callbackUrl);
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Error al crear la cuenta.');
            }
        } catch (error) {
            setError('Error al crear la cuenta. Por favor, intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">🎓</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Aprendizaje Bilingüe
                    </h1>
                    <p className="text-gray-600">
                        {isRegistering
                            ? 'Crea tu cuenta para comenzar el viaje de aprendizaje'
                            : 'Inicia sesión para continuar tu aventura de aprendizaje'
                        }
                    </p>
                </motion.div>

                {/* Formulario */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-xl p-8"
                >
                    <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
                        {/* Mostrar errores */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Campo de nombre (solo para registro) */}
                        {isRegistering && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre completo
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                    placeholder="Tu nombre completo"
                                />
                            </div>
                        )}

                        {/* Campo de email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                placeholder="tu@email.com"
                            />
                        </div>

                        {/* Campo de contraseña */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                    placeholder="Tu contraseña"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            {isRegistering && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Mínimo 6 caracteres
                                </p>
                            )}
                        </div>

                        {/* Botón de envío */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <FaSpinner className="animate-spin mr-2" />
                                    {isRegistering ? 'Creando cuenta...' : 'Iniciando sesión...'}
                                </>
                            ) : (
                                isRegistering ? 'Crear cuenta' : 'Iniciar sesión'
                            )}
                        </button>
                    </form>

                    {/* Alternativas */}
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                                setEmail('');
                                setPassword('');
                                setName('');
                            }}
                            className="mt-4 w-full text-indigo-600 hover:text-indigo-700 font-medium py-2 transition duration-200"
                        >
                            {isRegistering
                                ? 'Iniciar sesión con cuenta existente'
                                : 'Crear nueva cuenta'
                            }
                        </button>
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mt-8 text-sm text-gray-500"
                >
                </motion.div>
            </div>
        </div>
    );
}