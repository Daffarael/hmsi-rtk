/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        // Ambil base URL tanpa /api di akhir
        const backendBase = backendUrl.replace(/\/api$/, '');
        return [
            {
                source: '/api/:path*',
                destination: `${backendBase}/api/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
