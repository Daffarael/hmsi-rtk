'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/lib/api';
import styles from './piket.module.css';

interface Pengguna {
    id: number;
    nama_lengkap: string;
    nama_panggilan: string;
    nim: string;
    divisi?: { id: number; nama: string };
}

interface JadwalPiket {
    id: number;
    hari: string;
    pengguna: Pengguna;
}

interface JadwalPerHari {
    senin: JadwalPiket[];
    selasa: JadwalPiket[];
    rabu: JadwalPiket[];
    kamis: JadwalPiket[];
    jumat: JadwalPiket[];
}

interface KehadiranItem {
    tanggal: string;
    minggu_ke: number;
    hadir: boolean;
    sudah_lewat: boolean;
    kehadiran_id: number | null;
    ada_bukti: boolean;
}

interface BuktiItem {
    id: number;
    tipe: string;
    url: string;
    dibuat_pada: string;
}

interface RekapKehadiran {
    jadwal_id: number;
    pengguna: { id: number; nama_lengkap: string; nama_panggilan: string };
    hari: string;
    kehadiran: KehadiranItem[];
}

const HARI_LIST = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'] as const;
const HARI_LABEL: Record<string, string> = {
    senin: 'Senin',
    selasa: 'Selasa',
    rabu: 'Rabu',
    kamis: 'Kamis',
    jumat: 'Jumat'
};

const BULAN_LABEL = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function PiketPage() {
    const [activeTab, setActiveTab] = useState<'jadwal' | 'kehadiran'>('jadwal');
    const [loading, setLoading] = useState(true);
    const [jadwalPerHari, setJadwalPerHari] = useState<JadwalPerHari>({
        senin: [], selasa: [], rabu: [], kamis: [], jumat: []
    });
    const [selectedHari, setSelectedHari] = useState<string>('senin');
    const [anggotaTersedia, setAnggotaTersedia] = useState<Pengguna[]>([]);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrData, setQrData] = useState<{ kode_qr: string; periode: string } | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [jadwalToDelete, setJadwalToDelete] = useState<{ id: number; nama: string; hari: string } | null>(null);

    // Kehadiran states
    const [kehadiranData, setKehadiranData] = useState<{ bulan: number; tahun: number; rekap: RekapKehadiran[] } | null>(null);
    const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth() + 1);
    const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear());

    // Bukti piket viewer
    const [showBuktiModal, setShowBuktiModal] = useState(false);
    const [buktiPhotos, setBuktiPhotos] = useState<BuktiItem[]>([]);
    const [buktiLoading, setBuktiLoading] = useState(false);

    const fetchJadwal = async () => {
        setLoading(true);
        try {
            const res = await api.getJadwalPiket();
            if (res.sukses) {
                setJadwalPerHari(res.data as JadwalPerHari);
            }
        } catch (error) {
            console.error('Error fetching jadwal:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnggotaTersedia = async (hari: string) => {
        try {
            const res = await api.anggotaTersedia(hari);
            if (res.sukses) {
                setAnggotaTersedia(res.data as Pengguna[]);
            }
        } catch (error) {
            console.error('Error fetching anggota:', error);
        }
    };

    const fetchKehadiran = async () => {
        setLoading(true);
        try {
            const res = await api.getKehadiranPiket(selectedBulan, selectedTahun);
            if (res.sukses) {
                setKehadiranData(res.data as any);
            }
        } catch (error) {
            console.error('Error fetching kehadiran:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchQR = async () => {
        try {
            const res = await api.getQRPiket();
            if (res.sukses) {
                setQrData(res.data as any);
                setShowQRModal(true);
            }
        } catch (error: any) {
            alert(error.message || 'Gagal mengambil QR');
        }
    };

    useEffect(() => {
        fetchJadwal();
    }, []);

    useEffect(() => {
        if (activeTab === 'kehadiran') {
            fetchKehadiran();
        }
    }, [activeTab, selectedBulan, selectedTahun]);

    const openAddModal = async (hari: string) => {
        setSelectedHari(hari);
        await fetchAnggotaTersedia(hari);
        setShowAddModal(true);
    };

    const handleAddJadwal = async (penggunaId: number) => {
        try {
            await api.setJadwalPiket(penggunaId, selectedHari);
            setShowAddModal(false);
            fetchJadwal();
        } catch (error: any) {
            alert(error.message || 'Gagal menambahkan jadwal');
        }
    };

    // Open delete confirmation modal
    const openDeleteModal = (id: number, nama: string, hari: string) => {
        setJadwalToDelete({ id, nama, hari });
        setShowDeleteModal(true);
    };

    // Confirm delete
    const confirmDelete = async () => {
        if (!jadwalToDelete) return;
        try {
            await api.hapusJadwalPiket(jadwalToDelete.id);
            fetchJadwal();
            setShowDeleteModal(false);
            setJadwalToDelete(null);
        } catch (error: any) {
            alert(error.message || 'Gagal menghapus jadwal');
        }
    };

    // Toggle kehadiran (admin edit)
    const handleToggleKehadiran = async (jadwalId: number, tanggal: string, currentHadir: boolean) => {
        try {
            await api.toggleKehadiranPiket(jadwalId, tanggal, !currentHadir);
            fetchKehadiran();
        } catch (error: any) {
            alert(error.message || 'Gagal mengubah kehadiran');
        }
    };

    // View bukti piket photos
    const handleViewBukti = async (kehadiranId: number) => {
        setBuktiLoading(true);
        setShowBuktiModal(true);
        try {
            const res = await api.getBuktiPiket(kehadiranId);
            if (res.sukses) {
                setBuktiPhotos(res.data as BuktiItem[]);
            }
        } catch (error) {
            console.error('Error fetching bukti:', error);
        } finally {
            setBuktiLoading(false);
        }
    };

    // Get ALL minggu yang ada di bulan ini (across all days) - for consistent column alignment
    const getAllMingguList = (): number[] => {
        if (!kehadiranData?.rekap.length) return [];
        const mingguSet = new Set<number>();
        kehadiranData.rekap.forEach(r => {
            r.kehadiran.forEach(k => mingguSet.add(k.minggu_ke));
        });
        return Array.from(mingguSet).sort((a, b) => a - b);
    };

    // Get minggu ke-berapa yang ada untuk hari tertentu (for finding data)
    const getKehadiranForMinggu = (rekap: RekapKehadiran, minggu: number): KehadiranItem | undefined => {
        return rekap.kehadiran.find(k => k.minggu_ke === minggu);
    };

    // Group rekap by hari
    const getRekapByHari = (hari: string): RekapKehadiran[] => {
        if (!kehadiranData?.rekap.length) return [];
        return kehadiranData.rekap.filter(r => r.hari === hari);
    };

    // Get hari yang ada datanya
    const getHariWithData = (): string[] => {
        if (!kehadiranData?.rekap.length) return [];
        const hariSet = new Set<string>();
        kehadiranData.rekap.forEach(r => hariSet.add(r.hari));
        return HARI_LIST.filter(h => hariSet.has(h));
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
                    <h1>Kelola Piket</h1>
                    <p>Atur jadwal piket dan pantau kehadiran anggota</p>
                </div>
                <motion.button
                    className="btn btn-primary"
                    onClick={fetchQR}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                    </svg>
                    Lihat QR Piket
                </motion.button>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'jadwal' ? styles.active : ''}`}
                    onClick={() => setActiveTab('jadwal')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Jadwal Piket
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'kehadiran' ? styles.active : ''}`}
                    onClick={() => setActiveTab('kehadiran')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Kehadiran
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className={styles.loadingContainer}>
                    <div className="loader"></div>
                </div>
            ) : activeTab === 'jadwal' ? (
                /* Jadwal Tab */
                <div className={styles.jadwalGrid}>
                    {HARI_LIST.map((hari, index) => (
                        <motion.div
                            key={hari}
                            className={styles.hariCard}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className={styles.hariHeader}>
                                <h3>{HARI_LABEL[hari]}</h3>
                                <span className={styles.count}>{jadwalPerHari[hari]?.length || 0} anggota</span>
                            </div>
                            <div className={styles.anggotaList}>
                                {jadwalPerHari[hari]?.length > 0 ? (
                                    jadwalPerHari[hari].map((j) => (
                                        <div key={j.id} className={styles.anggotaItem}>
                                            <div className={styles.anggotaInfo}>
                                                <div className={styles.avatar}>
                                                    {j.pengguna.nama_panggilan.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className={styles.nama}>{j.pengguna.nama_panggilan}</span>
                                                    <span className={styles.divisi}>{j.pengguna.divisi?.nama || '-'}</span>
                                                </div>
                                            </div>
                                            <button
                                                className={styles.removeBtn}
                                                onClick={() => openDeleteModal(j.id, j.pengguna.nama_panggilan, hari)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className={styles.emptyHari}>Belum ada anggota</p>
                                )}
                            </div>
                            <button
                                className={styles.addBtn}
                                onClick={() => openAddModal(hari)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Tambah Anggota
                            </button>
                        </motion.div>
                    ))}
                </div>
            ) : (
                /* Kehadiran Tab */
                <div className={styles.kehadiranSection}>
                    <div className={styles.filterBar}>
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
                            {[2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    {getHariWithData().length > 0 ? (
                        <div className={styles.kehadiranGroups}>
                            {getHariWithData().map((hari) => (
                                <motion.div
                                    key={hari}
                                    className={styles.kehadiranGroup}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <h3 className={styles.hariGroupTitle}>
                                        <span className={styles.hariBadgeLarge}>{HARI_LABEL[hari]}</span>
                                    </h3>
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.kehadiranTable}>
                                            <thead>
                                                <tr>
                                                    <th>Nama</th>
                                                    {getAllMingguList().map(m => (
                                                        <th key={m}>Minggu {m}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getRekapByHari(hari).map((r) => (
                                                    <tr key={r.jadwal_id}>
                                                        <td>
                                                            <div className={styles.nameCell}>
                                                                <div className={styles.avatarSmall}>
                                                                    {r.pengguna.nama_panggilan.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span>{r.pengguna.nama_panggilan}</span>
                                                            </div>
                                                        </td>
                                                        {getAllMingguList().map(minggu => {
                                                            const kehadiran = getKehadiranForMinggu(r, minggu);
                                                            return (
                                                                <td key={minggu} className={styles.statusCell}>
                                                                    {kehadiran ? (
                                                                        <>
                                                                            <button
                                                                                className={styles.statusBtn}
                                                                                onClick={() => handleToggleKehadiran(r.jadwal_id, kehadiran.tanggal, kehadiran.hadir)}
                                                                                title={`${kehadiran.tanggal} - Klik untuk ${kehadiran.hadir ? 'hapus' : 'tambah'} kehadiran`}
                                                                            >
                                                                                {kehadiran.hadir ? (
                                                                                    <span className={styles.hadir}>✓</span>
                                                                                ) : kehadiran.sudah_lewat ? (
                                                                                    <span className={styles.absen}>✗</span>
                                                                                ) : (
                                                                                    <span className={styles.belum}>-</span>
                                                                                )}
                                                                            </button>
                                                                            {kehadiran.ada_bukti && kehadiran.kehadiran_id && (
                                                                                <button
                                                                                    className={styles.buktiBtn}
                                                                                    onClick={() => handleViewBukti(kehadiran.kehadiran_id!)}
                                                                                    title="Lihat bukti foto"
                                                                                >
                                                                                    📷 Bukti
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <span className={styles.noData}>-</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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
                            <p>Belum ada data kehadiran piket</p>
                        </div>
                    )}
                </div>
            )
            }

            {/* Add Anggota Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                            <div className="modal-header">
                                <h3>Tambah Anggota - {HARI_LABEL[selectedHari]}</h3>
                            </div>
                            <div className="modal-body">
                                {anggotaTersedia.length > 0 ? (
                                    <div className={styles.anggotaSelectList}>
                                        {anggotaTersedia.map((a) => (
                                            <div
                                                key={a.id}
                                                className={styles.anggotaSelectItem}
                                                onClick={() => handleAddJadwal(a.id)}
                                            >
                                                <div className={styles.avatar}>
                                                    {a.nama_panggilan.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className={styles.nama}>{a.nama_lengkap}</span>
                                                    <span className={styles.divisi}>{a.divisi?.nama || '-'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ textAlign: 'center', color: 'var(--abu-500)' }}>
                                        Semua anggota sudah dijadwalkan di hari ini
                                    </p>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Tutup</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* QR Modal */}
            <AnimatePresence>
                {showQRModal && qrData && (
                    <motion.div
                        className={`modal-overlay ${isFullscreen ? styles.fullscreenOverlay : ''}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className={`${isFullscreen ? styles.fullscreenModal : 'modal'}`}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                        >
                            {!isFullscreen && (
                                <div className="modal-header">
                                    <h3>QR Code Piket</h3>
                                </div>
                            )}
                            <div className={`modal-body ${styles.qrBody}`}>
                                <div className={styles.qrContainer}>
                                    <QRCodeSVG
                                        value={qrData.kode_qr}
                                        size={isFullscreen ? 400 : 250}
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>
                                <p className={styles.qrInfo}>
                                    Periode: <strong>{qrData.periode}</strong>
                                </p>
                                <p className={styles.qrHint}>
                                    QR ini berlaku selama periode aktif
                                </p>
                            </div>
                            <div className={`modal-footer ${styles.qrFooter}`}>
                                {!isFullscreen && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setIsFullscreen(true)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="15 3 21 3 21 9" />
                                            <polyline points="9 21 3 21 3 15" />
                                            <line x1="21" y1="3" x2="14" y2="10" />
                                            <line x1="3" y1="21" x2="10" y2="14" />
                                        </svg>
                                        Fullscreen
                                    </button>
                                )}
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => { setShowQRModal(false); setIsFullscreen(false); }}
                                >
                                    {isFullscreen ? 'Keluar Fullscreen' : 'Tutup'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && jadwalToDelete && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                        >
                            <div className="modal-header">
                                <h3>Konfirmasi Hapus</h3>
                            </div>
                            <div className="modal-body">
                                <div className={styles.deleteConfirmContent}>
                                    <div className={styles.deleteIcon}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            <line x1="10" y1="11" x2="10" y2="17" />
                                            <line x1="14" y1="11" x2="14" y2="17" />
                                        </svg>
                                    </div>
                                    <p>Apakah Anda yakin ingin menghapus jadwal piket:</p>
                                    <div className={styles.deleteInfo}>
                                        <strong>{jadwalToDelete.nama}</strong>
                                        <span>Hari {HARI_LABEL[jadwalToDelete.hari]}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => { setShowDeleteModal(false); setJadwalToDelete(null); }}
                                >
                                    Batal
                                </button>
                                <button
                                    className={`btn ${styles.btnDanger}`}
                                    onClick={confirmDelete}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                    Hapus
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )
                }
            </AnimatePresence >

            {/* Bukti Piket Modal */}
            <AnimatePresence>
                {showBuktiModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            style={{ maxWidth: '600px' }}
                        >
                            <div className="modal-header">
                                <h3>📷 Bukti Foto Piket</h3>
                            </div>
                            <div className="modal-body">
                                {buktiLoading ? (
                                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                                        <div className="loader"></div>
                                    </div>
                                ) : buktiPhotos.length > 0 ? (
                                    <div className={styles.buktiGroups}>
                                        {(['selfie', 'sekre_sebelum', 'sekre_sesudah'] as const).map(tipe => {
                                            const filtered = buktiPhotos.filter(b => b.tipe === tipe);
                                            if (filtered.length === 0) return null;
                                            return (
                                                <div key={tipe} className={styles.buktiGroup}>
                                                    <h4>
                                                        {tipe === 'selfie' && '📸 Selfie'}
                                                        {tipe === 'sekre_sebelum' && '🏢 Sekre (Sebelum)'}
                                                        {tipe === 'sekre_sesudah' && '✨ Sekre (Sesudah)'}
                                                    </h4>
                                                    <div className={styles.buktiPhotoGrid}>
                                                        {filtered.map(b => (
                                                            <a key={b.id} href={b.url} target="_blank" rel="noopener noreferrer" className={styles.buktiPhoto}>
                                                                <img src={b.url} alt={tipe} />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p style={{ textAlign: 'center', color: 'var(--abu-500)' }}>Tidak ada bukti foto</p>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => { setShowBuktiModal(false); setBuktiPhotos([]); }}>Tutup</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div >
    );
}
