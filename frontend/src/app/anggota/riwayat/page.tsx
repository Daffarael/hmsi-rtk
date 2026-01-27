'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import styles from './riwayat.module.css';

interface Kehadiran {
    id: number;
    waktu_scan: string;
    rapat: {
        id: number;
        nama: string;
        tanggal_rapat: string;
        lokasi?: string;
        jenis_rapat?: { nama: string };
    };
}

export default function RiwayatPage() {
    const [kehadiran, setKehadiran] = useState<Kehadiran[]>([]);
    const [stats, setStats] = useState({ totalHadir: 0, totalRapat: 0, persentase: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.riwayatSaya();
                if (res.sukses && res.data) {
                    const data = res.data as { kehadiran?: Kehadiran[]; total_hadir?: number; total_rapat?: number; persentase?: number };
                    setKehadiran(Array.isArray(data.kehadiran) ? data.kehadiran : []);
                    setStats({
                        totalHadir: data.total_hadir || 0,
                        totalRapat: data.total_rapat || 0,
                        persentase: data.persentase || 0,
                    });
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className={styles.header}>
                <h1>Riwayat Kehadiran</h1>
                <p>Catatan kehadiran Anda di setiap rapat</p>
            </div>

            {/* Stats Summary */}
            <motion.div
                className={styles.statsCard}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <div className={styles.progressRing}>
                    <svg viewBox="0 0 36 36" className={styles.progressSvg}>
                        <path
                            className={styles.progressBg}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                            className={styles.progressFill}
                            strokeDasharray={`${stats.persentase}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <div className={styles.progressValue}>{stats.persentase}%</div>
                </div>
                <div className={styles.statsInfo}>
                    <h3>Tingkat Kehadiran</h3>
                    <p>Anda hadir di <strong>{stats.totalHadir}</strong> dari <strong>{stats.totalRapat}</strong> rapat</p>
                </div>
            </motion.div>

            {/* Attendance List */}
            {kehadiran.length > 0 ? (
                <div className={styles.listContainer}>
                    {kehadiran.map((item, index) => (
                        <motion.div
                            key={item.id}
                            className={styles.listItem}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                        >
                            <div className={styles.itemDate}>
                                <span className={styles.day}>{new Date(item.rapat.tanggal_rapat).getDate()}</span>
                                <span className={styles.month}>
                                    {new Date(item.rapat.tanggal_rapat).toLocaleDateString('id-ID', { month: 'short' })}
                                </span>
                            </div>
                            <div className={styles.itemInfo}>
                                <h4>{item.rapat.nama}</h4>
                                <p>
                                    {item.rapat.jenis_rapat?.nama || 'Rapat'}
                                    {item.rapat.lokasi && ` • ${item.rapat.lokasi}`}
                                </p>
                            </div>
                            <div className={styles.itemTime}>
                                <span className="badge badge-success">Hadir</span>
                                <span className={styles.scanTime}>
                                    {new Date(item.waktu_scan).toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <p>Belum ada riwayat kehadiran</p>
                </div>
            )}
        </motion.div>
    );
}
