// app/api/leaderboard/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/leaderboard - Obtener clasificación de estudiantes
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');
    const limit = parseInt(searchParams.get('limit')) || 10;
    const timeframe = searchParams.get('timeframe') || 'all'; // 'week', 'month', 'all'

    try {
        let whereClause = {};
        let dateFilter = {};

        // Filtrar por curso si se especifica
        if (courseId) {
            whereClause.courseId = courseId;
        }
        // Si es padre, mostrar solo estudiantes de sus hijos
        else if (session.user.role === 'PARENT') {
            whereClause.parentId = session.user.id;
        }
        // Si es teacher, mostrar estudiantes de sus cursos
        else if (session.user.role === 'TEACHER') {
            whereClause.course = {
                teacherId: session.user.id
            };
        }
        // Admin puede ver todos

        // Configurar filtro de tiempo para el progreso
        const now = new Date();
        switch (timeframe) {
            case 'week':
                dateFilter.lastAttempted = {
                    gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                };
                break;
            case 'month':
                dateFilter.lastAttempted = {
                    gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                };
                break;
            default:
                // Sin filtro de tiempo para 'all'
                break;
        }

        // Obtener estudiantes con su progreso
        const students = await prisma.student.findMany({
            where: whereClause,
            include: {
                parent: {
                    select: { id: true, name: true }
                },
                course: {
                    select: { id: true, name: true }
                },
                progress: {
                    where: dateFilter,
                    select: {
                        id: true,
                        attempts: true,
                        successCount: true,
                        mastered: true,
                        lastAttempted: true,
                        card: {
                            select: {
                                difficulty: true
                            }
                        }
                    }
                },
                achievements: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        threshold: true
                    }
                }
            }
        });

        // Calcular puntuaciones y estadísticas para cada estudiante
        const leaderboardEntries = students.map(student => {
            const progress = student.progress;

            // Calcular métricas básicas
            const totalAttempts = progress.reduce((sum, p) => sum + p.attempts, 0);
            const totalSuccess = progress.reduce((sum, p) => sum + p.successCount, 0);
            const masteredCards = progress.filter(p => p.mastered).length;

            // Calcular puntuación con bonificaciones
            let score = 0;

            // Puntos base por respuestas correctas
            score += totalSuccess * 10;

            // Bonus por tarjetas dominadas
            score += masteredCards * 50;

            // Bonus por dificultad de las tarjetas
            const difficultyBonus = progress.reduce((sum, p) => {
                if (p.mastered) {
                    return sum + (p.card.difficulty * 10);
                }
                return sum;
            }, 0);
            score += difficultyBonus;

            // Bonus por logros
            const achievementBonus = student.achievements.length * 25;
            score += achievementBonus;

            // Calcular precisión (accuracy)
            const accuracy = totalAttempts > 0 ? Math.round((totalSuccess / totalAttempts) * 100) : 0;

            // Calcular racha actual (streak)
            const recentProgress = progress
                .sort((a, b) => new Date(b.lastAttempted) - new Date(a.lastAttempted))
                .slice(0, 10); // Últimos 10 intentos

            let currentStreak = 0;
            for (const p of recentProgress) {
                if (p.successCount > 0 && p.attempts > 0) {
                    const lastAttemptSuccess = p.successCount / p.attempts >= 0.5; // 50% o más de éxito
                    if (lastAttemptSuccess) {
                        currentStreak++;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }

            return {
                studentId: student.id,
                name: student.name,
                avatarUrl: student.avatarUrl,
                parentName: student.parent?.name,
                courseName: student.course?.name,
                score,
                stats: {
                    totalAttempts,
                    totalSuccess,
                    masteredCards,
                    accuracy,
                    currentStreak,
                    achievementCount: student.achievements.length
                },
                lastActivity: progress.length > 0
                    ? new Date(Math.max(...progress.map(p => new Date(p.lastAttempted))))
                    : null
            };
        });

        // Ordenar por puntuación (descendente)
        leaderboardEntries.sort((a, b) => b.score - a.score);

        // Limitar resultados
        const limitedEntries = leaderboardEntries.slice(0, limit);

        // Agregar posición en el ranking
        const rankedEntries = limitedEntries.map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));

        // Obtener estadísticas globales
        const globalStats = {
            totalStudents: students.length,
            totalAttempts: leaderboardEntries.reduce((sum, entry) => sum + entry.stats.totalAttempts, 0),
            totalSuccess: leaderboardEntries.reduce((sum, entry) => sum + entry.stats.totalSuccess, 0),
            totalMastered: leaderboardEntries.reduce((sum, entry) => sum + entry.stats.masteredCards, 0),
            averageScore: leaderboardEntries.length > 0
                ? Math.round(leaderboardEntries.reduce((sum, entry) => sum + entry.score, 0) / leaderboardEntries.length)
                : 0
        };

        return NextResponse.json({
            leaderboard: rankedEntries,
            stats: globalStats,
            timeframe,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json(
            { error: 'Error al obtener clasificación' },
            { status: 500 }
        );
    }
}

// GET /api/leaderboard/student/:id - Obtener posición específica de un estudiante
export async function GET_STUDENT_RANK(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: studentId } = params;
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');

    try {
        // Verificar permisos para ver este estudiante
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { parent: true }
        });

        if (!student) {
            return NextResponse.json(
                { error: 'Estudiante no encontrado' },
                { status: 404 }
            );
        }

        if (
            student.parentId !== session.user.id &&
            session.user.role !== 'ADMIN' &&
            session.user.role !== 'TEACHER'
        ) {
            return NextResponse.json(
                { error: 'No tienes permisos para ver este estudiante' },
                { status: 403 }
            );
        }

        // Obtener el leaderboard completo para encontrar la posición
        const leaderboardResponse = await GET(new Request(`${request.url.split('?')[0]}?${courseId ? `courseId=${courseId}&` : ''}limit=1000`));
        const leaderboardData = await leaderboardResponse.json();

        // Encontrar la posición del estudiante
        const studentEntry = leaderboardData.leaderboard.find(entry => entry.studentId === studentId);

        if (!studentEntry) {
            return NextResponse.json(
                { error: 'Estudiante no encontrado en la clasificación' },
                { status: 404 }
            );
        }

        // Obtener estudiantes cercanos en el ranking (3 arriba y 3 abajo)
        const studentRank = studentEntry.rank;
        const startIndex = Math.max(0, studentRank - 4);
        const endIndex = Math.min(leaderboardData.leaderboard.length, studentRank + 3);

        const nearbyStudents = leaderboardData.leaderboard.slice(startIndex, endIndex);

        return NextResponse.json({
            student: studentEntry,
            nearby: nearbyStudents,
            totalStudents: leaderboardData.stats.totalStudents
        });

    } catch (error) {
        console.error('Error fetching student rank:', error);
        return NextResponse.json(
            { error: 'Error al obtener posición del estudiante' },
            { status: 500 }
        );
    }
}