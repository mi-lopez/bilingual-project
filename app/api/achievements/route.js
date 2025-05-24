// /app/api/achievements/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/achievements - Obtener logros del estudiante
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');

    if (!studentId) {
        // Si no se proporciona un ID de estudiante, devolver todos los logros
        try {
            const achievements = await prisma.achievement.findMany();
            return NextResponse.json(achievements);
        } catch (error) {
            console.error('Error fetching achievements:', error);
            return NextResponse.json(
                { error: 'Error al obtener logros' },
                { status: 500 }
            );
        }
    }

    try {
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
                { error: 'No tienes permisos para ver estos logros' },
                { status: 403 }
            );
        }

        // Obtener logros del estudiante
        const studentWithAchievements = await prisma.student.findUnique({
            where: { id: studentId },
            include: { achievements: true },
        });

        return NextResponse.json(studentWithAchievements.achievements);
    } catch (error) {
        console.error('Error fetching student achievements:', error);
        return NextResponse.json(
            { error: 'Error al obtener logros del estudiante' },
            { status: 500 }
        );
    }
}

// POST /api/achievements - Crear nuevo logro (solo admin)
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json(
            { error: 'No autorizado' },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { name, description, imageUrl, type, threshold } = body;

        // Validar datos requeridos
        if (!name || !description || !imageUrl || !type || !threshold) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos' },
                { status: 400 }
            );
        }

        // Validar tipo de logro
        const validTypes = ['attempts', 'success', 'mastery', 'streak'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: 'Tipo de logro no válido' },
                { status: 400 }
            );
        }

        // Crear logro
        const achievement = await prisma.achievement.create({
            data: {
                name,
                description,
                imageUrl,
                type,
                threshold,
            },
        });

        return NextResponse.json(achievement, { status: 201 });
    } catch (error) {
        console.error('Error creating achievement:', error);
        return NextResponse.json(
            { error: 'Error al crear logro' },
            { status: 500 }
        );
    }
}

// PUT /api/achievements/:id - Actualizar logro (solo admin)
export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json(
            { error: 'No autorizado' },
            { status: 401 }
        );
    }

    const { id } = params;

    try {
        const body = await request.json();
        const { name, description, imageUrl, type, threshold } = body;

        // Verificar que el logro existe
        const existingAchievement = await prisma.achievement.findUnique({
            where: { id },
        });

        if (!existingAchievement) {
            return NextResponse.json(
                { error: 'Logro no encontrado' },
                { status: 404 }
            );
        }

        // Actualizar logro
        const updatedAchievement = await prisma.achievement.update({
            where: { id },
            data: {
                name: name || existingAchievement.name,
                description: description || existingAchievement.description,
                imageUrl: imageUrl || existingAchievement.imageUrl,
                type: type || existingAchievement.type,
                threshold: threshold || existingAchievement.threshold,
            },
        });

        return NextResponse.json(updatedAchievement);
    } catch (error) {
        console.error('Error updating achievement:', error);
        return NextResponse.json(
            { error: 'Error al actualizar logro' },
            { status: 500 }
        );
    }
}

// DELETE /api/achievements/:id - Eliminar logro (solo admin)
export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json(
            { error: 'No autorizado' },
            { status: 401 }
        );
    }

    const { id } = params;

    try {
        // Verificar que el logro existe
        const existingAchievement = await prisma.achievement.findUnique({
            where: { id },
        });

        if (!existingAchievement) {
            return NextResponse.json(
                { error: 'Logro no encontrado' },
                { status: 404 }
            );
        }

        // Eliminar relaciones con estudiantes
        await prisma.achievement.update({
            where: { id },
            data: {
                students: {
                    set: [],
                },
            },
        });

        // Eliminar logro
        await prisma.achievement.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting achievement:', error);
        return NextResponse.json(
            { error: 'Error al eliminar logro' },
            { status: 500 }
        );
    }
}