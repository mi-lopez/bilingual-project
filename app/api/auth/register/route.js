// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const { name, email, password } = await request.json();

        // Validar datos requeridos
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Todos los campos son requeridos' },
                { status: 400 }
            );
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Formato de email inválido' },
                { status: 400 }
            );
        }

        // Validar longitud de contraseña
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'La contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            );
        }

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Ya existe una cuenta con este email' },
                { status: 400 }
            );
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 12);

        // Crear usuario
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'PARENT' // Rol por defecto
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        return NextResponse.json(
            {
                message: 'Usuario creado exitosamente',
                user
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}