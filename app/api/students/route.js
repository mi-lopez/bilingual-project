// app/api/students/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Función auxiliar para encontrar o crear un curso por defecto
async function findOrCreateDefaultCourse(parentId) {
    try {
        // Primero, buscar si el padre tiene cursos (si es teacher)
        const parentCourses = await prisma.course.findMany({
            where: { teacherId: parentId },
            orderBy: { createdAt: 'asc' }
        });

        if (parentCourses.length > 0) {
            console.log(`Found ${parentCourses.length} courses for teacher parent ${parentId}`);
            return parentCourses[0].id; // Usar el primer curso del padre
        }

        // Si el padre no tiene cursos, buscar un curso público/general
        const generalCourse = await prisma.course.findFirst({
            orderBy: { createdAt: 'asc' }
        });

        if (generalCourse) {
            console.log(`Using general course ${generalCourse.id} for student`);
            return generalCourse.id;
        }

        // Si no hay ningún curso, crear uno por defecto
        console.log('No courses found, creating default course');
        const defaultCourse = await prisma.course.create({
            data: {
                name: 'Curso General',
                description: 'Curso por defecto para aprendizaje bilingüe',
                teacherId: parentId // Usar el padre como teacher por defecto
            }
        });

        return defaultCourse.id;
    } catch (error) {
        console.error('Error finding/creating default course:', error);
        return null;
    }
}

// GET /api/students - Obtener estudiantes
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId');
    const courseId = searchParams.get('courseId');

    try {
        let whereClause = {};

        // Si se especifica un parentId
        if (parentId) {
            // Verificar que el usuario puede ver estos estudiantes
            if (parentId !== session.user.id && session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
                return NextResponse.json(
                    { error: 'No tienes permisos para ver estos estudiantes' },
                    { status: 403 }
                );
            }
            whereClause.parentId = parentId;
        }
        // Si se especifica un courseId
        else if (courseId) {
            whereClause.courseId = courseId;
        }
        // Si es un padre, mostrar solo sus hijos
        else if (session.user.role === 'PARENT') {
            whereClause.parentId = session.user.id;
        }
        // Si es teacher o admin, pueden ver estudiantes de sus cursos
        else if (session.user.role === 'TEACHER') {
            whereClause.course = {
                teacherId: session.user.id
            };
        }
        // Admin puede ver todos

        const students = await prisma.student.findMany({
            where: whereClause,
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
            },
            orderBy: { name: 'asc' }
        });

        // Agregar estadísticas calculadas
        const studentsWithStats = students.map(student => {
            const totalAttempts = student.progress.reduce((sum, p) => sum + p.attempts, 0);
            const totalSuccess = student.progress.reduce((sum, p) => sum + p.successCount, 0);
            const masteredCount = student.progress.filter(p => p.mastered).length;
            const score = totalSuccess * 10; // 10 puntos por éxito

            return {
                ...student,
                stats: {
                    totalAttempts,
                    totalSuccess,
                    masteredCount,
                    score,
                    achievementCount: student.achievements.length
                }
            };
        });

        return NextResponse.json(studentsWithStats);
    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json(
            { error: 'Error al obtener estudiantes' },
            { status: 500 }
        );
    }
}

// POST /api/students - Crear nuevo estudiante
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, age, parentId, courseId, avatarUrl } = body;

        // Validar datos requeridos
        if (!name) {
            return NextResponse.json(
                { error: 'El nombre es requerido' },
                { status: 400 }
            );
        }

        // Si no se proporciona parentId, usar el usuario actual
        const finalParentId = parentId || session.user.id;

        // Verificar permisos para crear estudiante
        if (
            finalParentId !== session.user.id &&
            session.user.role !== 'ADMIN' &&
            session.user.role !== 'TEACHER'
        ) {
            return NextResponse.json(
                { error: 'No tienes permisos para crear un estudiante para este padre' },
                { status: 403 }
            );
        }

        // Verificar que el padre existe
        const parent = await prisma.user.findUnique({
            where: { id: finalParentId }
        });

        if (!parent) {
            return NextResponse.json(
                { error: 'Padre no encontrado' },
                { status: 404 }
            );
        }

        // 🔥 NUEVO: Auto-asignar curso si no se proporciona
        let finalCourseId = courseId;
        if (!finalCourseId) {
            console.log(`Auto-assigning course for new student ${name}`);
            finalCourseId = await findOrCreateDefaultCourse(finalParentId);
        }

        // Crear el estudiante
        const student = await prisma.student.create({
            data: {
                name,
                age: age ? parseInt(age) : null,
                parentId: finalParentId,
                courseId: finalCourseId, // 🔥 CAMBIO: Siempre asignar un curso
                avatarUrl: avatarUrl || null
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

        console.log(`✅ Created student ${name} with courseId: ${finalCourseId}`);

        return NextResponse.json(student, { status: 201 });
    } catch (error) {
        console.error('Error creating student:', error);
        return NextResponse.json(
            { error: 'Error al crear estudiante' },
            { status: 500 }
        );
    }
}

// PUT /api/students/:id - Actualizar estudiante
export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

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

    const { id } = params;

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

// PATCH /api/students/:id - Actualización parcial (usado para avatar)
export async function PATCH(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

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