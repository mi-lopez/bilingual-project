// app/api/upload/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// POST /api/upload - Subir archivo
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json(
                { error: 'No se proporcionó ningún archivo' },
                { status: 400 }
            );
        }

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Tipo de archivo no permitido. Solo se permiten imágenes.' },
                { status: 400 }
            );
        }

        // Validar tamaño de archivo (5MB máximo)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'El archivo es demasiado grande. Máximo 5MB.' },
                { status: 400 }
            );
        }

        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = path.extname(file.name);
        const fileName = `${timestamp}_${randomString}${fileExtension}`;

        // Definir ruta de almacenamiento
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'images');
        const filePath = path.join(uploadDir, fileName);

        // Crear directorio si no existe
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Convertir archivo a buffer y guardarlo
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await writeFile(filePath, buffer);

        // Retornar URL del archivo
        const fileUrl = `/uploads/images/${fileName}`;

        return NextResponse.json({
            success: true,
            url: fileUrl,
            filename: fileName,
            size: file.size,
            type: file.type
        });

    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Error al subir el archivo' },
            { status: 500 }
        );
    }
}

// GET /api/upload - Listar archivos subidos (opcional)
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admin puede listar archivos
    if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
            { error: 'No tienes permisos para listar archivos' },
            { status: 403 }
        );
    }

    try {
        const fs = require('fs');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'images');

        if (!existsSync(uploadDir)) {
            return NextResponse.json([]);
        }

        const files = fs.readdirSync(uploadDir).map(filename => {
            const filePath = path.join(uploadDir, filename);
            const stats = fs.statSync(filePath);

            return {
                filename,
                url: `/uploads/images/${filename}`,
                size: stats.size,
                uploadedAt: stats.birthtime,
                modifiedAt: stats.mtime
            };
        });

        // Ordenar por fecha de subida (más recientes primero)
        files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        return NextResponse.json(files);

    } catch (error) {
        console.error('Error listing files:', error);
        return NextResponse.json(
            { error: 'Error al listar archivos' },
            { status: 500 }
        );
    }
}

// DELETE /api/upload/:filename - Eliminar archivo (opcional)
export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admin puede eliminar archivos
    if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
            { error: 'No tienes permisos para eliminar archivos' },
            { status: 403 }
        );
    }

    try {
        const { filename } = params;
        const filePath = path.join(process.cwd(), 'public', 'uploads', 'images', filename);

        if (!existsSync(filePath)) {
            return NextResponse.json(
                { error: 'Archivo no encontrado' },
                { status: 404 }
            );
        }

        const fs = require('fs').promises;
        await fs.unlink(filePath);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting file:', error);
        return NextResponse.json(
            { error: 'Error al eliminar archivo' },
            { status: 500 }
        );
    }
}