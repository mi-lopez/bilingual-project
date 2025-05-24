// components/dashboard/StudentDashboard.jsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaStar, FaTrophy, FaGamepad, FaChartBar } from 'react-icons/fa';

// Componente para seleccionar avatar del estudiante
const AvatarSelector = ({ selectedAvatar, onSelect }) => {
    const avatars = [
        '/avatars/boy1.jpg',
        '/avatars/boy2.jpeg',
        '/avatars/girl1.png',
        '/avatars/girl2.webp',
        '/avatars/cat1.jpg',
        '/avatars/dog1.jpg',
    ];

    return (
        <div className="grid grid-cols-3 gap-4">
            {avatars.map((avatar, index) => (
                <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`cursor-pointer rounded-lg p-2 border-2 ${
                        selectedAvatar === avatar
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200'
                    }`}
                    onClick={() => onSelect(avatar)}
                >
                    <div className="relative w-20 h-20 mx-auto">
                        <Image
                            src={avatar}
                            alt={`Avatar ${index + 1}`}
                            fill
                            className="object-contain"
                        />
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

// Componente de medallas/logros
const Achievements = ({ achievements }) => {
    return (
        <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <FaTrophy className="mr-2 text-yellow-500" /> Mis Logros
            </h3>

            {achievements.length === 0 ? (
                <p className="text-gray-500 text-sm">
                    ¡Completa actividades para ganar logros!
                </p>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    {achievements.map((achievement) => (
                        <div key={achievement.id} className="text-center">
                            <div className="relative w-12 h-12 mx-auto mb-1">
                                <Image
                                    src={achievement.imageUrl}
                                    alt={achievement.name}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <p className="text-xs font-medium">{achievement.name}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Componente principal del dashboard
const StudentDashboard = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [cardSets, setCardSets] = useState([]);
    const [studentProgress, setStudentProgress] = useState(null);
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [achievements, setAchievements] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fix para hidratación de Next.js
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Función para obtener valor de localStorage de forma segura
    const getStoredStudentId = useCallback(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('selectedStudentId');
        }
        return null;
    }, []);

    // Función para guardar en localStorage de forma segura
    const setStoredStudentId = useCallback((studentId) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('selectedStudentId', studentId);
        }
    }, []);

    // Verificar autenticación
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Función mejorada para cargar datos del estudiante
    const fetchStudentData = useCallback(async (studentId, student = null) => {
        if (!studentId) return;

        setIsLoading(true);
        try {
            // Usar Promise.all para cargar todos los datos en paralelo
            const [cardSetsResponse, progressResponse, achievementsResponse, leaderboardResponse] = await Promise.all([
                fetch(`/api/card-sets?studentId=${studentId}`),
                fetch(`/api/progress?studentId=${studentId}`),
                fetch(`/api/achievements?studentId=${studentId}`),
                // Usar el courseId del estudiante si está disponible
                fetch(`/api/leaderboard?courseId=${student?.courseId || ''}`)
            ]);

            // Procesar respuestas
            if (cardSetsResponse.ok) {
                const cardSetsData = await cardSetsResponse.json();
                setCardSets(cardSetsData);
            } else {
                setCardSets([]);
            }

            if (progressResponse.ok) {
                const progressData = await progressResponse.json();
                setStudentProgress(progressData);
            } else {
                setStudentProgress(null);
            }

            if (achievementsResponse.ok) {
                const achievementsData = await achievementsResponse.json();
                setAchievements(achievementsData);
            } else {
                setAchievements([]);
            }

            if (leaderboardResponse.ok) {
                const leaderboardData = await leaderboardResponse.json();
                setLeaderboard(leaderboardData.leaderboard || []);
            } else {
                setLeaderboard([]);
            }

            // Guardar el estudiante seleccionado en localStorage
            setStoredStudentId(studentId);
        } catch (error) {
            console.error('Error fetching student data:', error);
            // Establecer valores por defecto en caso de error
            setCardSets([]);
            setStudentProgress(null);
            setAchievements([]);
            setLeaderboard([]);
        } finally {
            setIsLoading(false);
        }
    }, [setStoredStudentId]);

    // Cargar estudiantes asociados con el usuario actual
    useEffect(() => {
        if (session?.user?.id && isClient) {
            const fetchStudents = async () => {
                try {
                    const response = await fetch(`/api/students?parentId=${session.user.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        setStudents(data);

                        // Si solo hay un estudiante, seleccionarlo automáticamente
                        if (data.length === 1) {
                            setSelectedStudent(data[0]);
                            await fetchStudentData(data[0].id, data[0]);
                        } else if (data.length > 1) {
                            // Si hay múltiples estudiantes, intentar cargar el guardado
                            const savedStudentId = getStoredStudentId();
                            if (savedStudentId) {
                                const savedStudent = data.find(s => s.id === savedStudentId);
                                if (savedStudent) {
                                    setSelectedStudent(savedStudent);
                                    await fetchStudentData(savedStudent.id, savedStudent);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching students:', error);
                }
            };

            fetchStudents();
        }
    }, [session, isClient, fetchStudentData, getStoredStudentId]);

    // Función para refrescar datos cuando se regresa del juego
    const refreshStudentData = useCallback(() => {
        if (selectedStudent) {
            fetchStudentData(selectedStudent.id, selectedStudent);
        }
    }, [selectedStudent, fetchStudentData]);

    // Escuchar cuando la ventana vuelve a estar en foco (usuario regresa del juego)
    useEffect(() => {
        const handleFocus = () => {
            refreshStudentData();
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                refreshStudentData();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [refreshStudentData]);

    // Crear un nuevo estudiante
    const handleCreateStudent = async () => {
        try {
            const studentName = prompt('Nombre del estudiante:');
            if (!studentName) return;

            const response = await fetch('/api/students', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: studentName,
                    parentId: session.user.id,
                }),
            });

            if (response.ok) {
                const newStudent = await response.json();
                setStudents([...students, newStudent]);
                setSelectedStudent(newStudent);
                setShowAvatarSelector(true);
            }
        } catch (error) {
            console.error('Error creating student:', error);
        }
    };

    // Actualizar avatar del estudiante
    const handleAvatarSelect = async (avatarUrl) => {
        try {
            const response = await fetch(`/api/students/${selectedStudent.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    avatarUrl,
                }),
            });

            if (response.ok) {
                const updatedStudent = await response.json();
                setSelectedStudent(updatedStudent);
                setStudents(students.map(s =>
                    s.id === updatedStudent.id ? updatedStudent : s
                ));
                setShowAvatarSelector(false);

                // Cargar datos del estudiante después de actualizar avatar
                await fetchStudentData(updatedStudent.id, updatedStudent);
            }
        } catch (error) {
            console.error('Error updating avatar:', error);
        }
    };

    // Manejar selección de estudiante
    const handleStudentSelect = async (student) => {
        setSelectedStudent(student);
        await fetchStudentData(student.id, student);
    };

    // Calcular estadísticas de progreso
    const calculateProgress = () => {
        if (!studentProgress) return { totalCards: 0, mastered: 0, withSuccess: 0, percentage: 0 };

        const totalCards = studentProgress.stats?.totalCards || 0;
        const mastered = studentProgress.stats?.mastered || 0;
        const withSuccess = studentProgress.stats?.withSuccess || 0;

        // 🔥 CAMBIO: Usar withSuccess para mostrar progreso más realista
        const percentage = studentProgress.stats?.successPercentage || 0;

        console.log('📊 Dashboard Progress:', {
            totalCards,
            mastered,
            withSuccess,
            percentage
        });

        return { totalCards, mastered, withSuccess, percentage };
    };

    if (status === 'loading' || !isClient) {
        return <div className="flex justify-center items-center h-screen">Cargando...</div>;
    }

    const { totalCards, mastered, withSuccess, percentage } = calculateProgress();

    // Si hay múltiples estudiantes y ninguno seleccionado, mostrar selector
    if (students.length > 1 && !selectedStudent) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-100 p-6">
                <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
                    <h2 className="text-xl font-bold text-center text-indigo-700 mb-6">
                        ¿Quién está aprendiendo hoy?
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        {students.map((student) => (
                            <motion.div
                                key={student.id}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="bg-white border border-indigo-100 rounded-lg p-4 cursor-pointer text-center hover:bg-indigo-50"
                                onClick={() => handleStudentSelect(student)}
                            >
                                <div className="relative w-20 h-20 mx-auto mb-2">
                                    <Image
                                        src={student.avatarUrl || '/avatars/default.png'}
                                        alt={student.name}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <p className="font-medium text-indigo-800">{student.name}</p>
                            </motion.div>
                        ))}

                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer text-center hover:bg-gray-50 flex flex-col items-center justify-center"
                            onClick={handleCreateStudent}
                        >
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                <span className="text-3xl text-gray-400">+</span>
                            </div>
                            <p className="font-medium text-gray-600">Agregar estudiante</p>
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }

    // Si no hay estudiantes, mostrar pantalla para crear uno
    if (students.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-100 p-6">
                <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 text-center">
                    <h2 className="text-xl font-bold text-indigo-700 mb-4">
                        ¡Bienvenido al Juego de Aprendizaje Bilingüe!
                    </h2>
                    <p className="mb-6 text-gray-600">
                        Para comenzar, necesitas crear un perfil para tu hijo/a.
                    </p>

                    <button
                        onClick={handleCreateStudent}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition"
                    >
                        Crear perfil de estudiante
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-100 p-4 md:p-6">
            {isLoading && (
                <div className="fixed top-4 right-4 bg-indigo-500 text-white px-4 py-2 rounded-lg z-50">
                    Actualizando datos...
                </div>
            )}

            {showAvatarSelector ? (
                <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
                    <h2 className="text-xl font-bold text-center text-indigo-700 mb-4">
                        Elige un avatar para {selectedStudent.name}
                    </h2>
                    <AvatarSelector
                        selectedAvatar={selectedStudent.avatarUrl}
                        onSelect={handleAvatarSelect}
                    />
                </div>
            ) : (
                <div className="max-w-4xl mx-auto">
                    {/* Header con información del estudiante */}
                    <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex items-center">
                        <div
                            className="relative w-16 h-16 rounded-full overflow-hidden cursor-pointer"
                            onClick={() => setShowAvatarSelector(true)}
                        >
                            <Image
                                src={selectedStudent?.avatarUrl || '/avatars/default.png'}
                                alt={selectedStudent?.name || 'Student'}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="ml-4">
                            <h1 className="text-xl font-bold text-indigo-800">{selectedStudent?.name}</h1>
                            <div className="flex items-center mt-1">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar
                                            key={i}
                                            className={`h-4 w-4 ${i < Math.ceil(percentage/20) ? 'text-yellow-400' : 'text-gray-300'}`}
                                        />
                                    ))}
                                </div>
                                <p className="ml-2 text-sm text-gray-600">
                                    Nivel {Math.ceil(percentage/20)} - {withSuccess} de {totalCards} palabras con progreso
                                </p>
                            </div>
                        </div>

                        {students.length > 1 && (
                            <button
                                className="ml-auto text-sm text-indigo-600 hover:text-indigo-800"
                                onClick={() => setSelectedStudent(null)}
                            >
                                Cambiar
                            </button>
                        )}
                    </div>

                    {/* Contenido principal */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Columna 1 - Conjuntos de tarjetas */}
                        <div className="md:col-span-2">
                            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                                <FaGamepad className="mr-2 text-indigo-500" /> Juegos disponibles
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {cardSets.length === 0 ? (
                                    <p className="text-gray-500">No hay conjuntos de tarjetas disponibles</p>
                                ) : (
                                    cardSets.map((cardSet) => (
                                        <Link
                                            href={`/game/${cardSet.id}`}
                                            key={cardSet.id}
                                        >
                                            <motion.div
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition"
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <h3 className="font-bold text-indigo-700">{cardSet.name}</h3>
                                                    <span className="bg-indigo-100 text-indigo-800 text-xs font-medium py-1 px-2 rounded">
                                                        Nivel {cardSet.level}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{cardSet.description}</p>
                                                <div className="mt-3 flex justify-between items-center">
                                                    <span className="text-xs text-gray-500">{cardSet.cardCount || 0} tarjetas</span>
                                                    {cardSet.progress && (
                                                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-green-500 rounded-full"
                                                                style={{ width: `${cardSet.progress}%` }}
                                                            ></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Columna 2 - Logros y clasificación */}
                        <div className="space-y-6">
                            {/* Logros */}
                            <Achievements achievements={achievements} />

                            {/* Leaderboard */}
                            <div className="bg-white rounded-xl shadow-md p-4">
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                                    <FaChartBar className="mr-2 text-blue-500" /> Clasificación
                                </h3>

                                <div className="space-y-2">
                                    {leaderboard.length === 0 ? (
                                        <p className="text-gray-500 text-sm">
                                            No hay suficientes datos para mostrar una clasificación
                                        </p>
                                    ) : (
                                        leaderboard.map((entry, index) => (
                                            <div
                                                key={entry.studentId}
                                                className={`flex items-center p-2 rounded-lg ${
                                                    entry.studentId === selectedStudent?.id
                                                        ? 'bg-indigo-50 border border-indigo-100'
                                                        : ''
                                                }`}
                                            >
                                                <span className="w-6 font-bold text-gray-500">#{index + 1}</span>
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                                                    <Image
                                                        src={entry.avatarUrl || '/avatars/default.png'}
                                                        alt={entry.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <span className="ml-2 font-medium truncate">
                                                    {entry.name}
                                                </span>
                                                <span className="ml-auto font-bold text-indigo-600">
                                                    {entry.score || 0}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Estadísticas rápidas */}
                            <div className="bg-white rounded-xl shadow-md p-4">
                                <h3 className="text-lg font-bold text-gray-800 mb-3">Progreso</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Con progreso</span>
                                        <span className="font-bold text-blue-600">{withSuccess}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Dominadas</span>
                                        <span className="font-bold text-green-600">{mastered}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total de palabras</span>
                                        <span className="font-bold text-gray-600">{totalCards}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-lg font-bold text-indigo-600">{percentage}%</span>
                                        <p className="text-xs text-gray-500">completado</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;