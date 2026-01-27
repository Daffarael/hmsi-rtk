import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/lib/auth';
import CustomCursor from '@/components/CustomCursor';
import ClientWrapper from '@/components/ClientWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'HMSI Absensi - Himpunan Mahasiswa Sistem Informasi Unand',
    description: 'Sistem Absensi QR untuk Himpunan Mahasiswa Sistem Informasi Universitas Andalas',
    keywords: ['HMSI', 'Absensi', 'QR Code', 'Unand', 'Sistem Informasi'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id">
            <body className={inter.className}>
                <CustomCursor />
                <ClientWrapper>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </ClientWrapper>
            </body>
        </html>
    );
}
