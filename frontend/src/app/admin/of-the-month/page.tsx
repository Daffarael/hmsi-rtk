'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import styles from './of-the-month.module.css';

interface Pengguna {
    id: number;
    nama_lengkap: string;
    nama_panggilan: string;
    tipe_anggota?: 'presidium' | 'staff';
    divisi?: { id: number; nama: string };
}

interface RekomItem {
    pengguna: Pengguna;
    piket: number;
    rapat: number;
    kegiatan: number;
    skor: number;
}

interface HistoryItem {
    id: number;
    bulan: number;
    tahun: number;
    tipe: 'presidium' | 'staff';
    skor: number;
    pengguna: Pengguna;
}

const BULAN_LABEL = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function OfTheMonthPage() {
    const [loading, setLoading] = useState(true);
    const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth() + 1);
    const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear());

    const [rekomendasi, setRekomendasi] = useState<{ presidium: RekomItem | null; staff: RekomItem | null }>({ presidium: null, staff: null });
    const [top5, setTop5] = useState<{ presidium: RekomItem[]; staff: RekomItem[] }>({ presidium: [], staff: [] });
    const [sudahDipilih, setSudahDipilih] = useState<{ presidium: HistoryItem | null; staff: HistoryItem | null }>({ presidium: null, staff: null });
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const [showSelectModal, setShowSelectModal] = useState(false);
    const [selectTipe, setSelectTipe] = useState<'presidium' | 'staff'>('presidium');
    const [selectedPengguna, setSelectedPengguna] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rekomenRes, historyRes] = await Promise.all([
                api.getRekomendasi(selectedBulan, selectedTahun),
                api.getHistoryOtm()
            ]) as [{ data: { rekomendasi: typeof rekomendasi; top5: typeof top5; sudahDipilih: typeof sudahDipilih } }, { data: HistoryItem[] }];

            setRekomendasi(rekomenRes.data.rekomendasi);
            setTop5(rekomenRes.data.top5);
            setSudahDipilih(rekomenRes.data.sudahDipilih);
            setHistory(historyRes.data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedBulan, selectedTahun]);

    const openSelectModal = (tipe: 'presidium' | 'staff') => {
        setSelectTipe(tipe);
        const current = tipe === 'presidium' ? rekomendasi.presidium : rekomendasi.staff;
        setSelectedPengguna(current?.pengguna.id || null);
        setShowSelectModal(true);
    };

    const handleSelect = async () => {
        if (!selectedPengguna) return;
        try {
            await api.pilihOfTheMonth(selectedBulan, selectedTahun, selectTipe, selectedPengguna);
            setShowSelectModal(false);
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Gagal menyimpan');
        }
    };

    const getCandidateList = () => {
        return selectTipe === 'presidium' ? top5.presidium : top5.staff;
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
                    <h1>🏆 Of The Month</h1>
                    <p>Pilih Presidium dan Staff terbaik bulan ini</p>
                </div>
            </div>

            {/* Month Selector */}
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
            </div>

            {loading ? (
                <div className={styles.loadingContainer}>
                    <div className="loader"></div>
                </div>
            ) : (
                <>
                    {/* Selection Cards */}
                    <div className={styles.selectionGrid}>
                        {/* Presidium Card */}
                        <div className={styles.selectionCard}>
                            <div className={styles.selectionHeader}>
                                <h3>🏅 Presidium of the Month</h3>
                            </div>
                            <div className={styles.selectionBody}>
                                {sudahDipilih.presidium ? (
                                    <div className={styles.winnerCard}>
                                        <div className={styles.trophy}>🏆</div>
                                        <h4>{sudahDipilih.presidium.pengguna.nama_panggilan}</h4>
                                        <p>Skor: {sudahDipilih.presidium.skor}</p>
                                        <span className={styles.selected}>Sudah Dipilih</span>
                                    </div>
                                ) : rekomendasi.presidium ? (
                                    <div className={styles.recommendCard}>
                                        <p className={styles.recLabel}>Rekomendasi:</p>
                                        <h4>{rekomendasi.presidium.pengguna.nama_panggilan}</h4>
                                        <p>Skor: {rekomendasi.presidium.skor}</p>
                                        <button className="btn btn-primary" onClick={() => openSelectModal('presidium')}>
                                            Pilih / Ubah
                                        </button>
                                    </div>
                                ) : (
                                    <p className={styles.noData}>Belum ada data</p>
                                )}
                            </div>
                        </div>

                        {/* Staff Card */}
                        <div className={styles.selectionCard}>
                            <div className={styles.selectionHeader}>
                                <h3>⭐ Staff of the Month</h3>
                            </div>
                            <div className={styles.selectionBody}>
                                {sudahDipilih.staff ? (
                                    <div className={styles.winnerCard}>
                                        <div className={styles.trophy}>🏆</div>
                                        <h4>{sudahDipilih.staff.pengguna.nama_panggilan}</h4>
                                        <p>Skor: {sudahDipilih.staff.skor}</p>
                                        <span className={styles.selected}>Sudah Dipilih</span>
                                    </div>
                                ) : rekomendasi.staff ? (
                                    <div className={styles.recommendCard}>
                                        <p className={styles.recLabel}>Rekomendasi:</p>
                                        <h4>{rekomendasi.staff.pengguna.nama_panggilan}</h4>
                                        <p>Skor: {rekomendasi.staff.skor}</p>
                                        <button className="btn btn-primary" onClick={() => openSelectModal('staff')}>
                                            Pilih / Ubah
                                        </button>
                                    </div>
                                ) : (
                                    <p className={styles.noData}>Belum ada data</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* History */}
                    <div className={styles.historySection}>
                        <h2>📜 History Of The Month</h2>
                        {history.length > 0 ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Bulan</th>
                                            <th>Tipe</th>
                                            <th>Nama</th>
                                            <th>Skor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((h) => (
                                            <tr key={h.id}>
                                                <td>{BULAN_LABEL[h.bulan - 1]} {h.tahun}</td>
                                                <td>
                                                    <span className={`${styles.tipeBadge} ${h.tipe === 'presidium' ? styles.presidium : styles.staff}`}>
                                                        {h.tipe === 'presidium' ? 'Presidium' : 'Staff'}
                                                    </span>
                                                </td>
                                                <td>{h.pengguna?.nama_panggilan || '-'}</td>
                                                <td>{h.skor}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className={styles.noHistory}>Belum ada history</p>
                        )}
                    </div>
                </>
            )}

            {/* Selection Modal */}
            <AnimatePresence>
                {showSelectModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                            <div className="modal-header">
                                <h3>Pilih {selectTipe === 'presidium' ? 'Presidium' : 'Staff'} of the Month</h3>
                            </div>
                            <div className="modal-body">
                                <p style={{ marginBottom: '1rem', color: 'var(--abu-500)' }}>
                                    Top 5 berdasarkan skor kehadiran:
                                </p>
                                <div className={styles.candidateList}>
                                    {getCandidateList().map((item, i) => (
                                        <label key={item.pengguna.id} className={styles.candidateItem}>
                                            <input
                                                type="radio"
                                                name="candidate"
                                                value={item.pengguna.id}
                                                checked={selectedPengguna === item.pengguna.id}
                                                onChange={() => setSelectedPengguna(item.pengguna.id)}
                                            />
                                            <span className={styles.rank}>{i + 1}</span>
                                            <span className={styles.name}>{item.pengguna.nama_panggilan}</span>
                                            <span className={styles.skor}>Skor: {item.skor}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowSelectModal(false)}>Batal</button>
                                <button className="btn btn-primary" onClick={handleSelect} disabled={!selectedPengguna}>
                                    Konfirmasi Pilihan
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
