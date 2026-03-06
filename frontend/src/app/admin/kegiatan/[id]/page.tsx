'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
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
        nama_panggilan: string;
        tipe_anggota: 'presidium' | 'staff';
        divisi?: { id: number; nama: string };
    };
}

interface KegiatanDetail {
    id: number;
    nama: string;
    deskripsi?: string;
    tanggal_kegiatan: string;
    waktu_kegiatan?: string;
    lokasi?: string;
    kode_qr: string;
    dipublikasikan: boolean;
    dipublikasikan_pada?: string;
    kadaluarsa_pada?: string;
    kehadiran: Kehadiran[];
}

export default function KegiatanDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [kegiatan, setKegiatan] = useState<KegiatanDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFullscreenQR, setShowFullscreenQR] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await api.detailKegiatan(Number(params.id));
            if (res.sukses && res.data) {
                setKegiatan(res.data as KegiatanDetail);
            } else {
                setError('Kegiatan tidak ditemukan');
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
        if (showFullscreenQR && kegiatan?.dipublikasikan) {
            const interval = setInterval(fetchData, 10000);
            return () => clearInterval(interval);
        }
    }, [showFullscreenQR, kegiatan?.dipublikasikan, fetchData]);

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

    const handlePublish = async () => {
        if (!kegiatan) return;
        try {
            await api.publikasikanKegiatan(kegiatan.id, 120);
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Gagal mempublikasikan');
        }
    };

    const handleUnpublish = async () => {
        if (!kegiatan) return;
        if (!confirm('Yakin ingin membatalkan publikasi QR?')) return;
        try {
            await api.batalkanPublikasiKegiatan(kegiatan.id);
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Gagal membatalkan publikasi');
        }
    };

    if (loading) {
        return (
            <div className="loader-overlay">
                <PremiumLoader size="lg" />
            </div>
        );
    }

    if (error || !kegiatan) {
        return (
            <div className={styles.errorContainer}>
                <h2>Kegiatan Tidak Ditemukan</h2>
                <p>{error}</p>
                <Link href="/admin/kegiatan" className="btn btn-primary">Kembali</Link>
            </div>
        );
    }

    const isActive = kegiatan.dipublikasikan && !isExpired(kegiatan.kadaluarsa_pada);

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Fullscreen QR Modal */}
            <AnimatePresence>
                {showFullscreenQR && (
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
                                <QRCodeSVG value={kegiatan.kode_qr} size={280} level="H" includeMargin />
                            </div>
                            <div className={styles.fullscreenInfo}>
                                <h1>{kegiatan.nama}</h1>
                                <p>{formatDate(kegiatan.tanggal_kegiatan)} {kegiatan.waktu_kegiatan && `• ${formatTime(kegiatan.waktu_kegiatan)} WIB`}</p>
                                {kegiatan.lokasi && <p className={styles.fullscreenLokasi}>{kegiatan.lokasi}</p>}
                            </div>
                            <div className={styles.fullscreenStats}>
                                <div className={styles.statItem}>
                                    <span className={styles.statNumber}>{kegiatan.kehadiran.length}</span>
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
                <Link href="/admin/kegiatan" className={styles.backBtn}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Kembali
                </Link>
                <div className={styles.headerInfo}>
                    <h1>{kegiatan.nama}</h1>
                    <div className={styles.headerMeta}>
                        <span className={`badge ${isActive ? 'badge-success' : isExpired(kegiatan.kadaluarsa_pada) ? 'badge-warning' : 'badge-secondary'}`}>
                            {isActive ? 'Aktif' : isExpired(kegiatan.kadaluarsa_pada) ? 'Kadaluarsa' : 'Draft'}
                        </span>
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
                    <div className={styles.qrContainer}>
                        <QRCodeSVG value={kegiatan.kode_qr} size={250} level="H" includeMargin />
                        {isActive && (
                            <p className={styles.qrStatus}>
                                <span className={styles.statusDot}></span>
                                QR Aktif
                            </p>
                        )}
                        <div className={styles.qrActions}>
                            {!kegiatan.dipublikasikan ? (
                                <button className={styles.publishBtn} onClick={handlePublish}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    Publikasikan QR
                                </button>
                            ) : (
                                <button className={styles.unpublishBtn} onClick={handleUnpublish}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    Batalkan Publikasi
                                </button>
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
                    </div>
                </motion.div>

                {/* Info Section */}
                <motion.div
                    className={styles.infoSection}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3>Informasi Kegiatan</h3>
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
                                <strong>{formatDate(kegiatan.tanggal_kegiatan)}</strong>
                            </div>
                        </div>
                        {kegiatan.waktu_kegiatan && (
                            <div className={styles.infoItem}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <div>
                                    <span>Waktu</span>
                                    <strong>{formatTime(kegiatan.waktu_kegiatan)} WIB</strong>
                                </div>
                            </div>
                        )}
                        {kegiatan.lokasi && (
                            <div className={styles.infoItem}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                <div>
                                    <span>Lokasi</span>
                                    <strong>{kegiatan.lokasi}</strong>
                                </div>
                            </div>
                        )}
                    </div>
                    {kegiatan.deskripsi && (
                        <div className={styles.description}>
                            <h4>Deskripsi</h4>
                            <p>{kegiatan.deskripsi}</p>
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
                    <span className="badge badge-primary">{kegiatan.kehadiran.length} hadir</span>
                </div>
                {kegiatan.kehadiran.length > 0 ? (
                    <div className={styles.tableContainer}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Nama</th>
                                    <th>Tipe</th>
                                    <th>Waktu Scan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kegiatan.kehadiran.map((k, i) => (
                                    <tr key={k.id}>
                                        <td>{i + 1}</td>
                                        <td>{k.pengguna.nama_lengkap}</td>
                                        <td>
                                            <span className={`badge ${k.pengguna.tipe_anggota === 'presidium' ? 'badge-primary' : 'badge-secondary'}`}>
                                                {k.pengguna.tipe_anggota === 'presidium' ? 'Presidium' : 'Staff'}
                                            </span>
                                        </td>
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
