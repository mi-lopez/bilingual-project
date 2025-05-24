// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
                port: '',
                pathname: '/**',
            },
        ],
        domains: [
            'images.unsplash.com',
            'via.placeholder.com',
            'picsum.photos'
        ]
    },
    // En Next.js 15, serverActions está habilitado por defecto
    // No necesitas configurarlo explícitamente
};

module.exports = nextConfig;