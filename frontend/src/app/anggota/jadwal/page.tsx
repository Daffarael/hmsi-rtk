'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import styles from './jadwal.module.css';

interface JadwalItem {
    tipe: 'rapat' | 'piket' | 'kegiatan';
    judul: string;
    waktu: string | null;
    tanggal: string;
    isHariIni: boolean;
    icon: string;
}

export default function JadwalPage() {
    const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJadwal = async () => {
            try {
                const res = await api.getPengingat();
                if (res.sukses && Array.isArray(res.data)) {
                    setJadwalList(res.data);
                }
            } catch (error) {
                console.error('Error fetching jadwal:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJadwal();
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <motion.div
                className={styles.header}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <h1><span className={styles.emoji}>📅</span> Jadwal Mendatang</h1>
                <p>Rapat, piket, dan kegiatan yang akan datang</p>
            </motion.div>

            {jadwalList.length > 0 ? (
                <motion.div
                    className={styles.jadwalList}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {jadwalList.map((item, index) => (
                        <motion.div
                            key={index}
                            className={`${styles.jadwalCard} ${item.isHariIni ? styles.urgent : ''}`}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                        >
                            <div className={styles.jadwalIcon}>{item.icon}</div>
                            <div className={styles.jadwalInfo}>
                                <div className={styles.jadwalBadge}>
                                    <span className={`${styles.tipeBadge} ${styles[item.tipe]}`}>
                                        {item.tipe === 'rapat' && 'Rapat'}
                                        {item.tipe === 'piket' && 'Piket'}
                                        {item.tipe === 'kegiatan' && 'Kegiatan'}
                                    </span>
                                    {item.isHariIni ? (
                                        <span className={styles.todayBadge}>Hari Ini</span>
                                    ) : (
                                        <span className={styles.tomorrowBadge}>Besok</span>
                                    )}
                                </div>
                                <h3 className={styles.jadwalName}>{item.judul}</h3>
                                <p className={styles.jadwalDate}>{formatDate(item.tanggal)}</p>
                                {item.waktu && (
                                    <p className={styles.jadwalTime}>🕐 Pukul {item.waktu}</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div
                    className={styles.emptyState}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <h3>Tidak Ada Jadwal</h3>
                    <p>Belum ada rapat, piket, atau kegiatan yang dijadwalkan dalam waktu dekat</p>
                </motion.div>
            )}
        </motion.div>
    );
}
