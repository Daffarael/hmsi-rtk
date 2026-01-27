'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/lib/api';
import styles from './kegiatan.module.css';

interface Kegiatan {
    id: number;
    nama: string;
    deskripsi: string | null;
    tanggal_kegiatan: string;
    waktu_kegiatan: string | null;
    lokasi: string | null;
    kode_qr: string;
    dipublikasikan: boolean;
    dipublikasikan_pada: string | null;
    kadaluarsa_pada: string | null;
    jumlah_hadir: number;
}

interface Pengguna {
    id: number;
    nama_lengkap: string;
    nama_panggilan: string;
    tipe_anggota: 'presidium' | 'staff';
    divisi?: { id: number; nama: string };
}

interface Kehadiran {
    id: number;
    waktu_scan: string;
    pengguna: Pengguna;
}

export default function KegiatanPage() {
    const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [showKehadiranModal, setShowKehadiranModal] = useState(false);
    const [editData, setEditData] = useState<Kegiatan | null>(null);
    const [selectedKegiatan, setSelectedKegiatan] = useState<Kegiatan | null>(null);
    const [kehadiranList, setKehadiranList] = useState<Kehadiran[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [formData, setFormData] = useState({
        nama: '',
        deskripsi: '',
        tanggal_kegiatan: '',
        waktu_kegiatan: '',
        lokasi: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchKegiatan = async () => {
        try {
            const res = await api.semuaKegiatan();
            setKegiatan(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKegiatan();
    }, []);

    const openAddModal = () => {
        setEditData(null);
        setFormData({
            nama: '',
            deskripsi: '',
            tanggal_kegiatan: '',
            waktu_kegiatan: '',
            lokasi: '',
        });
        setError('');
        setShowModal(true);
    };

    const openEditModal = (data: Kegiatan) => {
        setEditData(data);
        setFormData({
            nama: data.nama,
            deskripsi: data.deskripsi || '',
            tanggal_kegiatan: data.tanggal_kegiatan.split('T')[0],
            waktu_kegiatan: data.waktu_kegiatan || '',
            lokasi: data.lokasi || '',
        });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (editData) {
                await api.editKegiatan(editData.id, formData);
            } else {
                await api.buatKegiatan(formData);
            }
            setShowModal(false);
            fetchKegiatan();
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number, nama: string) => {
        if (!confirm(`Yakin ingin menghapus "${nama}"?`)) return;
        try {
            await api.hapusKegiatan(id);
            fetchKegiatan();
        } catch (err: any) {
            alert(err.message || 'Gagal menghapus');
        }
    };

    const handlePublish = async (id: number) => {
        try {
            await api.publikasikanKegiatan(id, 120); // 2 jam
            fetchKegiatan();
        } catch (err: any) {
            alert(err.message || 'Gagal mempublikasikan');
        }
    };

    const openQRModal = (data: Kegiatan) => {
        setSelectedKegiatan(data);
        setShowQRModal(true);
    };

    const openKehadiranModal = async (data: Kegiatan) => {
        setSelectedKegiatan(data);
        try {
            const res = await api.kehadiranKegiatan(data.id);
            setKehadiranList((res.data as Kehadiran[]) || []);
            setShowKehadiranModal(true);
        } catch (err: any) {
            alert(err.message || 'Gagal memuat kehadiran');
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '-';
        return timeStr.slice(0, 5);
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
                    <h1>Kelola Kegiatan</h1>
                    <p>Buat dan kelola kegiatan HMSI</p>
                </div>
                <motion.button
                    className="btn btn-primary"
                    onClick={openAddModal}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Buat Kegiatan
                </motion.button>
            </div>

            {/* Content */}
            {loading ? (
                <div className={styles.loadingContainer}>
                    <div className="loader"></div>
                </div>
            ) : kegiatan.length > 0 ? (
                <div className={styles.grid}>
                    {kegiatan.map((k, index) => (
                        <motion.div
                            key={k.id}
                            className={styles.card}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className={styles.cardHeader}>
                                <h3>{k.nama}</h3>
                                <span className={`${styles.status} ${k.dipublikasikan ? styles.published : styles.draft}`}>
                                    {k.dipublikasikan ? 'Aktif' : 'Draft'}
                                </span>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.info}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    <span>{formatDate(k.tanggal_kegiatan)}</span>
                                </div>
                                {k.waktu_kegiatan && (
                                    <div className={styles.info}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        <span>{formatTime(k.waktu_kegiatan)}</span>
                                    </div>
                                )}
                                {k.lokasi && (
                                    <div className={styles.info}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <span>{k.lokasi}</span>
                                    </div>
                                )}
                                <div className={styles.info}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    <span>{k.jumlah_hadir} hadir</span>
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                {!k.dipublikasikan && (
                                    <button className={`${styles.actionBtn} ${styles.publishBtn}`} onClick={() => handlePublish(k.id)} title="Publikasikan">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    </button>
                                )}
                                <button className={styles.actionBtn} onClick={() => openQRModal(k)} title="Lihat QR">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="7" height="7" />
                                        <rect x="14" y="3" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                    </svg>
                                </button>
                                <button className={styles.actionBtn} onClick={() => openKehadiranModal(k)} title="Lihat Kehadiran">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <line x1="17" y1="11" x2="23" y2="11" />
                                    </svg>
                                </button>
                                <button className={styles.actionBtn} onClick={() => openEditModal(k)} title="Edit">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(k.id, k.nama)} title="Hapus">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                    <p>Belum ada kegiatan</p>
                    <button className="btn btn-primary" onClick={openAddModal}>Buat Kegiatan Pertama</button>
                </div>
            )}

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                            <div className="modal-header">
                                <h3>{editData ? 'Edit Kegiatan' : 'Buat Kegiatan Baru'}</h3>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-error mb-4">{error}</div>}

                                    <div className="input-group">
                                        <label className="input-label">Nama Kegiatan *</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={formData.nama}
                                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Deskripsi</label>
                                        <textarea
                                            className="input-field"
                                            rows={3}
                                            value={formData.deskripsi}
                                            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Tanggal *</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={formData.tanggal_kegiatan}
                                            onChange={(e) => setFormData({ ...formData, tanggal_kegiatan: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Waktu</label>
                                        <input
                                            type="time"
                                            className="input-field"
                                            value={formData.waktu_kegiatan}
                                            onChange={(e) => setFormData({ ...formData, waktu_kegiatan: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Lokasi</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={formData.lokasi}
                                            onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                        {isSubmitting ? 'Menyimpan...' : editData ? 'Perbarui' : 'Buat'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* QR Modal */}
            <AnimatePresence>
                {showQRModal && selectedKegiatan && (
                    <motion.div
                        className={`modal-overlay ${isFullscreen ? styles.fullscreenOverlay : ''}`}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className={`modal ${isFullscreen ? styles.fullscreenModal : ''}`}
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                        >
                            <div className="modal-header">
                                <h3>QR Kegiatan: {selectedKegiatan.nama}</h3>
                            </div>
                            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
                                <QRCodeSVG
                                    value={selectedKegiatan.kode_qr}
                                    size={isFullscreen ? 400 : 250}
                                    level="H"
                                    includeMargin
                                />
                                <p style={{ marginTop: '1rem', color: 'var(--abu-500)', fontSize: '0.875rem' }}>
                                    Scan QR untuk mencatat kehadiran
                                </p>
                            </div>
                            <div className="modal-footer">
                                {!isFullscreen && (
                                    <button className="btn btn-primary" onClick={() => setIsFullscreen(true)}>Fullscreen</button>
                                )}
                                <button className="btn btn-secondary" onClick={() => { setShowQRModal(false); setIsFullscreen(false); }}>
                                    {isFullscreen ? 'Keluar' : 'Tutup'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kehadiran Modal */}
            <AnimatePresence>
                {showKehadiranModal && selectedKegiatan && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="modal" style={{ maxWidth: '600px' }} initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                            <div className="modal-header">
                                <h3>Kehadiran: {selectedKegiatan.nama}</h3>
                            </div>
                            <div className="modal-body">
                                {kehadiranList.length > 0 ? (
                                    <div className="table-container">
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
                                                {kehadiranList.map((h, i) => (
                                                    <tr key={h.id}>
                                                        <td>{i + 1}</td>
                                                        <td>{h.pengguna.nama_panggilan}</td>
                                                        <td>
                                                            <span className={`${styles.tipeBadge} ${h.pengguna.tipe_anggota === 'presidium' ? styles.presidium : styles.staff}`}>
                                                                {h.pengguna.tipe_anggota === 'presidium' ? 'Presidium' : 'Staff'}
                                                            </span>
                                                        </td>
                                                        <td>{new Date(h.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p style={{ textAlign: 'center', color: 'var(--abu-500)' }}>Belum ada yang hadir</p>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowKehadiranModal(false)}>Tutup</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
