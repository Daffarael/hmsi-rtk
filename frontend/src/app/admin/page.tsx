'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import styles from './dasbor.module.css';

interface Stats {
    totalAnggota: number;
    totalRapat: number;
    rapatBulanIni: number;
    rataKehadiran: number;
}

export default function AdminDashboard() {
    const { pengguna } = useAuth();
    const [stats, setStats] = useState<Stats>({
        totalAnggota: 0,
        totalRapat: 0,
        rapatBulanIni: 0,
        rataKehadiran: 0,
    });
    const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [penggunaRes, rapatRes] = await Promise.all([
                    api.semuaPengguna(),
                    api.semuaRapat(),
                ]);

                const anggota = Array.isArray(penggunaRes.data) ? penggunaRes.data : [];
                const rapat = Array.isArray(rapatRes.data) ? rapatRes.data : [];

                // Calculate stats
                const now = new Date();
                const thisMonth = rapat.filter((r: any) => {
                    const date = new Date(r.tanggal_rapat);
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                });

                const totalHadir = rapat.reduce((acc: number, r: any) => acc + (r.jumlah_hadir || 0), 0);
                const avgKehadiran = rapat.length > 0 ? Math.round((totalHadir / (rapat.length * anggota.length)) * 100) : 0;

                setStats({
                    totalAnggota: anggota.length,
                    totalRapat: rapat.length,
                    rapatBulanIni: thisMonth.length,
                    rataKehadiran: avgKehadiran || 0,
                });

                setRecentMeetings(rapat.slice(0, 5));
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

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
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Welcome */}
            <motion.div className={styles.welcome} variants={itemVariants}>
                <h1>Selamat Datang, {pengguna?.nama_panggilan}! <span className={styles.waveEmoji}>👋</span></h1>
                <p>Berikut ringkasan data HMSI periode {pengguna?.periode?.nama}</p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div className={styles.statsGrid} variants={itemVariants}>
                <motion.div className={styles.statCard} whileHover={{ scale: 1.02 }}>
                    <div className={styles.statIcon} style={{ background: 'var(--utama-100)', color: 'var(--utama-600)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className={styles.statInfo}>
                        <p className={styles.statValue}>{stats.totalAnggota}</p>
                        <p className={styles.statLabel}>Total Anggota</p>
                    </div>
                </motion.div>

                <motion.div className={styles.statCard} whileHover={{ scale: 1.02 }}>
                    <div className={styles.statIcon} style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <div className={styles.statInfo}>
                        <p className={styles.statValue}>{stats.totalRapat}</p>
                        <p className={styles.statLabel}>Total Rapat</p>
                    </div>
                </motion.div>

                <motion.div className={styles.statCard} whileHover={{ scale: 1.02 }}>
                    <div className={styles.statIcon} style={{ background: 'var(--sukses-light)', color: 'var(--sukses)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                    </div>
                    <div className={styles.statInfo}>
                        <p className={styles.statValue}>{stats.rapatBulanIni}</p>
                        <p className={styles.statLabel}>Rapat Bulan Ini</p>
                    </div>
                </motion.div>

                <motion.div className={styles.statCard} whileHover={{ scale: 1.02 }}>
                    <div className={styles.statIcon} style={{ background: 'var(--peringatan-light)', color: 'var(--peringatan)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <div className={styles.statInfo}>
                        <p className={styles.statValue}>{stats.rataKehadiran}%</p>
                        <p className={styles.statLabel}>Rata-rata Kehadiran</p>
                    </div>
                </motion.div>
            </motion.div>

            {/* Recent Meetings */}
            <motion.div className={styles.section} variants={itemVariants}>
                <div className={styles.sectionHeader}>
                    <h2>Rapat Terbaru</h2>
                    <a href="/admin/rapat" className={styles.viewAll}>Lihat Semua →</a>
                </div>

                {recentMeetings.length > 0 ? (
                    <div className={styles.meetingsList}>
                        {recentMeetings.map((rapat, index) => (
                            <motion.div
                                key={rapat.id}
                                className={styles.meetingCard}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className={styles.meetingDate}>
                                    <span className={styles.meetingDay}>
                                        {new Date(rapat.tanggal_rapat).getDate()}
                                    </span>
                                    <span className={styles.meetingMonth}>
                                        {new Date(rapat.tanggal_rapat).toLocaleDateString('id-ID', { month: 'short' })}
                                    </span>
                                </div>
                                <div className={styles.meetingInfo}>
                                    <h4>{rapat.nama}</h4>
                                    <p>{rapat.jenis_rapat?.nama || 'Tidak ada jenis'} • {rapat.lokasi || 'Lokasi belum ditentukan'}</p>
                                </div>
                                <div className={styles.meetingStatus}>
                                    {rapat.dipublikasikan ? (
                                        <span className="badge badge-success">Aktif</span>
                                    ) : (
                                        <span className="badge badge-warning">Draft</span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <p>Belum ada rapat yang dibuat</p>
                        <button className="btn btn-primary" onClick={() => window.location.href = '/admin/rapat'}>Buat Rapat Pertama</button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
