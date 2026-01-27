'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import styles from './daftar.module.css';

export default function DaftarAdminPage() {
    const router = useRouter();
    const [kodeTransfer, setKodeTransfer] = useState('');
    const [kataSandiBaru, setKataSandiBaru] = useState('');
    const [konfirmasiSandi, setKonfirmasiSandi] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [berhasil, setBerhasil] = useState(false);
    const [usernameAdmin, setUsernameAdmin] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (kataSandiBaru !== konfirmasiSandi) {
            setError('Kata sandi tidak cocok');
            return;
        }

        if (kataSandiBaru.length < 6) {
            setError('Kata sandi minimal 6 karakter');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await api.daftarAdminBaru(kodeTransfer, kataSandiBaru);

            if (result.sukses && result.data) {
                const data = result.data as { username?: string };
                setBerhasil(true);
                setUsernameAdmin(data.username || '');
            } else {
                setError(result.pesan || 'Registrasi gagal');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.bgAnimation}>
                <div className={styles.bgCircle1}></div>
                <div className={styles.bgCircle2}></div>
            </div>

            <motion.div
                className={styles.card}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {!berhasil ? (
                    <>
                        <motion.div
                            className={styles.header}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className={styles.iconNew}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <line x1="20" y1="8" x2="20" y2="14" />
                                    <line x1="23" y1="11" x2="17" y2="11" />
                                </svg>
                            </div>
                            <h1 className={styles.title}>Registrasi Admin Baru</h1>
                            <p className={styles.subtitle}>
                                Selamat datang! Masukkan kode transfer dari admin sebelumnya untuk mendaftar sebagai admin baru.
                            </p>
                        </motion.div>

                        <motion.form
                            onSubmit={handleSubmit}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            {error && (
                                <div className="alert alert-error mb-4">{error}</div>
                            )}

                            <div className="input-group">
                                <label className="input-label">Kode Transfer</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Masukkan kode dari admin sebelumnya"
                                    value={kodeTransfer}
                                    onChange={(e) => setKodeTransfer(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Kata Sandi Baru</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="Minimal 6 karakter"
                                    value={kataSandiBaru}
                                    onChange={(e) => setKataSandiBaru(e.target.value)}
                                    minLength={6}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Konfirmasi Kata Sandi</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="Ulangi kata sandi"
                                    value={konfirmasiSandi}
                                    onChange={(e) => setKonfirmasiSandi(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <motion.button
                                type="submit"
                                className="btn btn-primary btn-lg w-full"
                                disabled={isSubmitting}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isSubmitting ? 'Memproses...' : 'Daftar Sebagai Admin'}
                            </motion.button>
                        </motion.form>
                    </>
                ) : (
                    <motion.div
                        className={styles.successContainer}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className={styles.iconSuccess}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>

                        <h1 className={styles.title}>Registrasi Berhasil! 🎉</h1>
                        <p className={styles.subtitle}>
                            Selamat! Anda sekarang adalah Admin HMSI. Gunakan kredensial berikut untuk login.
                        </p>

                        <div className={styles.credentialBox}>
                            <div className={styles.credentialItem}>
                                <span className={styles.credentialLabel}>Username</span>
                                <span className={styles.credentialValue}>{usernameAdmin}</span>
                            </div>
                            <div className={styles.credentialItem}>
                                <span className={styles.credentialLabel}>Kata Sandi</span>
                                <span className={styles.credentialValue}>Yang baru Anda buat</span>
                            </div>
                        </div>

                        <motion.button
                            onClick={() => router.push('/masuk')}
                            className="btn btn-primary btn-lg w-full"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Masuk Sekarang
                        </motion.button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
