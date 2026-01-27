'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { api } from './api';

interface Pengguna {
    id: number;
    nama_lengkap: string;
    nama_panggilan: string;
    username: string;
    peran: 'admin' | 'anggota';
    nim: string;
    angkatan?: number;
    periode?: {
        id: number;
        nama: string;
        tanggal_mulai: string;
        tanggal_selesai: string;
    };
    divisi?: {
        id: number;
        nama: string;
    };
    masa_jabatan_habis?: boolean;
}

interface AuthContextType {
    pengguna: Pengguna | null;
    loading: boolean;
    masuk: (username: string, kata_sandi: string) => Promise<{ sukses: boolean; pesan?: string; perlu_transfer?: boolean }>;
    keluar: () => void;
    refreshPengguna: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [pengguna, setPengguna] = useState<Pengguna | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshPengguna = async () => {
        const token = Cookies.get('token');
        if (!token) {
            setPengguna(null);
            setLoading(false);
            return;
        }

        try {
            const response = await api.saya();
            if (response.sukses && response.data) {
                setPengguna(response.data as Pengguna);
            } else {
                Cookies.remove('token');
                setPengguna(null);
            }
        } catch (error) {
            Cookies.remove('token');
            setPengguna(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshPengguna();
    }, []);

    const masuk = async (username: string, kata_sandi: string) => {
        try {
            const response = await api.masuk(username, kata_sandi);

            if (response.sukses && response.token) {
                Cookies.set('token', response.token, { expires: 7 });

                if (response.perlu_transfer) {
                    // Store token but return that transfer is needed
                    return { sukses: true, perlu_transfer: true, pesan: response.pesan };
                }

                await refreshPengguna();
                return { sukses: true };
            }

            return { sukses: false, pesan: response.pesan || 'Login gagal' };
        } catch (error: any) {
            return { sukses: false, pesan: error.message || 'Terjadi kesalahan' };
        }
    };

    const keluar = () => {
        Cookies.remove('token');
        setPengguna(null);
        window.location.href = '/masuk';
    };

    return (
        <AuthContext.Provider value={{ pengguna, loading, masuk, keluar, refreshPengguna }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
