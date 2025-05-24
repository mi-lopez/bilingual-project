// app/api/students/[id]/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/students/:id - Obtener estudiante específico
export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { id } = await params;

    try {
        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                parent: {
                    select: { id: true, name: true, email: true }
                },
                course: {
                    select: { id: true, name: true }
                },
                progress: {
                    select: {
                        id: true,
                        mastered: true,
                        successCount: true,
                        attempts: true
                    }
                },
                achievements: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true
                    }
                }
            }
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
                { error: 'No tienes permisos para ver este estudiante' },
                { status: 403 }
            );
        }

        return NextResponse.json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        return NextResponse.json(
            { error: 'Error al obtener estudiante' },
            { status: 500 }
        );
    }
}

// PATCH /api/students/:id - Actualización parcial del estudiante
export async function PATCH(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { id } = await params;

    try {
        const body = await request.json();

        // Verificar que el estudiante existe
        const existingStudent = await prisma.student.findUnique({
            where: { id }
        });

        if (!existingStudent) {
            return NextResponse.json(
                { error: 'Estudiante no encontrado' },
                { status: 404 }
            );
        }

        // Verificar permisos
        if (
            existingStudent.parentId !== session.user.id &&
            session.user.role !== 'ADMIN' &&
            session.user.role !== 'TEACHER'
        ) {
            return NextResponse.json(
                { error: 'No tienes permisos para editar este estudiante' },
                { status: 403 }
            );
        }

        // Actualizar solo los campos proporcionados
        const updatedStudent = await prisma.student.update({
            where: { id },
            data: body,
            include: {
                parent: {
                    select: { id: true, name: true, email: true }
                },
                course: {
                    select: { id: true, name: true }
                }
            }
        });

        return NextResponse.json(updatedStudent);
    } catch (error) {
        console.error('Error patching student:', error);
        return NextResponse.json(
            { error: 'Error al actualizar estudiante' },
            { status: 500 }
        );
    }
}

// PUT /api/students/:id - Actualizar estudiante completo
export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { id } = await params;

    try {
        const body = await request.json();
        const { name, age, avatarUrl, courseId } = body;

        // Verificar que el estudiante existe
        const existingStudent = await prisma.student.findUnique({
            where: { id },
            include: { parent: true }
        });

        if (!existingStudent) {
            return NextResponse.json(
                { error: 'Estudiante no encontrado' },
                { status: 404 }
            );
        }

        // Verificar permisos
        if (
            existingStudent.parentId !== session.user.id &&
            session.user.role !== 'ADMIN' &&
            session.user.role !== 'TEACHER'
        ) {
            return NextResponse.json(
                { error: 'No tienes permisos para editar este estudiante' },
                { status: 403 }
            );
        }

        // Actualizar el estudiante
        const updatedStudent = await prisma.student.update({
            where: { id },
            data: {
                name: name || existingStudent.name,
                age: age !== undefined ? (age ? parseInt(age) : null) : existingStudent.age,
                avatarUrl: avatarUrl !== undefined ? avatarUrl : existingStudent.avatarUrl,
                courseId: courseId !== undefined ? courseId : existingStudent.courseId
            },
            include: {
                parent: {
                    select: { id: true, name: true, email: true }
                },
                course: {
                    select: { id: true, name: true }
                }
            }
        });

        return NextResponse.json(updatedStudent);
    } catch (error) {
        console.error('Error updating student:', error);
        return NextResponse.json(
            { error: 'Error al actualizar estudiante' },
            { status: 500 }
        );
    }
}

// DELETE /api/students/:id - Eliminar estudiante
export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { id } = await params;

    try {
        // Verificar que el estudiante existe
        const existingStudent = await prisma.student.findUnique({
            where: { id }
        });

        if (!existingStudent) {
            return NextResponse.json(
                { error: 'Estudiante no encontrado' },
                { status: 404 }
            );
        }

        // Verificar permisos
        if (
            existingStudent.parentId !== session.user.id &&
            session.user.role !== 'ADMIN'
        ) {
            return NextResponse.json(
                { error: 'No tienes permisos para eliminar este estudiante' },
                { status: 403 }
            );
        }

        // Eliminar en orden: progreso -> relaciones con logros -> estudiante
        await prisma.progress.deleteMany({
            where: { studentId: id }
        });

        // Desconectar logros
        await prisma.student.update({
            where: { id },
            data: {
                achievements: {
                    set: []
                }
            }
        });

        // Eliminar estudiante
        await prisma.student.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting student:', error);
        return NextResponse.json(
            { error: 'Error al eliminar estudiante' },
            { status: 500 }
        );
    }
}