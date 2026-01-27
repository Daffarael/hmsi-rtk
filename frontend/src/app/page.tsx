'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Home() {
    const router = useRouter();
    const { pengguna, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (pengguna) {
                if (pengguna.peran === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/anggota');
                }
            } else {
                router.push('/masuk');
            }
        }
    }, [pengguna, loading, router]);

    return (
        <div className="loader-overlay">
            <div className="loader"></div>
        </div>
    );
}
