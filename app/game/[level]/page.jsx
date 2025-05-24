// app/game/[level]/page.jsx

import LearningGame from '@/components/game/LearningGame';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Esta función se ejecuta en el servidor para obtener los datos necesarios
async function getGameData(cardSetId, userId) {
    try {
        // Obtener el conjunto de tarjetas
        const cardSet = await prisma.cardSet.findUnique({
            where: { id: cardSetId },
            include: {
                cards: {
                    orderBy: { difficulty: 'asc' }
                },
                course: true
            }
        });

        if (!cardSet) {
            return null;
        }

        // Obtener el estudiante actual (asumiendo que hay uno seleccionado)
        const student = await prisma.student.findFirst({
            where: { parentId: userId },
            include: {
                progress: {
                    where: {
                        card: {
                            cardSetId: cardSetId
                        }
                    }
                }
            }
        });

        return {
            cardSet,
            student,
            cards: cardSet.cards
        };
    } catch (error) {
        console.error('Error fetching game data:', error);
        return null;
    }
}

// Componente de página principal - CORREGIDO PARA NEXT.JS 15
export default async function GamePage({ params }) {
    const session = await getServerSession(authOptions);

    // Verificar autenticación
    if (!session) {
        redirect('/login');
    }

    // ARREGLAR: Await params antes de usar
    const resolvedParams = await params;
    const cardSetId = resolvedParams.level; // El parámetro [level] contiene el ID del conjunto

    // Obtener datos del juego
    const gameData = await getGameData(cardSetId, session.user.id);

    if (!gameData || !gameData.cardSet) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-100 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
                    <p className="text-gray-600 mb-4">
                        No se pudo encontrar el conjunto de tarjetas solicitado.
                    </p>
                    <a
                        href="/dashboard"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                        Volver al Dashboard
                    </a>
                </div>
            </div>
        );
    }

    if (!gameData.student) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-100 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <h1 className="text-xl font-bold text-orange-600 mb-4">Sin Estudiante</h1>
                    <p className="text-gray-600 mb-4">
                        Necesitas crear un perfil de estudiante antes de jugar.
                    </p>
                    <a
                        href="/dashboard"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                        Ir al Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return (
        <LearningGame
            cardSet={gameData.cardSet}
            student={gameData.student}
            initialCards={gameData.cards}
        />
    );
}

// Metadatos de la página - TAMBIÉN CORREGIDO
export async function generateMetadata({ params }) {
    // ARREGLAR: Await params antes de usar
    const resolvedParams = await params;
    const cardSetId = resolvedParams.level;

    try {
        const cardSet = await prisma.cardSet.findUnique({
            where: { id: cardSetId },
            select: { name: true, description: true }
        });

        if (cardSet) {
            return {
                title: `Juego: ${cardSet.name}`,
                description: cardSet.description || 'Aprende nuevas palabras jugando'
            };
        }
    } catch (error) {
        console.error('Error generating metadata:', error);
    }

    return {
        title: 'Juego de Aprendizaje',
        description: 'Aprende nuevas palabras jugando'
    };
}