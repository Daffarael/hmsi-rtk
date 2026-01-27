'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import styles from './transfer.module.css';

export default function TransferAdminPage() {
    const router = useRouter();
    const { pengguna, loading, keluar } = useAuth();
    const [kodeTransfer, setKodeTransfer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [berhasil, setBerhasil] = useState(false);
    const [linkRegistrasi, setLinkRegistrasi] = useState('');

    useEffect(() => {
        if (!loading && !pengguna) {
            router.push('/masuk');
        }
    }, [pengguna, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const result = await api.buatKodeTransfer(kodeTransfer);

            if (result.sukses && result.data) {
                const data = result.data as { link_registrasi?: string };
                setBerhasil(true);
                setLinkRegistrasi(data.link_registrasi || '');
            } else {
                setError(result.pesan || 'Gagal membuat kode transfer');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(linkRegistrasi);
        alert('Link berhasil disalin!');
    };

    if (loading) {
        return (
            <div className="loader-overlay">
                <div className="loader"></div>
            </div>
        );
    }

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
                            <div className={styles.iconWarning}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h1 className={styles.title}>Masa Jabatan Berakhir</h1>
                            <p className={styles.subtitle}>
                                Terima kasih atas dedikasi Anda sebagai Admin HMSI.
                                Silakan buat kode transfer untuk menyerahkan jabatan kepada admin baru.
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
                                <label className="input-label">Buat Kode Transfer</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Contoh: hmsi2627..."
                                    value={kodeTransfer}
                                    onChange={(e) => setKodeTransfer(e.target.value)}
                                    minLength={6}
                                    required
                                    disabled={isSubmitting}
                                />
                                <p className="mt-2" style={{ fontSize: '0.75rem', color: 'var(--abu-500)' }}>
                                    Minimal 6 karakter. Kode ini akan diberikan kepada admin baru secara langsung.
                                </p>
                            </div>

                            <motion.button
                                type="submit"
                                className="btn btn-primary btn-lg w-full"
                                disabled={isSubmitting || kodeTransfer.length < 6}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isSubmitting ? 'Memproses...' : 'Buat Kode Transfer'}
                            </motion.button>
                        </motion.form>
                    </>
                ) : (
                    <motion.div
                        className={styles.successContainer}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className={styles.iconSuccess}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>

                        <h1 className={styles.title}>Terima Kasih! 🎉</h1>
                        <p className={styles.subtitle}>
                            Terima kasih atas dedikasi dan kontribusi Anda selama menjabat sebagai Admin HMSI.
                            Semoga HMSI semakin maju di tangan kepemimpinan baru.
                        </p>

                        <div className={styles.linkBox}>
                            <label className="input-label">Link Registrasi Admin Baru</label>
                            <div className={styles.linkCopyContainer}>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={linkRegistrasi}
                                    readOnly
                                />
                                <button onClick={copyLink} className="btn btn-secondary">
                                    Salin
                                </button>
                            </div>
                            <p className={styles.note}>
                                Berikan link ini beserta <strong>kode transfer: {kodeTransfer}</strong> kepada admin baru.
                            </p>
                        </div>

                        <button onClick={keluar} className="btn btn-secondary w-full mt-4">
                            Keluar
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
