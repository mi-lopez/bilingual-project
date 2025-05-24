// app/layout.jsx
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Aprendizaje Bilingüe',
    description: 'Aplicación educativa para aprender inglés jugando',
};

export default function RootLayout({ children }) {
    return (
        <html lang="es">
        <body className={inter.className}>
        <Providers>
            {children}
        </Providers>
        </body>
        </html>
    );
}