'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '@/lib/api';
import PremiumLoader from '@/components/PremiumLoader';
import styles from './detail.module.css';

interface Kehadiran {
    id: number;
    waktu_scan: string;
    pengguna: {
        id: number;
        nama_lengkap: string;
        nim: string;
        angkatan: string;
    };
}

interface RapatDetail {
    id: number;
    nama: string;
    deskripsi?: string;
    tanggal_rapat: string;
    waktu_rapat?: string;
    lokasi?: string;
    jenis_rapat?: { nama: string };
    dipublikasikan: boolean;
    dipublikasikan_pada?: string;
    kadaluarsa_pada?: string;
    qr_base64?: string;
    kehadiran: Kehadiran[];
    jumlah_hadir: number;
}

export default function RapatDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [rapat, setRapat] = useState<RapatDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFullscreenQR, setShowFullscreenQR] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await api.rapatById(Number(params.id));
            if (res.sukses && res.data) {
                setRapat(res.data as RapatDetail);
            } else {
                setError('Rapat tidak ditemukan');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto refresh kehadiran setiap 10 detik saat fullscreen
    useEffect(() => {
        if (showFullscreenQR && rapat?.dipublikasikan) {
            const interval = setInterval(fetchData, 10000);
            return () => clearInterval(interval);
        }
    }, [showFullscreenQR, rapat?.dipublikasikan, fetchData]);

    // Handle ESC key untuk keluar fullscreen
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowFullscreenQR(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (time: string) => {
        return time.slice(0, 5);
    };

    const isExpired = (expiry?: string) => {
        if (!expiry) return false;
        return new Date(expiry) < new Date();
    };

    if (loading) {
        return (
            <div className="loader-overlay">
                <PremiumLoader size="lg" />
            </div>
        );
    }

    if (error || !rapat) {
        return (
            <div className={styles.errorContainer}>
                <h2>Rapat Tidak Ditemukan</h2>
                <p>{error}</p>
                <Link href="/admin/rapat" className="btn btn-primary">Kembali</Link>
            </div>
        );
    }

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Fullscreen QR Modal */}
            <AnimatePresence>
                {showFullscreenQR && rapat.qr_base64 && (
                    <motion.div
                        className={styles.fullscreenOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowFullscreenQR(false)}
                    >
                        <motion.div
                            className={styles.fullscreenContent}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className={styles.closeFullscreen} onClick={() => setShowFullscreenQR(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                            <div className={styles.fullscreenQR}>
                                <img src={rapat.qr_base64} alt="QR Code" />
                            </div>
                            <div className={styles.fullscreenInfo}>
                                <h1>{rapat.nama}</h1>
                                <p>{formatDate(rapat.tanggal_rapat)} {rapat.waktu_rapat && `• ${formatTime(rapat.waktu_rapat)} WIB`}</p>
                                {rapat.lokasi && <p className={styles.fullscreenLokasi}>{rapat.lokasi}</p>}
                            </div>
                            <div className={styles.fullscreenStats}>
                                <div className={styles.statItem}>
                                    <span className={styles.statNumber}>{rapat.jumlah_hadir}</span>
                                    <span className={styles.statLabel}>Hadir</span>
                                </div>
                            </div>
                            <p className={styles.fullscreenHint}>Tekan ESC atau klik di luar untuk keluar</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className={styles.header}>
                <Link href="/admin/rapat" className={styles.backBtn}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Kembali
                </Link>
                <div className={styles.headerInfo}>
                    <h1>{rapat.nama}</h1>
                    <div className={styles.headerMeta}>
                        <span className={`badge ${rapat.dipublikasikan && !isExpired(rapat.kadaluarsa_pada) ? 'badge-success' : 'badge-warning'}`}>
                            {rapat.dipublikasikan && !isExpired(rapat.kadaluarsa_pada) ? 'Aktif' : isExpired(rapat.kadaluarsa_pada) ? 'Kadaluarsa' : 'Draft'}
                        </span>
                        {rapat.jenis_rapat && <span className="badge badge-primary">{rapat.jenis_rapat.nama}</span>}
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                {/* QR Code Section */}
                <motion.div
                    className={styles.qrSection}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <h3>QR Code Absensi</h3>
                    {rapat.qr_base64 ? (
                        <div className={styles.qrContainer}>
                            <img src={rapat.qr_base64} alt="QR Code" className={styles.qrImage} />
                            {rapat.dipublikasikan && !isExpired(rapat.kadaluarsa_pada) && (
                                <p className={styles.qrStatus}>
                                    <span className={styles.statusDot}></span>
                                    QR Aktif
                                </p>
                            )}
                            <button
                                className={styles.fullscreenBtn}
                                onClick={() => setShowFullscreenQR(true)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="15 3 21 3 21 9" />
                                    <polyline points="9 21 3 21 3 15" />
                                    <line x1="21" y1="3" x2="14" y2="10" />
                                    <line x1="3" y1="21" x2="10" y2="14" />
                                </svg>
                                Tampilkan Fullscreen
                            </button>
                        </div>
                    ) : (
                        <p className={styles.noQr}>QR belum dipublikasikan</p>
                    )}
                </motion.div>

                {/* Info Section */}
                <motion.div
                    className={styles.infoSection}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3>Informasi Rapat</h3>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <div>
                                <span>Tanggal</span>
                                <strong>{formatDate(rapat.tanggal_rapat)}</strong>
                            </div>
                        </div>
                        {rapat.waktu_rapat && (
                            <div className={styles.infoItem}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <div>
                                    <span>Waktu</span>
                                    <strong>{formatTime(rapat.waktu_rapat)} WIB</strong>
                                </div>
                            </div>
                        )}
                        {rapat.lokasi && (
                            <div className={styles.infoItem}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                <div>
                                    <span>Lokasi</span>
                                    <strong>{rapat.lokasi}</strong>
                                </div>
                            </div>
                        )}
                    </div>
                    {rapat.deskripsi && (
                        <div className={styles.description}>
                            <h4>Deskripsi</h4>
                            <p>{rapat.deskripsi}</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Kehadiran Section */}
            <motion.div
                className={styles.kehadiranSection}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className={styles.kehadiranHeader}>
                    <h3>Daftar Kehadiran</h3>
                    <span className="badge badge-primary">{rapat.jumlah_hadir} hadir</span>
                </div>
                {rapat.kehadiran.length > 0 ? (
                    <div className={styles.tableContainer}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Nama</th>
                                    <th>NIM</th>
                                    <th>Angkatan</th>
                                    <th>Waktu Scan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rapat.kehadiran.map((k, i) => (
                                    <tr key={k.id}>
                                        <td>{i + 1}</td>
                                        <td>{k.pengguna.nama_lengkap}</td>
                                        <td>{k.pengguna.nim}</td>
                                        <td>{k.pengguna.angkatan}</td>
                                        <td>{new Date(k.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={styles.emptyKehadiran}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                        <p>Belum ada yang hadir</p>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
