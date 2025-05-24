// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    // Crear usuarios de prueba
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@demo.com' },
        update: {},
        create: {
            name: 'Administrador',
            email: 'admin@demo.com',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    // Profesor
    const teacher = await prisma.user.upsert({
        where: { email: 'profesor@demo.com' },
        update: {},
        create: {
            name: 'Profesor Demo',
            email: 'profesor@demo.com',
            password: hashedPassword,
            role: 'TEACHER',
        },
    });

    // Padre
    const parent = await prisma.user.upsert({
        where: { email: 'padre@demo.com' },
        update: {},
        create: {
            name: 'Padre Demo',
            email: 'padre@demo.com',
            password: hashedPassword,
            role: 'PARENT',
        },
    });

    // Crear un curso
    const course = await prisma.course.upsert({
        where: { id: 'course1' },
        update: {},
        create: {
            id: 'course1',
            name: 'Inglés para Pequeños Exploradores',
            description: 'Aprende inglés de forma divertida con temas que te encantan',
            teacherId: teacher.id,
        },
    });

    // 1. ANIMALES DOMÉSTICOS
    const domesticAnimalsSet = await prisma.cardSet.upsert({
        where: { id: 'cardset1' },
        update: {},
        create: {
            id: 'cardset1',
            name: 'Animales Domésticos',
            description: 'Conoce a nuestros amigos peludos',
            level: 1,
            courseId: course.id,
        },
    });

    await prisma.card.createMany({
        data: [
            {
                imageUrl: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxkb2d8ZW58MHx8fHwxNzQ4MTExNzg3fDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Perro',
                englishWord: 'Dog',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: domesticAnimalsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxjYXR8ZW58MHx8fHwxNzQ4MTExNzY4fDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Gato',
                englishWord: 'Cat',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: domesticAnimalsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxmaXNofGVufDB8fHx8MTc0ODExMTc1OHww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Pez',
                englishWord: 'Fish',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: domesticAnimalsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxyYWJiaXR8ZW58MHx8fHwxNzQ4MTExNzQ2fDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Conejo',
                englishWord: 'Rabbit',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: domesticAnimalsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxoYW1zdGVyfGVufDB8fHx8MTc0ODExMTczNHww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Hámster',
                englishWord: 'Hamster',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: domesticAnimalsSet.id,
            },
        ],
        skipDuplicates: true,
    });

    // 2. COLORES DEL ARCOÍRIS
    const colorsSet = await prisma.cardSet.upsert({
        where: { id: 'cardset2' },
        update: {},
        create: {
            id: 'cardset2',
            name: 'Colores Mágicos',
            description: 'Descubre los colores del arcoíris',
            level: 1,
            courseId: course.id,
        },
    });

    await prisma.card.createMany({
        data: [
            {
                imageUrl: 'https://images.unsplash.com/photo-1530128118208-89f6ce02b37b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxyZWR8ZW58MHx8fHwxNzQ4MTExNzE2fDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Rojo',
                englishWord: 'Red',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: colorsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1566228015668-4c45dbc4e2f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxibHVlfGVufDB8fHx8MTc0ODExMTcwM3ww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Azul',
                englishWord: 'Blue',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: colorsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1615457938971-3ab61c1c0d57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHx5ZWxsb3d8ZW58MHx8fHwxNzQ4MTExNjg5fDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Amarillo',
                englishWord: 'Yellow',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: colorsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1525498128493-380d1990a112?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxncmVlbnxlbnwwfHx8fDE3NDgxMTE2NzR8MA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Verde',
                englishWord: 'Green',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: colorsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1520052205864-92d242b3a76b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxwaW5rfGVufDB8fHx8MTc0ODExMTY1N3ww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Rosa',
                englishWord: 'Pink',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: colorsSet.id,
            },
        ],
        skipDuplicates: true,
    });

    // 3. FRUTAS DELICIOSAS
    const fruitsSet = await prisma.cardSet.upsert({
        where: { id: 'cardset3' },
        update: {},
        create: {
            id: 'cardset3',
            name: 'Frutas Deliciosas',
            description: 'Frutas ricas y nutritivas',
            level: 1,
            courseId: course.id,
        },
    });

    await prisma.card.createMany({
        data: [
            {
                imageUrl: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxhcHBsZXxlbnwwfHx8fDE3NDgxMTE2MzN8MA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Manzana',
                englishWord: 'Apple',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: fruitsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxiYW5hbmF8ZW58MHx8fHwxNzQ4MTExNjE5fDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Plátano',
                englishWord: 'Banana',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: fruitsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxvcmFuZ2V8ZW58MHx8fHwxNzQ4MTExNTk4fDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Naranja',
                englishWord: 'Orange',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: fruitsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxTdHJhd2JlcnJ5fGVufDB8fHx8MTc0ODExMTU4MXww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Fresa',
                englishWord: 'Strawberry',
                difficulty: 2,
                createdById: teacher.id,
                cardSetId: fruitsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1423483641154-5411ec9c0ddf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxncmFwZXxlbnwwfHx8fDE3NDgxMDk5NTl8MA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Uva',
                englishWord: 'Grape',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: fruitsSet.id,
            },
        ],
        skipDuplicates: true,
    });

    // 4. JUGUETES FAVORITOS
    const toysSet = await prisma.cardSet.upsert({
        where: { id: 'cardset4' },
        update: {},
        create: {
            id: 'cardset4',
            name: 'Mis Juguetes',
            description: 'Los juguetes más divertidos',
            level: 1,
            courseId: course.id,
        },
    });

    await prisma.card.createMany({
        data: [
            {
                imageUrl: 'https://images.unsplash.com/photo-1612506001235-f0d0892aa11b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxkb2xsfGVufDB8fHx8MTc0ODEwOTk0Mnww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Muñeca',
                englishWord: 'Doll',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: toysSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxiYWxsfGVufDB8fHx8MTc0ODEwOTkyOHww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Pelota',
                englishWord: 'Ball',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: toysSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1604147495798-57beb5d6af73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxibG9ja3xlbnwwfHx8fDE3NDgxMDk5MTV8MA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Bloque',
                englishWord: 'Block',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: toysSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1704340142770-b52988e5b6eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MXwxfHNlYXJjaHwxfHxjYXJ8ZW58MHx8fHwxNzQ4MTA5ODk5fDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Carro',
                englishWord: 'Car',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: toysSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1530325553241-4f6e7690cf36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHx0b3klMjBiZWFyfGVufDB8fHx8MTc0ODEwOTg1OHww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Oso',
                englishWord: 'Bear',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: toysSet.id,
            },
        ],
        skipDuplicates: true,
    });

    // 5. PARTES DEL CUERPO
    const bodyPartsSet = await prisma.cardSet.upsert({
        where: { id: 'cardset5' },
        update: {},
        create: {
            id: 'cardset5',
            name: 'Mi Cuerpo',
            description: 'Aprende las partes de tu cuerpo',
            level: 1,
            courseId: course.id,
        },
    });

    await prisma.card.createMany({
        data: [
            {
                imageUrl: 'https://images.unsplash.com/photo-1542702937-506268e68902?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxoZWFkfGVufDB8fHx8MTc0ODEwOTc5Mnww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Cabeza',
                englishWord: 'Head',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: bodyPartsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1483519173755-be893fab1f46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxleWV8ZW58MHx8fHwxNzQ4MTA5Nzc3fDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Ojo',
                englishWord: 'Eye',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: bodyPartsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1587365403481-1120a2e0287f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxoYW5kfGVufDB8fHx8MTc0ODEwOTc2NXww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Mano',
                englishWord: 'Hand',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: bodyPartsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1507070491081-c86dc15d6e12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxmb290fGVufDB8fHx8MTc0ODEwOTc1Mnww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Pie',
                englishWord: 'Foot',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: bodyPartsSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1541715301255-12a4839b424a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxub3NlfGVufDB8fHx8MTc0ODEwOTczN3ww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Nariz',
                englishWord: 'Nose',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: bodyPartsSet.id,
            },
        ],
        skipDuplicates: true,
    });

    // 6. FAMILIA QUERIDA
    const familySet = await prisma.cardSet.upsert({
        where: { id: 'cardset6' },
        update: {},
        create: {
            id: 'cardset6',
            name: 'Mi Familia',
            description: 'Las personas que más amo',
            level: 1,
            courseId: course.id,
        },
    });

    await prisma.card.createMany({
        data: [
            {
                imageUrl: 'https://images.unsplash.com/photo-1560707857-b897819e06fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxtb218ZW58MHx8fHwxNzQ4MTA5NzIwfDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Mamá',
                englishWord: 'Mom',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: familySet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1605812830455-2fadc55bc4ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxkYWR8ZW58MHx8fHwxNzQ4MTA5NzA2fDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Papá',
                englishWord: 'Dad',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: familySet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1502143135356-dcdb8a9a3da6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxicm90aGVyfGVufDB8fHx8MTc0ODEwOTY5Mnww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Hermano',
                englishWord: 'Brother',
                difficulty: 2,
                createdById: teacher.id,
                cardSetId: familySet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1528739221323-9cc1418d678e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxzaXN0ZXJ8ZW58MHx8fHwxNzQ4MTA5Njc3fDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Hermana',
                englishWord: 'Sister',
                difficulty: 2,
                createdById: teacher.id,
                cardSetId: familySet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1593100126453-19b562a800c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxncmFuZG1hfGVufDB8fHx8MTc0ODEwOTY1NXww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Abuela',
                englishWord: 'Grandma',
                difficulty: 2,
                createdById: teacher.id,
                cardSetId: familySet.id,
            },
        ],
        skipDuplicates: true,
    });

    // 7. NÚMEROS DIVERTIDOS
    const numbersSet = await prisma.cardSet.upsert({
        where: { id: 'cardset7' },
        update: {},
        create: {
            id: 'cardset7',
            name: 'Números Mágicos',
            description: 'Aprende a contar en inglés',
            level: 1,
            courseId: course.id,
        },
    });

    await prisma.card.createMany({
        data: [
            {
                imageUrl: 'https://images.unsplash.com/photo-1621440318464-72633426377b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxvbmV8ZW58MHx8fHwxNzQ4MTA5NjMzfDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Uno',
                englishWord: 'One',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: numbersSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1598220304647-7fc9cb30748d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwzfHx0d298ZW58MHx8fHwxNzQ4MTA5NjE2fDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Dos',
                englishWord: 'Two',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: numbersSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1556917452-890eed890648?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwzfHx0aHJlZXxlbnwwfHx8fDE3NDgxMDk1OTN8MA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Tres',
                englishWord: 'Three',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: numbersSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1580892934698-cd589f9538a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxmb3VyfGVufDB8fHx8MTc0ODEwOTU3OXww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Cuatro',
                englishWord: 'Four',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: numbersSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1600518386631-1deefa2dc398?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwzfHxmaXZlfGVufDB8fHx8MTc0ODEwOTU1MXww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Cinco',
                englishWord: 'Five',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: numbersSet.id,
            },
        ],
        skipDuplicates: true,
    });

    // 8. FORMAS GEOMÉTRICAS
    const shapesSet = await prisma.cardSet.upsert({
        where: { id: 'cardset8' },
        update: {},
        create: {
            id: 'cardset8',
            name: 'Formas Divertidas',
            description: 'Descubre las formas que nos rodean',
            level: 2,
            courseId: course.id,
        },
    });

    await prisma.card.createMany({
        data: [
            {
                imageUrl: 'https://images.unsplash.com/photo-1496989981497-27d69cdad83e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxjaXJjbGV8ZW58MHx8fHwxNzQ4MTA5NTI2fDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Círculo',
                englishWord: 'Circle',
                difficulty: 2,
                createdById: teacher.id,
                cardSetId: shapesSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1495615080073-6b89c9839ce0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwyfHxzcXVhcmV8ZW58MHx8fHwxNzQ4MTA5NDY4fDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Cuadrado',
                englishWord: 'Square',
                difficulty: 2,
                createdById: teacher.id,
                cardSetId: shapesSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1575703397367-725a44bcc790?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHx0cmlhbmdsZXxlbnwwfHx8fDE3NDgxMDk0NTV8MA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Triángulo',
                englishWord: 'Triangle',
                difficulty: 2,
                createdById: teacher.id,
                cardSetId: shapesSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1536593078631-8f8d3cc4ed84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwzfHxyZWN0YW5nbGUlMjBzaGFwZXxlbnwwfHx8fDE3NDgxMDkzOTJ8MA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Rectángulo',
                englishWord: 'Rectangle',
                difficulty: 3,
                createdById: teacher.id,
                cardSetId: shapesSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1481015172496-8cfcb0d85e59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxzdGFyJTIwc2hhcGV8ZW58MHx8fHwxNzQ4MTA5MzcwfDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Estrella',
                englishWord: 'Star',
                difficulty: 2,
                createdById: teacher.id,
                cardSetId: shapesSet.id,
            },
        ],
        skipDuplicates: true,
    });

    // 9. COMIDA RICA
    const foodSet = await prisma.cardSet.upsert({
        where: { id: 'cardset9' },
        update: {},
        create: {
            id: 'cardset9',
            name: 'Comida Deliciosa',
            description: 'Mis comidas favoritas',
            level: 1,
            courseId: course.id,
        },
    });

    await prisma.card.createMany({
        data: [
            {
                imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxwaXp6YXxlbnwwfHx8fDE3NDgxMDkyMzd8MA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Pizza',
                englishWord: 'Pizza',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: foodSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxicmVhZHxlbnwwfHx8fDE3NDgxMDkyMjN8MA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Pan',
                englishWord: 'Bread',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: foodSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxjaGVlc2V8ZW58MHx8fHwxNzQ4MTA5MjEwfDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Queso',
                englishWord: 'Cheese',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: foodSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxpY2VjcmVhbXxlbnwwfHx8fDE3NDgxMDkxODV8MA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Helado',
                englishWord: 'Ice cream',
                difficulty: 2,
                createdById: teacher.id,
                cardSetId: foodSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxjb29raWV8ZW58MHx8fHwxNzQ4MTA5MTcxfDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Galleta',
                englishWord: 'Cookie',
                difficulty: 2,
                createdById: teacher.id,
                cardSetId: foodSet.id,
            },
        ],
        skipDuplicates: true,
    });

    // 10. NATURALEZA HERMOSA
    const natureSet = await prisma.cardSet.upsert({
        where: { id: 'cardset10' },
        update: {},
        create: {
            id: 'cardset10',
            name: 'La Naturaleza',
            description: 'Descubre el mundo natural',
            level: 2,
            courseId: course.id,
        },
    });

    await prisma.card.createMany({
        data: [
            {
                imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80',
                spanishWord: 'Árbol',
                englishWord: 'Tree',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: natureSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&q=80',
                spanishWord: 'Flor',
                englishWord: 'Flower',
                difficulty: 2,
                createdById: teacher.id,
                cardSetId: natureSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxza3l8ZW58MHx8fHwxNzQ4MTA5MTAyfDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Cielo',
                englishWord: 'Sky',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: natureSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1563630381190-77c336ea545a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxzdW58ZW58MHx8fHwxNzQ4MTA5MTI1fDA&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Sol',
                englishWord: 'Sun',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: natureSet.id,
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTUzOTB8MHwxfHNlYXJjaHwxfHxtb29ufGVufDB8fHx8MTc0ODEwOTE0Nnww&ixlib=rb-4.1.0&q=80&w=400',
                spanishWord: 'Luna',
                englishWord: 'Moon',
                difficulty: 1,
                createdById: teacher.id,
                cardSetId: natureSet.id,
            },
        ],
        skipDuplicates: true,
    });

    console.log('Base de datos inicializada con 10 conjuntos de tarjetas para niños de 5 años:');
    console.log('1. Animales Domésticos (5 tarjetas)');
    console.log('2. Colores Mágicos (5 tarjetas)');
    console.log('3. Frutas Deliciosas (5 tarjetas)');
    console.log('4. Mis Juguetes (5 tarjetas)');
    console.log('5. Mi Cuerpo (5 tarjetas)');
    console.log('6. Mi Familia (5 tarjetas)');
    console.log('7. Números Mágicos (5 tarjetas)');
    console.log('8. Formas Divertidas (5 tarjetas)');
    console.log('9. Comida Deliciosa (5 tarjetas)');
    console.log('10. La Naturaleza (5 tarjetas)');
    console.log('Total: 50 tarjetas educativas');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });