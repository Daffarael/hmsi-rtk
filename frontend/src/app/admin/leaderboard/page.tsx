'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import styles from './leaderboard.module.css';

interface LeaderboardItem {
    rank: number;
    pengguna: {
        id: number;
        nama_lengkap: string;
        nama_panggilan: string;
        tipe_anggota: 'presidium' | 'staff';
        divisi?: { id: number; nama: string };
    };
    piket: number;
    rapat: number;
    kegiatan: number;
    skor: number;
}

const BULAN_LABEL = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth() + 1);
    const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear());
    const [filterTipe, setFilterTipe] = useState<'all' | 'presidium' | 'staff'>('all');
    const [bobot, setBobot] = useState({ PIKET: 1, RAPAT: 2, KEGIATAN: 3 });

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const tipe = filterTipe === 'all' ? undefined : filterTipe;
            const res = await api.getLeaderboard(selectedBulan, selectedTahun, tipe) as { data: { leaderboard: LeaderboardItem[]; bobot: typeof bobot } };
            setLeaderboard(res.data.leaderboard || []);
            setBobot(res.data.bobot || { PIKET: 1, RAPAT: 2, KEGIATAN: 3 });
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [selectedBulan, selectedTahun, filterTipe]);

    const getRankBadge = (rank: number) => {
        if (rank === 1) return { emoji: '🥇', className: styles.gold };
        if (rank === 2) return { emoji: '🥈', className: styles.silver };
        if (rank === 3) return { emoji: '🥉', className: styles.bronze };
        return { emoji: rank.toString(), className: styles.normal };
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.container}
        >
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1>Leaderboard Kehadiran</h1>
                    <p>Peringkat anggota berdasarkan kehadiran piket, rapat, dan kegiatan</p>
                </div>
            </div>

            {/* Bobot Info */}
            <div className={styles.bobotInfo}>
                <span>Formula skor:</span>
                <code>Piket × {bobot.PIKET} + Rapat × {bobot.RAPAT} + Kegiatan × {bobot.KEGIATAN}</code>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <select
                    className="input-field"
                    value={selectedBulan}
                    onChange={(e) => setSelectedBulan(parseInt(e.target.value))}
                >
                    {BULAN_LABEL.map((b, i) => (
                        <option key={i} value={i + 1}>{b}</option>
                    ))}
                </select>
                <select
                    className="input-field"
                    value={selectedTahun}
                    onChange={(e) => setSelectedTahun(parseInt(e.target.value))}
                >
                    {[2024, 2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
                <select
                    className="input-field"
                    value={filterTipe}
                    onChange={(e) => setFilterTipe(e.target.value as 'all' | 'presidium' | 'staff')}
                >
                    <option value="all">Semua Tipe</option>
                    <option value="presidium">Presidium</option>
                    <option value="staff">Staff</option>
                </select>
            </div>

            {/* Leaderboard Table */}
            {loading ? (
                <div className={styles.loadingContainer}>
                    <div className="loader"></div>
                </div>
            ) : leaderboard.length > 0 ? (
                <motion.div
                    className="table-container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>Rank</th>
                                <th>Nama</th>
                                <th>Tipe</th>
                                <th>Divisi</th>
                                <th style={{ textAlign: 'center' }}>Piket</th>
                                <th style={{ textAlign: 'center' }}>Rapat</th>
                                <th style={{ textAlign: 'center' }}>Kegiatan</th>
                                <th style={{ textAlign: 'center' }}>Skor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((item, index) => {
                                const rankBadge = getRankBadge(item.rank);
                                return (
                                    <motion.tr
                                        key={item.pengguna.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={rankBadge.className}
                                    >
                                        <td>
                                            <span className={styles.rankBadge}>
                                                {rankBadge.emoji}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.nameCell}>
                                                <div className={styles.avatar}>
                                                    {item.pengguna.nama_panggilan.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className={styles.fullName}>{item.pengguna.nama_panggilan}</p>
                                                    <p className={styles.nickname}>{item.pengguna.nama_lengkap}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.tipeBadge} ${item.pengguna.tipe_anggota === 'presidium' ? styles.presidium : styles.staff}`}>
                                                {item.pengguna.tipe_anggota === 'presidium' ? 'Presidium' : 'Staff'}
                                            </span>
                                        </td>
                                        <td>{item.pengguna.divisi?.nama || '-'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={styles.statBadge}>{item.piket}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={styles.statBadge}>{item.rapat}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={styles.statBadge}>{item.kegiatan}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={styles.skorBadge}>{item.skor}</span>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </motion.div>
            ) : (
                <div className={styles.emptyState}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    <p>Belum ada data kehadiran untuk bulan ini</p>
                </div>
            )}
        </motion.div>
    );
}
