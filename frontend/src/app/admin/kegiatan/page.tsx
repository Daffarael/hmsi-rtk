'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
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

export default function KegiatanPage() {
    const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState<Kegiatan | null>(null);

    const [formData, setFormData] = useState({
        nama: '',
        deskripsi: '',
        tanggal_kegiatan: '',
        waktu_kegiatan: '',
        lokasi: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Publikasi modal
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [publishKegiatan, setPublishKegiatan] = useState<Kegiatan | null>(null);
    const [durasiMenit, setDurasiMenit] = useState('120');

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

    const handlePublish = async () => {
        if (!publishKegiatan) return;
        try {
            await api.publikasikanKegiatan(publishKegiatan.id, parseInt(durasiMenit) || undefined);
            setShowPublishModal(false);
            fetchKegiatan();
        } catch (err: any) {
            alert(err.message || 'Gagal publikasi');
        }
    };

    const handleUnpublish = async (id: number) => {
        if (!confirm('Batalkan publikasi QR?')) return;
        try {
            await api.batalkanPublikasiKegiatan(id);
            fetchKegiatan();
        } catch (err: any) {
            alert(err.message || 'Gagal batalkan publikasi');
        }
    };

    const isExpired = (kadaluarsaPada: string | null) => {
        if (!kadaluarsaPada) return false;
        return new Date(kadaluarsaPada) < new Date();
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
                <div className={styles.kegiatanGrid}>
                    {kegiatan.map((k, index) => (
                        <motion.div
                            key={k.id}
                            className={styles.kegiatanCard}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.kegiatanDate}>
                                    <span className={styles.day}>{new Date(k.tanggal_kegiatan).getDate()}</span>
                                    <span className={styles.month}>
                                        {new Date(k.tanggal_kegiatan).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className={styles.kegiatanStatus}>
                                    {k.dipublikasikan ? (
                                        isExpired(k.kadaluarsa_pada) ? (
                                            <span className="badge badge-danger">Kadaluarsa</span>
                                        ) : (
                                            <span className="badge badge-success">Aktif</span>
                                        )
                                    ) : (
                                        <span className="badge badge-warning">Draft</span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.cardBody}>
                                <h3 className={styles.kegiatanNama}>{k.nama}</h3>
                                {k.lokasi && (
                                    <p className={styles.kegiatanLokasi}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        {k.lokasi}
                                    </p>
                                )}
                                <div className={styles.kegiatanStats}>
                                    <span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                        </svg>
                                        {k.jumlah_hadir} hadir
                                    </span>
                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                                {!k.dipublikasikan || isExpired(k.kadaluarsa_pada) ? (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => { setPublishKegiatan(k); setShowPublishModal(true); }}
                                    >
                                        Publikasi QR
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleUnpublish(k.id)}
                                    >
                                        Batalkan
                                    </button>
                                )}
                                <Link href={`/admin/kegiatan/${k.id}`} className="btn btn-secondary btn-sm">
                                    Detail
                                </Link>
                                <button className={styles.moreBtn} onClick={() => openEditModal(k)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button className={`${styles.moreBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(k.id, k.nama)}>
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

            {/* Publish Modal */}
            <AnimatePresence>
                {showPublishModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                            <div className="modal-header">
                                <h3>Publikasi QR Code</h3>
                            </div>
                            <div className="modal-body">
                                <p style={{ marginBottom: '1rem' }}>Publikasi QR untuk kegiatan <strong>{publishKegiatan?.nama}</strong></p>
                                <div className="input-group">
                                    <label className="input-label">Durasi Aktif (menit)</label>
                                    <input type="number" className="input-field" value={durasiMenit}
                                        onChange={(e) => setDurasiMenit(e.target.value)} placeholder="Kosongkan untuk tanpa batas" />
                                    <small style={{ color: 'var(--abu-500)', fontSize: '0.75rem' }}>
                                        Kosongkan jika tidak ingin ada batas waktu
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowPublishModal(false)}>Batal</button>
                                <button className="btn btn-primary" onClick={handlePublish}>Publikasi</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
