// app/api/card-sets/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/card-sets - Obtener conjuntos de tarjetas
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');

    try {
        let whereClause = {};

        // Si se proporciona un studentId, filtrar por el curso del estudiante
        if (studentId) {
            const student = await prisma.student.findUnique({
                where: { id: studentId },
                include: { course: true, parent: true }
            });

            if (student?.courseId) {
                whereClause.courseId = student.courseId;
                console.log(`Loading card sets for student ${student.name} in course ${student.courseId}`);
            } else {
                // 🔥 Esto ya no debería pasar con la nueva lógica
                console.warn(`Student ${student?.name} has no courseId! This should not happen.`);
                return NextResponse.json([]);
            }
        }
        // Si se proporciona un courseId directamente
        else if (courseId) {
            whereClause.courseId = courseId;
        }
        // Si es admin o teacher, mostrar todos los conjuntos que haya creado
        else if (session.user.role === 'ADMIN' || session.user.role === 'TEACHER') {
            whereClause.course = {
                teacherId: session.user.id
            };
        }

        console.log('CardSets WHERE clause:', whereClause);

        const cardSets = await prisma.cardSet.findMany({
            where: whereClause,
            include: {
                course: true,
                cards: {
                    select: { id: true } // Solo contar las tarjetas
                },
                _count: {
                    select: { cards: true }
                }
            },
            orderBy: [
                { level: 'asc' },
                { name: 'asc' }
            ]
        });

        console.log(`Found ${cardSets.length} card sets for student ${studentId}`);

        // Agregar información adicional para cada conjunto
        const cardSetsWithProgress = await Promise.all(
            cardSets.map(async (cardSet) => {
                let progress = 0;

                // Si hay un studentId, calcular el progreso
                if (studentId) {
                    const studentProgress = await prisma.progress.findMany({
                        where: {
                            studentId,
                            card: {
                                cardSetId: cardSet.id
                            }
                        }
                    });

                    const totalCards = cardSet._count.cards;
                    // 🔥 CAMBIO: Usar cardsWithSuccess en lugar de solo mastered
                    const cardsWithSuccess = studentProgress.filter(p => p.successCount > 0).length;
                    const masteredCards = studentProgress.filter(p => p.mastered).length;

                    // Mostrar progreso basado en cardsWithSuccess
                    progress = totalCards > 0 ? Math.round((cardsWithSuccess / totalCards) * 100) : 0;

                    console.log(`CardSet ${cardSet.name}: ${cardsWithSuccess}/${totalCards} with success (${progress}%)`);
                }

                return {
                    ...cardSet,
                    cardCount: cardSet._count.cards,
                    progress
                };
            })
        );

        return NextResponse.json(cardSetsWithProgress);
    } catch (error) {
        console.error('Error fetching card sets:', error);
        return NextResponse.json(
            { error: 'Error al obtener conjuntos de tarjetas' },
            { status: 500 }
        );
    }
}

// POST /api/card-sets - Crear nuevo conjunto de tarjetas
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admin y teachers pueden crear conjuntos
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
        return NextResponse.json(
            { error: 'No tienes permisos para crear conjuntos de tarjetas' },
            { status: 403 }
        );
    }

    try {
        const body = await request.json();
        const { name, description, level, courseId } = body;

        // Validar datos requeridos
        if (!name) {
            return NextResponse.json(
                { error: 'El nombre es requerido' },
                { status: 400 }
            );
        }

        let finalCourseId = courseId;

        // Si no se proporciona courseId, crear o buscar un curso por defecto para el usuario
        if (!finalCourseId) {
            let defaultCourse = await prisma.course.findFirst({
                where: {
                    teacherId: session.user.id,
                    name: 'Curso Principal'
                }
            });

            // Si no existe, crear un curso por defecto
            if (!defaultCourse) {
                defaultCourse = await prisma.course.create({
                    data: {
                        name: 'Curso Principal',
                        description: 'Curso principal para tarjetas educativas',
                        teacherId: session.user.id
                    }
                });
            }

            finalCourseId = defaultCourse.id;
        }

        // Crear el conjunto de tarjetas
        const cardSet = await prisma.cardSet.create({
            data: {
                name,
                description: description || '',
                level: level || 1,
                courseId: finalCourseId
            },
            include: {
                course: true,
                _count: {
                    select: { cards: true }
                }
            }
        });

        return NextResponse.json({
            ...cardSet,
            cardCount: cardSet._count.cards
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating card set:', error);
        return NextResponse.json(
            { error: 'Error al crear conjunto de tarjetas' },
            { status: 500 }
        );
    }
}

// PUT /api/card-sets/:id - Actualizar conjunto de tarjetas
export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    try {
        const body = await request.json();
        const { name, description, level } = body;

        // Verificar que el conjunto existe
        const existingCardSet = await prisma.cardSet.findUnique({
            where: { id },
            include: { course: true }
        });

        if (!existingCardSet) {
            return NextResponse.json(
                { error: 'Conjunto de tarjetas no encontrado' },
                { status: 404 }
            );
        }

        // Verificar permisos
        if (
            existingCardSet.course.teacherId !== session.user.id &&
            session.user.role !== 'ADMIN'
        ) {
            return NextResponse.json(
                { error: 'No tienes permisos para editar este conjunto' },
                { status: 403 }
            );
        }

        // Actualizar el conjunto
        const updatedCardSet = await prisma.cardSet.update({
            where: { id },
            data: {
                name: name || existingCardSet.name,
                description: description !== undefined ? description : existingCardSet.description,
                level: level || existingCardSet.level
            },
            include: {
                course: true,
                _count: {
                    select: { cards: true }
                }
            }
        });

        return NextResponse.json({
            ...updatedCardSet,
            cardCount: updatedCardSet._count.cards
        });
    } catch (error) {
        console.error('Error updating card set:', error);
        return NextResponse.json(
            { error: 'Error al actualizar conjunto de tarjetas' },
            { status: 500 }
        );
    }
}

// DELETE /api/card-sets/:id - Eliminar conjunto de tarjetas
export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    try {
        // Verificar que el conjunto existe
        const existingCardSet = await prisma.cardSet.findUnique({
            where: { id },
            include: { course: true }
        });

        if (!existingCardSet) {
            return NextResponse.json(
                { error: 'Conjunto de tarjetas no encontrado' },
                { status: 404 }
            );
        }

        // Verificar permisos
        if (
            existingCardSet.course.teacherId !== session.user.id &&
            session.user.role !== 'ADMIN'
        ) {
            return NextResponse.json(
                { error: 'No tienes permisos para eliminar este conjunto' },
                { status: 403 }
            );
        }

        // Eliminar en orden: progreso -> tarjetas -> conjunto
        await prisma.progress.deleteMany({
            where: {
                card: {
                    cardSetId: id
                }
            }
        });

        await prisma.card.deleteMany({
            where: { cardSetId: id }
        });

        await prisma.cardSet.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting card set:', error);
        return NextResponse.json(
            { error: 'Error al eliminar conjunto de tarjetas' },
            { status: 500 }
        );
    }
}