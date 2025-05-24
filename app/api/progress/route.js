// /app/api/progress/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/progress - Obtener progreso del estudiante
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const cardId = searchParams.get('cardId');
    const cardSetId = searchParams.get('cardSetId');

    if (!studentId) {
        return NextResponse.json(
            { error: 'Se requiere el ID del estudiante' },
            { status: 400 }
        );
    }

    try {
        // Verificar que el estudiante exists y pertenece al usuario
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { parent: true },
        });

        if (!student) {
            return NextResponse.json(
                { error: 'Estudiante no encontrado' },
                { status: 404 }
            );
        }

        // Verificar permisos
        if (
            student.parentId !== session.user.id &&
            session.user.role !== 'ADMIN' &&
            session.user.role !== 'TEACHER'
        ) {
            return NextResponse.json(
                { error: 'No tienes permisos para ver este progreso' },
                { status: 403 }
            );
        }

        let progressQuery = {
            where: { studentId },
            include: {
                card: {
                    include: {
                        cardSet: true
                    }
                },
            },
            orderBy: {
                lastAttempted: 'desc'
            }
        };

        // Filtrar por tarjeta específica si se proporciona
        if (cardId) {
            progressQuery.where.cardId = cardId;
        }

        // Filtrar por conjunto de tarjetas si se proporciona
        if (cardSetId) {
            progressQuery.where.card = {
                cardSetId: cardSetId
            };
        }

        // Obtener el progreso
        const progress = await prisma.progress.findMany(progressQuery);

        // 🔥 FIX PRINCIPAL: Calcular estadísticas correctamente
        let totalCards = 0;
        let availableCardSets = [];

        if (cardSetId) {
            // Si se especifica un cardSet, contar solo esas tarjetas
            totalCards = await prisma.card.count({
                where: { cardSetId }
            });
        } else {
            // Obtener conjuntos de tarjetas basados en el curso del estudiante
            let cardSetQuery = {};

            if (student.courseId) {
                // Si el estudiante tiene un curso asignado, obtener solo esos cardSets
                cardSetQuery.courseId = student.courseId;
            }
            // Si no tiene curso, obtener todos los cardSets (o podrías filtrar de otra manera)

            availableCardSets = await prisma.cardSet.findMany({
                where: cardSetQuery,
                include: {
                    _count: {
                        select: { cards: true }
                    }
                }
            });

            totalCards = availableCardSets.reduce((sum, set) => sum + set._count.cards, 0);
        }

        // Calcular estadísticas mejoradas
        const masteredCards = progress.filter(p => p.mastered).length;
        const cardsWithProgress = progress.length; // Tarjetas que han sido intentadas
        const totalAttempts = progress.reduce((sum, p) => sum + p.attempts, 0);
        const totalSuccess = progress.reduce((sum, p) => sum + p.successCount, 0);

        // 🔥 NUEVO: Calcular progreso basado en éxitos, no solo mastered
        const cardsWithSuccess = progress.filter(p => p.successCount > 0).length;

        // Diferentes tipos de porcentaje para mostrar
        const masteryPercentage = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
        const attemptPercentage = totalCards > 0 ? Math.round((cardsWithProgress / totalCards) * 100) : 0;
        const successPercentage = totalCards > 0 ? Math.round((cardsWithSuccess / totalCards) * 100) : 0;

        // 🔥 NUEVO: Estadísticas detalladas por conjunto de tarjetas
        const cardSetStats = {};
        if (!cardSetId) {
            for (const set of availableCardSets) {
                const setProgress = progress.filter(p => p.card.cardSetId === set.id);
                const setMastered = setProgress.filter(p => p.mastered).length;
                const setAttempted = setProgress.length;
                const setSuccess = setProgress.filter(p => p.successCount > 0).length;

                cardSetStats[set.id] = {
                    name: set.name,
                    totalCards: set._count.cards,
                    attempted: setAttempted,
                    withSuccess: setSuccess,
                    mastered: setMastered,
                    percentage: set._count.cards > 0 ? Math.round((setSuccess / set._count.cards) * 100) : 0
                };
            }
        }

        console.log('📊 Progress Debug:', {
            studentId,
            totalCards,
            masteredCards,
            cardsWithProgress,
            cardsWithSuccess,
            masteryPercentage,
            successPercentage
        });

        return NextResponse.json({
            progress,
            stats: {
                totalCards,
                mastered: masteredCards,
                attempted: cardsWithProgress,
                withSuccess: cardsWithSuccess, // 🔥 NUEVO
                totalAttempts,
                totalSuccess,
                // 🔥 CAMBIO: Usar successPercentage en lugar de masteryPercentage
                percentage: successPercentage,
                masteryPercentage, // Mantener para referencia
                attemptPercentage,
                successPercentage,
            },
            cardSetStats, // 🔥 NUEVO: Estadísticas por conjunto
        });
    } catch (error) {
        console.error('Error fetching progress:', error);
        return NextResponse.json(
            { error: 'Error al obtener progreso' },
            { status: 500 }
        );
    }
}

// POST /api/progress - Registrar progreso del estudiante
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { studentId, cardId, success } = body;

        // Validar datos requeridos
        if (!studentId || !cardId) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos' },
                { status: 400 }
            );
        }

        // Verificar que el estudiante existe y pertenece al usuario
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { parent: true },
        });

        if (!student) {
            return NextResponse.json(
                { error: 'Estudiante no encontrado' },
                { status: 404 }
            );
        }

        // Verificar permisos
        if (
            student.parentId !== session.user.id &&
            session.user.role !== 'ADMIN' &&
            session.user.role !== 'TEACHER'
        ) {
            return NextResponse.json(
                { error: 'No tienes permisos para registrar progreso' },
                { status: 403 }
            );
        }

        // Verificar que la tarjeta existe
        const card = await prisma.card.findUnique({
            where: { id: cardId },
        });

        if (!card) {
            return NextResponse.json(
                { error: 'Tarjeta no encontrada' },
                { status: 404 }
            );
        }

        // Buscar progreso existente o crear uno nuevo
        let progress = await prisma.progress.findFirst({
            where: {
                studentId,
                cardId,
            },
        });

        if (progress) {
            // Actualizar progreso existente
            const newSuccessCount = success ? progress.successCount + 1 : progress.successCount;

            progress = await prisma.progress.update({
                where: { id: progress.id },
                data: {
                    attempts: progress.attempts + 1,
                    successCount: newSuccessCount,
                    lastAttempted: new Date(),
                    // 🔥 MEJORADO: Lógica más flexible para mastery
                    mastered: newSuccessCount >= 2, // 2 éxitos para considerar dominada
                },
            });

            console.log('📝 Progress Updated:', {
                cardId,
                studentId,
                attempts: progress.attempts,
                successCount: progress.successCount,
                mastered: progress.mastered
            });
        } else {
            // Crear nuevo registro de progreso
            progress = await prisma.progress.create({
                data: {
                    studentId,
                    cardId,
                    attempts: 1,
                    successCount: success ? 1 : 0,
                    lastAttempted: new Date(),
                    mastered: false, // Nunca mastered en el primer intento
                },
            });

            console.log('📝 Progress Created:', {
                cardId,
                studentId,
                attempts: 1,
                successCount: success ? 1 : 0,
                mastered: false
            });
        }

        // Verificar si se han desbloqueado logros
        await checkAndUnlockAchievements(studentId);

        return NextResponse.json(progress, { status: 201 });
    } catch (error) {
        console.error('Error saving progress:', error);
        return NextResponse.json(
            { error: 'Error al guardar progreso' },
            { status: 500 }
        );
    }
}

// Función para verificar y desbloquear logros
async function checkAndUnlockAchievements(studentId) {
    try {
        // Obtener todos los logros disponibles
        const achievements = await prisma.achievement.findMany();

        // Obtener estadísticas del estudiante
        const studentProgress = await prisma.progress.findMany({
            where: { studentId },
        });

        const totalAttempts = studentProgress.reduce((sum, p) => sum + p.attempts, 0);
        const totalSuccess = studentProgress.reduce((sum, p) => sum + p.successCount, 0);
        const masteredCards = studentProgress.filter(p => p.mastered).length;

        // Obtener los logros actuales del estudiante
        const studentAchievements = await prisma.student.findUnique({
            where: { id: studentId },
            include: { achievements: true },
        });

        const unlockedAchievementIds = studentAchievements.achievements.map(a => a.id);

        // Verificar cada logro
        for (const achievement of achievements) {
            // Evitar procesar logros ya desbloqueados
            if (unlockedAchievementIds.includes(achievement.id)) {
                continue;
            }

            let unlockAchievement = false;

            // Verificar tipo de logro
            switch (achievement.type) {
                case 'attempts':
                    unlockAchievement = totalAttempts >= achievement.threshold;
                    break;
                case 'success':
                    unlockAchievement = totalSuccess >= achievement.threshold;
                    break;
                case 'mastery':
                    unlockAchievement = masteredCards >= achievement.threshold;
                    break;
            }

            if (unlockAchievement) {
                // Desbloquear logro
                await prisma.student.update({
                    where: { id: studentId },
                    data: {
                        achievements: {
                            connect: { id: achievement.id },
                        },
                    },
                });

                console.log('🏆 Achievement Unlocked:', {
                    studentId,
                    achievementId: achievement.id,
                    type: achievement.type,
                    threshold: achievement.threshold
                });
            }
        }
    } catch (error) {
        console.error('Error checking achievements:', error);
    }
}