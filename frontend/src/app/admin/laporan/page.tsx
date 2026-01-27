'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import styles from './laporan.module.css';

interface Rapat {
    id: number;
    nama: string;
    tanggal_rapat: string;
    jenis_rapat?: { nama: string };
    jumlah_hadir: number;
}

interface StatistikAnggota {
    id: number;
    nama_lengkap: string;
    nim: string;
    divisi?: { nama: string };
    total_hadir: number;
    total_rapat: number;
    persentase: number;
}

export default function LaporanPage() {
    const [rapat, setRapat] = useState<Rapat[]>([]);
    const [statistik, setStatistik] = useState<StatistikAnggota[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'rapat' | 'anggota'>('rapat');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rapatRes, statRes] = await Promise.all([
                    api.semuaRapat(),
                    api.statistikAnggota(),
                ]);
                setRapat(Array.isArray(rapatRes.data) ? rapatRes.data : []);
                setStatistik(Array.isArray(statRes.data) ? statRes.data : []);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleExportExcel = (rapatId: number) => {
        window.open(api.eksporExcelUrl(rapatId), '_blank');
    };

    const handleExportPdf = (rapatId: number) => {
        window.open(api.eksporPdfUrl(rapatId), '_blank');
    };

    if (loading) {
        return <div className={styles.loadingContainer}><div className="loader"></div></div>;
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.container}>
            <div className={styles.header}>
                <h1>Laporan Kehadiran</h1>
                <p>Unduh laporan kehadiran dalam format Excel atau PDF</p>
            </div>

            <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === 'rapat' ? styles.tabActive : ''}`} onClick={() => setActiveTab('rapat')}>Per Rapat</button>
                <button className={`${styles.tab} ${activeTab === 'anggota' ? styles.tabActive : ''}`} onClick={() => setActiveTab('anggota')}>Per Anggota</button>
            </div>

            {activeTab === 'rapat' ? (
                <motion.div
                    className={styles.tableContainer}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Nama Rapat</th>
                                <th>Jenis</th>
                                <th>Hadir</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rapat.map((r, index) => (
                                <motion.tr
                                    key={r.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                >
                                    <td>{new Date(r.tanggal_rapat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td><strong>{r.nama}</strong></td>
                                    <td>{r.jenis_rapat?.nama || '-'}</td>
                                    <td><span className="badge badge-success">{r.jumlah_hadir}</span></td>
                                    <td>
                                        <div className={styles.exportBtns}>
                                            <button className={styles.exportBtn} onClick={() => handleExportExcel(r.id)} title="Download Excel">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                                                </svg>
                                                Excel
                                            </button>
                                            <button className={styles.exportBtn} onClick={() => handleExportPdf(r.id)} title="Download PDF">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                                                </svg>
                                                PDF
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                    {rapat.length === 0 && <div className={styles.emptyTable}>Belum ada rapat</div>}
                </motion.div>
            ) : (
                <motion.div
                    className={styles.tableContainer}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>NIM</th>
                                <th>Divisi</th>
                                <th>Hadir</th>
                                <th>Total</th>
                                <th>Persentase</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statistik.map((s, index) => (
                                <motion.tr
                                    key={s.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                >
                                    <td><strong>{s.nama_lengkap}</strong></td>
                                    <td>{s.nim}</td>
                                    <td>{s.divisi?.nama || '-'}</td>
                                    <td>{s.total_hadir}</td>
                                    <td>{s.total_rapat}</td>
                                    <td>
                                        <span className={`badge ${s.persentase >= 75 ? 'badge-success' : s.persentase >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                                            {s.persentase}%
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                    {statistik.length === 0 && <div className={styles.emptyTable}>Belum ada data</div>}
                </motion.div>
            )}
        </motion.div>
    );
}
