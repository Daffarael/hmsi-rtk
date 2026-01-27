'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import styles from './dasbor-anggota.module.css';

interface Pengingat {
    tipe: 'rapat' | 'piket' | 'kegiatan';
    judul: string;
    waktu: string | null;
    tanggal: string;
    isHariIni: boolean;
    icon: string;
}

export default function AnggotaDashboard() {
    const { pengguna } = useAuth();
    const [stats, setStats] = useState({ totalHadir: 0, totalRapat: 0, persentase: 0 });
    const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
    const [pengingat, setPengingat] = useState<Pengingat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch riwayat
                const res = await api.riwayatSaya();
                if (res.sukses && res.data) {
                    const data = res.data as { total_hadir?: number; total_rapat?: number; persentase?: number; kehadiran?: any[] };
                    setStats({
                        totalHadir: data.total_hadir || 0,
                        totalRapat: data.total_rapat || 0,
                        persentase: data.persentase || 0,
                    });
                    setRecentAttendance(Array.isArray(data.kehadiran) ? data.kehadiran.slice(0, 5) : []);
                }

                // Fetch pengingat
                const resPengingat = await api.getPengingat();
                if (resPengingat.sukses && Array.isArray(resPengingat.data)) {
                    setPengingat(resPengingat.data);
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
            {/* Welcome */}
            <motion.div
                className={styles.welcome}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <h1>Halo, {pengguna?.nama_panggilan}! <span className={styles.emoji}>👋</span></h1>
                <p>Selamat datang di sistem absensi HMSI</p>
            </motion.div>

            {/* Pengingat Section */}
            {pengingat.length > 0 && (
                <motion.div
                    className={styles.reminderSection}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                >
                    <h2 className={styles.reminderTitle}>🔔 Pengingat</h2>
                    <div className={styles.reminderList}>
                        {pengingat.map((item, index) => (
                            <div
                                key={index}
                                className={`${styles.reminderCard} ${item.isHariIni ? styles.urgent : ''}`}
                            >
                                <div className={styles.reminderIcon}>{item.icon}</div>
                                <div className={styles.reminderInfo}>
                                    <span className={styles.reminderLabel}>
                                        {item.tipe === 'rapat' && 'Rapat'}
                                        {item.tipe === 'piket' && 'Piket'}
                                        {item.tipe === 'kegiatan' && 'Kegiatan'}
                                    </span>
                                    <p className={styles.reminderName}>{item.judul}</p>
                                    {item.waktu && (
                                        <span className={styles.reminderTime}>
                                            Pukul {item.waktu}
                                        </span>
                                    )}
                                </div>
                                {item.isHariIni && (
                                    <span className={styles.todayBadge}>Hari Ini</span>
                                )}
                                {!item.isHariIni && (
                                    <span className={styles.tomorrowBadge}>Besok</span>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Quick Action */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <Link href="/anggota/scan" className={styles.scanButton}>
                    <div className={styles.scanIcon}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                            <rect x="7" y="7" width="10" height="10" />
                        </svg>
                    </div>
                    <div>
                        <span className={styles.scanTitle}>Scan QR Absensi</span>
                        <span className={styles.scanSubtitle}>Scan untuk mencatat kehadiran</span>
                    </div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
                className={styles.statsGrid}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.totalHadir}</div>
                    <div className={styles.statLabel}>Kehadiran</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.totalRapat}</div>
                    <div className={styles.statLabel}>Total Rapat</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statValue} ${stats.persentase >= 75 ? styles.good : styles.warning}`}>
                        {stats.persentase}%
                    </div>
                    <div className={styles.statLabel}>Persentase</div>
                </div>
            </motion.div>

            {/* Recent */}
            <motion.div
                className={styles.section}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <div className={styles.sectionHeader}>
                    <h2>Kehadiran Terakhir</h2>
                    <Link href="/anggota/riwayat" className={styles.viewAll}>Lihat Semua</Link>
                </div>

                {recentAttendance.length > 0 ? (
                    <div className={styles.attendanceList}>
                        {recentAttendance.map((item, index) => (
                            <motion.div
                                key={index}
                                className={styles.attendanceItem}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                            >
                                <div className={styles.attendanceIcon}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <div className={styles.attendanceInfo}>
                                    <p className={styles.attendanceName}>{item.rapat?.nama}</p>
                                    <p className={styles.attendanceDate}>
                                        {new Date(item.rapat?.tanggal_rapat).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className={styles.attendanceTime}>
                                    {new Date(item.waktu_scan).toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>Belum ada riwayat kehadiran</p>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
